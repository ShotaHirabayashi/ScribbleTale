/**
 * ブラウザ Web Speech API ラッパー
 *
 * SpeechRecognition を使って音声→テキスト変換を行う。
 * Live API (WebSocket) の代替として、安定したブラウザ標準APIを使用。
 */

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

export interface SpeechRecognitionConfig {
  lang?: string
  onResult: (transcript: string, isFinal: boolean) => void
  onError: (error: string) => void
  onEnd: () => void
}

export class SpeechRecognitionManager {
  private recognition: InstanceType<typeof window.webkitSpeechRecognition> | null = null
  private config: SpeechRecognitionConfig
  private isRunning = false

  constructor(config: SpeechRecognitionConfig) {
    this.config = config
  }

  /** ブラウザが Web Speech API をサポートしているか */
  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  start(): boolean {
    if (this.isRunning) return true

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => InstanceType<typeof window.webkitSpeechRecognition> }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => InstanceType<typeof window.webkitSpeechRecognition> }).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      this.config.onError('SpeechRecognition not supported')
      return false
    }

    this.recognition = new SpeechRecognitionClass()
    this.recognition.lang = this.config.lang || 'ja-JP'
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 1

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex]
      if (result) {
        const transcript = result[0].transcript
        const isFinal = result.isFinal
        this.config.onResult(transcript, isFinal)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[SpeechRecognition] Error:', event.error)
      // 'no-speech' は無視（無音状態で発生する）
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.config.onError(event.error)
      }
    }

    this.recognition.onend = () => {
      this.isRunning = false
      this.config.onEnd()
    }

    try {
      this.recognition.start()
      this.isRunning = true
      console.log('[SpeechRecognition] Started')
      return true
    } catch (err) {
      console.error('[SpeechRecognition] Failed to start:', err)
      this.config.onError('Failed to start speech recognition')
      return false
    }
  }

  stop(): void {
    if (this.recognition && this.isRunning) {
      try {
        this.recognition.stop()
      } catch {
        // already stopped
      }
      this.isRunning = false
      console.log('[SpeechRecognition] Stopped')
    }
  }

  getIsRunning(): boolean {
    return this.isRunning
  }
}

// Window型拡張
declare global {
  interface Window {
    webkitSpeechRecognition: new () => {
      lang: string
      continuous: boolean
      interimResults: boolean
      maxAlternatives: number
      onresult: ((event: SpeechRecognitionEvent) => void) | null
      onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
      onend: (() => void) | null
      start(): void
      stop(): void
    }
  }
}
