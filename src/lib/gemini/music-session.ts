/**
 * Lyria RealTime BGM WebSocket管理クラス
 *
 * @google/genai SDK の ai.live.music.connect() を使い、
 * ページの場面に応じたAI生成BGMをリアルタイム再生する。
 *
 * 出力: 16-bit PCM, 48kHz, ステレオ (Base64)
 */

import { GoogleGenAI } from '@google/genai'
import type {
  WeightedPrompt,
  LiveMusicGenerationConfig,
  LiveMusicServerMessage,
} from '@google/genai'

const LYRIA_MODEL = 'models/lyria-realtime-exp'
const SAMPLE_RATE = 48000
const NUM_CHANNELS = 2 // ステレオ
const BYTES_PER_SAMPLE = 2 // 16-bit
const MAX_RECONNECT_ATTEMPTS = 3
const BASE_RECONNECT_DELAY_MS = 1000

type MusicSessionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface MusicSessionCallbacks {
  onStateChange: (state: MusicSessionState) => void
  onError: (error: Error) => void
}

export class MusicSessionManager {
  private session: Awaited<ReturnType<GoogleGenAI['live']['music']['connect']>> | null = null
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private nextStartTime = 0
  private state: MusicSessionState = 'disconnected'
  private reconnectAttempts = 0
  private callbacks: MusicSessionCallbacks
  private isDisposed = false

  constructor(callbacks: MusicSessionCallbacks) {
    this.callbacks = callbacks
  }

  getState(): MusicSessionState {
    return this.state
  }

  private setState(newState: MusicSessionState): void {
    this.state = newState
    this.callbacks.onStateChange(newState)
  }

  async connect(apiKey: string): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') return
    if (this.isDisposed) return

    this.setState('connecting')

    try {
      const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' })

      // AudioContext を初期化
      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
        this.gainNode = this.audioContext.createGain()
        this.gainNode.connect(this.audioContext.destination)
      }

      // AudioContext が suspended の場合は resume
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.nextStartTime = this.audioContext.currentTime

      this.session = await ai.live.music.connect({
        model: LYRIA_MODEL,
        callbacks: {
          onmessage: (msg: LiveMusicServerMessage) => this.handleAudioMessage(msg),
          onerror: (e: ErrorEvent) => {
            console.error('[MusicSession] WebSocket error:', e)
            this.setState('error')
            this.callbacks.onError(new Error('Music WebSocket error'))
            this.attemptReconnect(apiKey)
          },
          onclose: () => {
            if (this.state !== 'disconnected' && !this.isDisposed) {
              this.setState('disconnected')
              this.attemptReconnect(apiKey)
            }
          },
        },
      })

      this.reconnectAttempts = 0
      this.setState('connected')
    } catch (error) {
      console.error('[MusicSession] Connect failed:', error)
      this.setState('error')
      this.callbacks.onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private handleAudioMessage(msg: LiveMusicServerMessage): void {
    const chunk = msg.audioChunk
    if (!chunk?.data || !this.audioContext || !this.gainNode) return

    try {
      // Base64 → ArrayBuffer
      const binaryStr = atob(chunk.data)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      // 16-bit PCM → Float32 AudioBuffer
      const numSamples = bytes.length / (BYTES_PER_SAMPLE * NUM_CHANNELS)
      const audioBuffer = this.audioContext.createBuffer(
        NUM_CHANNELS,
        numSamples,
        SAMPLE_RATE
      )

      const dataView = new DataView(bytes.buffer)
      for (let ch = 0; ch < NUM_CHANNELS; ch++) {
        const channelData = audioBuffer.getChannelData(ch)
        for (let i = 0; i < numSamples; i++) {
          const byteOffset = (i * NUM_CHANNELS + ch) * BYTES_PER_SAMPLE
          if (byteOffset + 1 < bytes.length) {
            const sample = dataView.getInt16(byteOffset, true) // little-endian
            channelData[i] = sample / 32768.0
          }
        }
      }

      // ギャップレス再生キューイング
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.gainNode)

      const startTime = Math.max(this.nextStartTime, this.audioContext.currentTime)
      source.start(startTime)
      this.nextStartTime = startTime + audioBuffer.duration
    } catch (error) {
      console.warn('[MusicSession] Audio chunk decode failed:', error)
    }
  }

  async updatePrompt(prompts: WeightedPrompt[]): Promise<void> {
    if (!this.session || this.state !== 'connected') return

    try {
      await this.session.setWeightedPrompts({ weightedPrompts: prompts })
    } catch (error) {
      console.warn('[MusicSession] Failed to update prompt:', error)
    }
  }

  async updateConfig(config: LiveMusicGenerationConfig): Promise<void> {
    if (!this.session || this.state !== 'connected') return

    try {
      await this.session.setMusicGenerationConfig({ musicGenerationConfig: config })
    } catch (error) {
      console.warn('[MusicSession] Failed to update config:', error)
    }
  }

  play(): void {
    this.session?.play()
  }

  pause(): void {
    this.session?.pause()
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext?.currentTime || 0,
        0.1 // スムーズに遷移
      )
    }
  }

  private attemptReconnect(apiKey: string): void {
    if (this.isDisposed) return
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.callbacks.onError(new Error('Max music reconnection attempts reached'))
      return
    }

    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    setTimeout(() => {
      if (!this.isDisposed) {
        this.connect(apiKey)
      }
    }, delay)
  }

  disconnect(): void {
    this.isDisposed = true

    try {
      this.session?.stop()
    } catch {
      // 切断中のエラーは無視
    }

    this.session = null

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
    }
    this.audioContext = null
    this.gainNode = null

    this.setState('disconnected')
  }
}
