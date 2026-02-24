'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCommentTime } from './useCommentTime'
import { useStoryStore } from '@/stores/story-store'
import { SpeechRecognitionManager } from '@/lib/speech/speech-recognition'
import { LiveSessionManager } from '@/lib/gemini/live-session'

interface UseVoiceInputOptions {
  currentPageIndex: number
  pages: { text: string; currentText?: string }[]
  isCommentTimePhase: boolean
  bookTitle?: string
}

/**
 * PCM 16kHz にダウンサンプリングする
 * iOS Safari は AudioContext の sampleRate を 16000 にできないため、
 * ネイティブ sampleRate (44100/48000) から 16000 に変換する
 */
function downsampleTo16k(inputData: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    // リサンプリング不要: そのまま Int16 変換
    const pcm = new Int16Array(inputData.length)
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]))
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return pcm
  }

  // ダウンサンプリング
  const ratio = inputSampleRate / 16000
  const outputLength = Math.floor(inputData.length / ratio)
  const pcm = new Int16Array(outputLength)
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = Math.floor(i * ratio)
    const s = Math.max(-1, Math.min(1, inputData[srcIndex]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return pcm
}

/**
 * 音声入力の統合フック
 *
 * Web Speech API で音声→テキスト変換し、
 * 確定テキストをそのまま改変エンジンに渡す（キーワード抽出APIは不要）
 *
 * iOS Safari など Web Speech API 非対応ブラウザでは
 * Gemini Live API (WebSocket + getUserMedia) にフォールバック
 */
export function useVoiceInput({
  currentPageIndex,
  pages,
  isCommentTimePhase,
  bookTitle = 'えほん',
}: UseVoiceInputOptions) {
  const addPendingKeyword = useStoryStore((s) => s.addPendingKeyword)
  const setChildUtterance = useStoryStore((s) => s.setChildUtterance)
  const setVoiceError = useStoryStore((s) => s.setVoiceError)

  const prevPhaseRef = useRef(false)
  const finalTranscriptRef = useRef('')

  // ── ブラウザ判定（初回マウント時に確定） ──
  const isSpeechApiSupported = useRef<boolean | null>(null)
  if (isSpeechApiSupported.current === null && typeof window !== 'undefined') {
    isSpeechApiSupported.current = SpeechRecognitionManager.isSupported()
  }

  // ── Web Speech API refs ──
  const recognitionRef = useRef<SpeechRecognitionManager | null>(null)

  // ── Gemini Live API refs ──
  const liveManagerRef = useRef<LiveSessionManager | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const apiKeyRef = useRef<string | null>(null)

  // ── Gemini Live API state ──
  const [liveConnected, setLiveConnected] = useState(false)
  const [liveStreaming, setLiveStreaming] = useState(false)
  const [livePermission, setLivePermission] = useState<boolean | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)

  // コメントタイムタイマー
  const commentTime = useCommentTime({
    maxDurationMs: 30000,
    silenceTimeoutMs: 10000,
  })

  // ── Gemini Live API: クリーンアップ ──
  const cleanupLiveSession = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (liveManagerRef.current) {
      liveManagerRef.current.disconnect()
      liveManagerRef.current = null
    }
    setLiveConnected(false)
    setLiveStreaming(false)
  }, [])

  // ── Gemini Live API: 開始 ──
  const startLiveSession = useCallback(async () => {
    try {
      // 1. マイクストリームを先に取得（iOS: ユーザージェスチャーコンテキスト内で取得する必要あり）
      console.log('[useVoiceInput/Live] Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      mediaStreamRef.current = stream
      setLivePermission(true)
      console.log('[useVoiceInput/Live] Microphone access granted')

      // 2. APIキー取得（キャッシュ済みならスキップ）
      if (!apiKeyRef.current) {
        const res = await fetch('/api/session-key')
        if (!res.ok) throw new Error('Failed to get session key')
        const { apiKey } = await res.json()
        if (!apiKey) throw new Error('No API key returned')
        apiKeyRef.current = apiKey
      }
      const apiKey = apiKeyRef.current!

      // 3. 現在ページのテキスト取得
      const currentPageText = pages[currentPageIndex]?.currentText
        || pages[currentPageIndex]?.text || ''

      // 4. LiveSessionManager作成＋接続（setupComplete まで待つ）
      const manager = new LiveSessionManager({
        apiKey,
        bookTitle,
        currentPageText,
        onKeywordExtracted: (keyword, utterance) => {
          setChildUtterance(utterance)
          commentTime.notifySpeech()
          console.log('[useVoiceInput/Live] Keyword extracted:', keyword, utterance)
          addPendingKeyword({
            keyword,
            childUtterance: utterance,
            trigger: 'voice',
            timestamp: Date.now(),
          })
        },
        onEndCommentTime: (reason) => {
          console.log('[useVoiceInput/Live] End comment time:', reason)
          useStoryStore.getState().endCommentTime(
            reason === 'end_keyword' ? 'end_keyword' : 'silence_timeout'
          )
        },
        onTranscript: (text) => {
          setChildUtterance(text)
          commentTime.notifySpeech()
        },
        onError: (err) => {
          console.error('[useVoiceInput/Live] Error:', err)
          setLiveError(err.message)
          setVoiceError('こえが きこえなかったよ')
          setTimeout(() => setVoiceError(null), 3000)
        },
      })
      liveManagerRef.current = manager

      console.log('[useVoiceInput/Live] Connecting to Gemini Live API...')
      await manager.connect() // WebSocket OPEN + setupComplete まで待つ
      manager.setMuted(false)
      setLiveConnected(true)
      console.log('[useVoiceInput/Live] Connected and ready')

      // 5. AudioContext を作成して音声ストリーミング開始
      // iOS Safari: sampleRate を指定しない → ネイティブ sampleRate を使用
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const actualSampleRate = audioContext.sampleRate
      console.log(`[useVoiceInput/Live] AudioContext sampleRate: ${actualSampleRate}`)

      // iOS Safari: AudioContext が suspended の場合 resume
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const source = audioContext.createMediaStreamSource(stream)
      // bufferSize: 4096 ではなく、ダウンサンプリング後のチャンクサイズに合わせる
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        // ネイティブ sampleRate → 16kHz にダウンサンプリング
        const pcmData = downsampleTo16k(inputData, actualSampleRate)
        // Base64エンコード
        const bytes = new Uint8Array(pcmData.buffer)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        manager.sendAudio(base64)
      }

      source.connect(processor)
      processor.connect(audioContext.destination)
      setLiveStreaming(true)
      console.log('[useVoiceInput/Live] Audio streaming started')
    } catch (err) {
      console.error('[useVoiceInput/Live] Start failed:', err)
      setLiveError(err instanceof Error ? err.message : String(err))
      setLivePermission(false)
      setVoiceError('こえが きこえなかったよ')
      setTimeout(() => setVoiceError(null), 3000)
      cleanupLiveSession()
    }
  }, [
    currentPageIndex, pages, bookTitle,
    addPendingKeyword, setChildUtterance, setVoiceError,
    commentTime, cleanupLiveSession,
  ])

  // ── コメントタイムフェーズ開始/終了で音声認識を制御 ──
  useEffect(() => {
    const wasActive = prevPhaseRef.current
    prevPhaseRef.current = isCommentTimePhase

    if (isCommentTimePhase && !wasActive) {
      // コメントタイム開始
      if (isSpeechApiSupported.current) {
        // ===== Web Speech API パス（既存コードそのまま） =====
        finalTranscriptRef.current = ''

        const manager = new SpeechRecognitionManager({
          lang: 'ja-JP',
          onResult: (transcript, isFinal) => {
            setChildUtterance(transcript)
            commentTime.notifySpeech()

            if (isFinal && transcript.trim()) {
              finalTranscriptRef.current = transcript.trim()
              console.log('[useVoiceInput] Final transcript:', transcript.trim())

              addPendingKeyword({
                keyword: transcript.trim(),
                childUtterance: transcript.trim(),
                trigger: 'voice',
                timestamp: Date.now(),
              })
            }
          },
          onError: (error) => {
            console.warn('[useVoiceInput] Speech recognition error:', error)
            setVoiceError('こえが きこえなかったよ')
            setTimeout(() => setVoiceError(null), 3000)
          },
          onEnd: () => {
            if (prevPhaseRef.current && recognitionRef.current) {
              console.log('[useVoiceInput] Restarting speech recognition...')
              setTimeout(() => {
                recognitionRef.current?.start()
              }, 100)
            }
          },
        })

        recognitionRef.current = manager
        manager.start()
        console.log('[useVoiceInput] Speech recognition started')
      } else {
        // ===== Gemini Live API パス（iOS Safari フォールバック） =====
        console.log('[useVoiceInput] Web Speech API not supported, using Gemini Live API')
        startLiveSession()
      }
    } else if (!isCommentTimePhase && wasActive) {
      // コメントタイム終了
      if (isSpeechApiSupported.current) {
        recognitionRef.current?.stop()
        recognitionRef.current = null
      } else {
        cleanupLiveSession()
      }
    }
  }, [isCommentTimePhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // クリーンアップ
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      cleanupLiveSession()
    }
  }, [cleanupLiveSession])

  // ── 返り値 ──
  if (isSpeechApiSupported.current) {
    return {
      isConnected: true,
      isStreaming: isCommentTimePhase,
      hasPermission: true,
      error: null,
    }
  }

  return {
    isConnected: liveConnected,
    isStreaming: liveStreaming,
    hasPermission: livePermission ?? false,
    error: liveError,
  }
}
