/**
 * Gemini Live API WebSocket管理クラス
 *
 * 常時接続 + クライアント側ミュート制御
 * Function Calling: extractKeyword + endCommentTime
 * モデル: gemini-live-2.5-flash-preview (TEXT応答 + 音声入力対応)
 */

const LIVE_API_MODEL = 'gemini-live-2.5-flash-preview'
const MAX_RECONNECT_ATTEMPTS = 3
const BASE_RECONNECT_DELAY_MS = 1000
const CONNECT_TIMEOUT_MS = 10000

export interface LiveSessionConfig {
  apiKey: string
  onKeywordExtracted: (keyword: string, utterance: string) => void
  onEndCommentTime: (reason: string) => void
  onTranscript: (text: string) => void
  onError: (error: Error) => void
  bookTitle: string
  currentPageText: string
}

type LiveSessionState = 'disconnected' | 'connecting' | 'connected' | 'ready' | 'error'

export class LiveSessionManager {
  private ws: WebSocket | null = null
  private config: LiveSessionConfig
  private state: LiveSessionState = 'disconnected'
  private reconnectAttempts = 0
  private isMuted = true
  private setupComplete = false
  private setupResolve: (() => void) | null = null
  private setupReject: ((err: Error) => void) | null = null

  constructor(config: LiveSessionConfig) {
    this.config = config
  }

  getState(): LiveSessionState {
    return this.state
  }

  isReady(): boolean {
    return this.state === 'ready' && this.setupComplete
  }

  /**
   * WebSocket接続 → setup送信 → setupComplete受信 まで待つ
   */
  async connect(): Promise<void> {
    if (this.state === 'ready' || this.state === 'connecting') return

    this.state = 'connecting'
    this.setupComplete = false

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
        this.disconnect()
      }, CONNECT_TIMEOUT_MS)

      this.setupResolve = () => {
        clearTimeout(timeout)
        resolve()
      }
      this.setupReject = (err: Error) => {
        clearTimeout(timeout)
        reject(err)
      }

      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('[LiveSession] WebSocket connected')
          this.state = 'connected'
          this.reconnectAttempts = 0
          this.sendSetup()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onerror = (e) => {
          console.error('[LiveSession] WebSocket error:', e)
          this.state = 'error'
          const err = new Error('WebSocket connection error')
          this.config.onError(err)
          this.setupReject?.(err)
          this.setupResolve = null
          this.setupReject = null
        }

        this.ws.onclose = (e) => {
          console.warn('[LiveSession] WebSocket closed:', e.code, e.reason)
          const wasReady = this.state === 'ready'
          this.state = 'disconnected'
          if (!wasReady && this.setupReject) {
            this.setupReject(new Error(`WebSocket closed: ${e.code} ${e.reason}`))
            this.setupResolve = null
            this.setupReject = null
          } else {
            this.attemptReconnect()
          }
        }
      } catch (error) {
        clearTimeout(timeout)
        this.state = 'error'
        const err = error instanceof Error ? error : new Error(String(error))
        this.config.onError(err)
        reject(err)
      }
    })
  }

  private sendSetup(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const setup = {
      setup: {
        model: `models/${LIVE_API_MODEL}`,
        generationConfig: {
          responseModalities: ['TEXT'],
        },
        contextWindowCompression: {
          triggerTokens: 8000,
          slidingWindow: {
            targetTokens: 2048,
          },
        },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
            endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
            silenceDurationMs: 3000,
          },
        },
        systemInstruction: {
          parts: [
            {
              text: `あなたは絵本「${this.config.bookTitle}」の読み聞かせアシスタントです。

子どもが絵本を読んでいる最中に「コメントタイム」で話しかけてきます。
子どもの発言からキーワードを抽出してください。

現在のページのテキスト:
${this.config.currentPageText}

キーワードとは、物語の改変に使えるような具体的な名詞や概念です。
例: うちゅう、ドラゴン、にじ、ロボット、うみ、おかし

子どもが話し終わったら、extractKeyword関数を呼んでください。
子どもが「おわり」「もういいよ」「つぎ」などと言ったら、endCommentTime関数を呼んでください。`,
            },
          ],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: 'extractKeyword',
                description: '子どもの発言からキーワードを抽出する',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    keyword: {
                      type: 'STRING',
                      description: '抽出されたキーワード（ひらがな）',
                    },
                    utterance: {
                      type: 'STRING',
                      description: '子どもの元の発言',
                    },
                  },
                  required: ['keyword', 'utterance'],
                },
              },
              {
                name: 'endCommentTime',
                description: 'コメントタイムを終了する',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    reason: {
                      type: 'STRING',
                      description: '終了理由',
                      enum: ['end_keyword', 'silence_timeout'],
                    },
                  },
                  required: ['reason'],
                },
              },
            ],
          },
        ],
      },
    }

    this.ws.send(JSON.stringify(setup))
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)

      // setupComplete レスポンス
      if (data.setupComplete) {
        console.log('[LiveSession] Setup complete')
        this.setupComplete = true
        this.state = 'ready'
        this.setupResolve?.()
        this.setupResolve = null
        this.setupReject = null
        return
      }

      // Function Call レスポンス
      if (data.serverContent?.modelTurn?.parts) {
        for (const part of data.serverContent.modelTurn.parts) {
          if (part.functionCall) {
            console.log('[LiveSession] Function call:', part.functionCall.name, part.functionCall.args)
            this.handleFunctionCall(part.functionCall)
          }
          if (part.text) {
            console.log('[LiveSession] Model text:', part.text.substring(0, 100))
            this.config.onTranscript(part.text)
          }
        }
      }

      // ツール呼び出しの結果
      if (data.toolCall?.functionCalls) {
        for (const fc of data.toolCall.functionCalls) {
          console.log('[LiveSession] Tool call:', fc.name, fc.args)
          this.handleFunctionCall(fc)
        }
      }
    } catch {
      // パース不可能なメッセージは無視
    }
  }

  private handleFunctionCall(functionCall: { name: string; args: Record<string, string> }): void {
    switch (functionCall.name) {
      case 'extractKeyword':
        this.config.onKeywordExtracted(
          functionCall.args.keyword,
          functionCall.args.utterance
        )
        break
      case 'endCommentTime':
        this.config.onEndCommentTime(functionCall.args.reason)
        break
    }
  }

  private audioSendCount = 0

  /** 音声データを送信（setupComplete後のみ） */
  sendAudio(audioData: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.isMuted || !this.setupComplete) return

    this.audioSendCount++
    if (this.audioSendCount % 50 === 1) {
      console.log(`[LiveSession] Sending audio chunk #${this.audioSendCount}, ws.readyState=${this.ws.readyState}, muted=${this.isMuted}`)
    }

    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: audioData,
            },
          ],
        },
      })
    )
  }

  /** ミュート制御 */
  setMuted(muted: boolean): void {
    this.isMuted = muted
  }

  isMutedState(): boolean {
    return this.isMuted
  }

  private attemptReconnect(): void {
    // セットアップ未完了で切断 = モデルやconfigエラーなので再接続しない
    if (!this.setupComplete) {
      console.error('[LiveSession] Disconnected before setup complete, not reconnecting')
      this.config.onError(new Error('Live API setup failed - check model and config'))
      return
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.config.onError(new Error('Max reconnection attempts reached'))
      return
    }

    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  disconnect(): void {
    this.setupResolve = null
    this.setupReject = null
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.state = 'disconnected'
    this.reconnectAttempts = 0
  }

  updateContext(pageText: string): void {
    this.config.currentPageText = pageText
  }
}
