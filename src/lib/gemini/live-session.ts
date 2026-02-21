/**
 * Gemini Live API WebSocket管理クラス
 *
 * 常時接続 + クライアント側ミュート制御
 * Function Calling: extractKeyword + endCommentTime
 * モデル: gemini-2.5-flash-preview-native-audio-dialog
 */

const LIVE_API_MODEL = 'gemini-2.5-flash-preview-native-audio-dialog'
const MAX_RECONNECT_ATTEMPTS = 3
const BASE_RECONNECT_DELAY_MS = 1000

export interface LiveSessionConfig {
  apiKey: string
  onKeywordExtracted: (keyword: string, utterance: string) => void
  onEndCommentTime: (reason: string) => void
  onTranscript: (text: string) => void
  onError: (error: Error) => void
  bookTitle: string
  currentPageText: string
}

type LiveSessionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export class LiveSessionManager {
  private ws: WebSocket | null = null
  private config: LiveSessionConfig
  private state: LiveSessionState = 'disconnected'
  private reconnectAttempts = 0
  private isMuted = true

  constructor(config: LiveSessionConfig) {
    this.config = config
  }

  getState(): LiveSessionState {
    return this.state
  }

  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') return

    this.state = 'connecting'

    try {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.state = 'connected'
        this.reconnectAttempts = 0
        this.sendSetup()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event)
      }

      this.ws.onerror = () => {
        this.state = 'error'
        this.config.onError(new Error('WebSocket connection error'))
      }

      this.ws.onclose = () => {
        this.state = 'disconnected'
        this.attemptReconnect()
      }
    } catch (error) {
      this.state = 'error'
      this.config.onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private sendSetup(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const setup = {
      setup: {
        model: `models/${LIVE_API_MODEL}`,
        generationConfig: {
          responseModalities: ['TEXT'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
              },
            },
          },
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

      // Function Call レスポンス
      if (data.serverContent?.modelTurn?.parts) {
        for (const part of data.serverContent.modelTurn.parts) {
          if (part.functionCall) {
            this.handleFunctionCall(part.functionCall)
          }
          if (part.text) {
            this.config.onTranscript(part.text)
          }
        }
      }

      // ツール呼び出しの結果
      if (data.toolCall?.functionCalls) {
        for (const fc of data.toolCall.functionCalls) {
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

  /** 音声データを送信 */
  sendAudio(audioData: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.isMuted) return

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
