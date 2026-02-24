'use client'

import { useState, useCallback, useMemo } from 'react'
import { Mic, MicOff, Loader2, BookOpen, Wand2, Lock, X } from 'lucide-react'
import type { ModificationBoldness, StoryPage } from '@/lib/types'

interface StoryRemixOverlayProps {
  bookId: string
  bookTitle: string
  pages: StoryPage[]
  onComplete: (remixedPages: StoryPage[] | null, boldness: ModificationBoldness, remixPrompt: string | null) => void
}

const BOLDNESS_OPTIONS: { value: ModificationBoldness; label: string; icon: string; description: string; needsGate: boolean }[] = [
  { value: 'gentle', label: 'やさしい', icon: '🐣', description: 'もとの おはなしに ちかい', needsGate: true },
  { value: 'normal', label: 'ふつう', icon: '⭐', description: 'すこし かわる', needsGate: false },
  { value: 'bold', label: 'だいたん', icon: '🔥', description: 'おおきく かわる', needsGate: true },
]

/** ペアレンタルゲート用の掛け算問題を生成 */
function generateMathChallenge() {
  const a = Math.floor(Math.random() * 8) + 2 // 2〜9
  const b = Math.floor(Math.random() * 8) + 2 // 2〜9
  return { a, b, answer: a * b }
}

export function StoryRemixOverlay({ bookId, bookTitle, pages, onComplete }: StoryRemixOverlayProps) {
  const [remixPrompt, setRemixPrompt] = useState('')
  const [boldness, setBoldness] = useState<ModificationBoldness>('normal')
  const [isRemixing, setIsRemixing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ペアレンタルゲート
  const [showParentalGate, setShowParentalGate] = useState(false)
  const [gateAnswer, setGateAnswer] = useState('')
  const [gateError, setGateError] = useState(false)
  const [pendingBoldness, setPendingBoldness] = useState<ModificationBoldness | null>(null)
  const [mathChallenge, setMathChallenge] = useState(() => generateMathChallenge())

  // テキスト入力変更（boldness 自動切り替えはしない、ペアレンタルゲートがあるため）
  const handlePromptChange = useCallback((value: string) => {
    setRemixPrompt(value)
  }, [])

  // 改変レベル選択
  const handleBoldnessSelect = useCallback((value: ModificationBoldness) => {
    const option = BOLDNESS_OPTIONS.find((o) => o.value === value)
    if (option?.needsGate) {
      // ペアレンタルゲートを表示
      setPendingBoldness(value)
      setMathChallenge(generateMathChallenge())
      setGateAnswer('')
      setGateError(false)
      setShowParentalGate(true)
    } else {
      setBoldness(value)
    }
  }, [])

  // ペアレンタルゲートの数字ボタン
  const handleGateNumberPress = useCallback((num: number) => {
    setGateAnswer((prev) => {
      if (prev.length >= 3) return prev // 最大3桁
      return prev + num.toString()
    })
    setGateError(false)
  }, [])

  // ペアレンタルゲートのバックスペース
  const handleGateBackspace = useCallback(() => {
    setGateAnswer((prev) => prev.slice(0, -1))
    setGateError(false)
  }, [])

  // ペアレンタルゲートの回答送信
  const handleGateSubmit = useCallback(() => {
    if (parseInt(gateAnswer, 10) === mathChallenge.answer) {
      // 正解 → レベル変更
      if (pendingBoldness) setBoldness(pendingBoldness)
      setShowParentalGate(false)
      setPendingBoldness(null)
    } else {
      // 不正解 → エラー表示＋問題再生成
      setGateError(true)
      setGateAnswer('')
      setMathChallenge(generateMathChallenge())
    }
  }, [gateAnswer, mathChallenge.answer, pendingBoldness])

  // ペアレンタルゲートを閉じる
  const handleGateClose = useCallback(() => {
    setShowParentalGate(false)
    setPendingBoldness(null)
  }, [])

  // 音声入力
  const handleVoiceInput = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognitionClass = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      setError('おんせい にゅうりょくは このブラウザでは つかえません')
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string
      setRemixPrompt((prev) => prev ? `${prev} ${transcript}` : transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    setIsListening(true)
    recognition.start()
  }, [])

  // リミックス実行
  const handleRemix = useCallback(async () => {
    if (!remixPrompt.trim()) return
    setIsRemixing(true)
    setError(null)

    try {
      const remixPages = pages.map((p) => ({
        pageNumber: p.pageNumber || p.id,
        pageRole: p.pageRole,
        text: p.text,
      }))

      const response = await fetch('/api/remix-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle,
          remixPrompt: remixPrompt.trim(),
          pages: remixPages,
        }),
      })

      if (!response.ok) throw new Error('Remix failed')

      const data = await response.json()
      const remixedPages: StoryPage[] = pages.map((originalPage) => {
        const remixed = data.remixedPages.find(
          (r: { pageNumber: number; text: string }) => r.pageNumber === (originalPage.pageNumber || originalPage.id)
        )
        if (remixed) {
          return {
            ...originalPage,
            text: remixed.text,
            currentText: remixed.text,
            originalText: originalPage.text,
          }
        }
        return originalPage
      })

      onComplete(remixedPages, boldness, remixPrompt.trim())
    } catch {
      setError('リミックスに しっぱいしました。もういちど ためしてね')
      setIsRemixing(false)
    }
  }, [remixPrompt, boldness, pages, bookTitle, onComplete])

  // スキップ（そのまま読む）
  const handleSkip = useCallback(() => {
    onComplete(null, boldness, null)
  }, [boldness, onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-[var(--storybook-cream)] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-[var(--storybook-peach)] to-[var(--storybook-pink,#f9a8d4)] p-4 text-center sm:p-5">
          <h2 className="font-serif text-lg font-bold tracking-wider text-[var(--storybook-brown)] sm:text-xl">
            どんな おはなしに する？
          </h2>
          <p className="mt-1 font-serif text-xs text-[var(--storybook-brown)]/70 sm:text-sm">
            じゆうに せっていを かえられるよ
          </p>
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          {/* テキスト入力 + マイクボタン */}
          <div className="relative">
            <textarea
              value={remixPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="うちゅうを ぼうけんする ももたろう"
              className="w-full resize-none rounded-xl border-2 border-[var(--storybook-peach)]/50 bg-white px-3 py-2.5 pr-10 font-serif text-sm text-[var(--storybook-brown)] placeholder:text-[var(--storybook-brown)]/30 focus:border-[var(--storybook-peach)] focus:outline-none sm:px-4 sm:py-3 sm:text-base"
              rows={2}
              disabled={isRemixing}
            />
            <button
              onClick={handleVoiceInput}
              disabled={isRemixing || isListening}
              className={`absolute right-2 top-2 rounded-full p-1.5 transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-500 animate-pulse'
                  : 'bg-[var(--storybook-peach)]/20 text-[var(--storybook-brown)]/60 hover:bg-[var(--storybook-peach)]/40'
              }`}
              aria-label="おんせい にゅうりょく"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {/* 改変レベル選択 */}
          <div>
            <p className="mb-2 font-serif text-xs text-[var(--storybook-brown)]/70 sm:text-sm">
              おはなしの かわりかた
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BOLDNESS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleBoldnessSelect(option.value)}
                  disabled={isRemixing}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 font-serif text-xs transition-all sm:gap-1 sm:px-3 sm:py-2.5 sm:text-sm ${
                    boldness === option.value
                      ? 'bg-[var(--storybook-peach)] text-[var(--storybook-brown)] shadow-md ring-2 ring-[var(--storybook-brown)]/20'
                      : 'bg-white text-[var(--storybook-brown)]/60 hover:bg-[var(--storybook-peach)]/30'
                  }`}
                >
                  <span className="text-base sm:text-lg">{option.icon}</span>
                  <span className="font-bold">{option.label}</span>
                  <span className="text-[10px] leading-tight text-[var(--storybook-brown)]/50 sm:text-xs">
                    {option.description}
                  </span>
                  {/* 鍵アイコン（ペアレンタルゲート必要＆未選択） */}
                  {option.needsGate && boldness !== option.value && (
                    <Lock className="absolute right-1 top-1 h-3 w-3 text-[var(--storybook-brown)]/30" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <p className="text-center font-serif text-xs text-red-500 sm:text-sm">
              {error}
            </p>
          )}

          {/* ボタン */}
          <div className="flex flex-col gap-2 sm:gap-2.5">
            {remixPrompt.trim() && (
              <button
                onClick={handleRemix}
                disabled={isRemixing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--storybook-peach)] to-[var(--storybook-pink,#f9a8d4)] px-4 py-2.5 font-serif text-sm font-bold text-[var(--storybook-brown)] shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 sm:py-3 sm:text-base"
              >
                {isRemixing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                    おはなしを つくっているよ...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    おはなしを つくる！
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleSkip}
              disabled={isRemixing}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--storybook-brown)]/20 bg-white px-4 py-2 font-serif text-sm text-[var(--storybook-brown)]/70 transition-all hover:bg-[var(--storybook-cream)] active:scale-[0.98] disabled:opacity-50 sm:py-2.5 sm:text-base"
            >
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              そのまま よむ
            </button>
          </div>
        </div>
      </div>

      {/* ペアレンタルゲート（掛け算チャレンジ） */}
      {showParentalGate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* 閉じるボタン */}
            <div className="flex justify-end p-2">
              <button
                onClick={handleGateClose}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="とじる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 問題表示 */}
            <div className="px-6 pb-2 text-center">
              <p className="font-serif text-sm font-bold text-gray-700">
                もんだいを といて つづけてね
              </p>
              <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3">
                <p className="font-mono text-2xl font-bold text-blue-800">
                  {mathChallenge.a} × {mathChallenge.b} = {gateAnswer || <span className="text-blue-300">?</span>}
                </p>
              </div>
              {gateError && (
                <p className="mt-2 font-serif text-xs text-red-500 animate-in fade-in duration-200">
                  ちがうよ！もういちど やってみてね
                </p>
              )}
            </div>

            {/* 数字パッド */}
            <div className="grid grid-cols-5 gap-1.5 px-4 pb-2 pt-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                <button
                  key={num}
                  onClick={() => handleGateNumberPress(num)}
                  className="flex h-11 items-center justify-center rounded-lg bg-blue-400 font-mono text-lg font-bold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95 active:bg-blue-600"
                >
                  {num}
                </button>
              ))}
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 px-4 pb-4 pt-1">
              <button
                onClick={handleGateBackspace}
                disabled={gateAnswer.length === 0}
                className="flex-1 rounded-lg bg-gray-200 px-3 py-2 font-serif text-sm font-bold text-gray-600 transition-all hover:bg-gray-300 active:scale-95 disabled:opacity-30"
              >
                けす
              </button>
              <button
                onClick={handleGateSubmit}
                disabled={gateAnswer.length === 0}
                className="flex-1 rounded-lg bg-green-500 px-3 py-2 font-serif text-sm font-bold text-white shadow-md transition-all hover:bg-green-600 active:scale-95 disabled:opacity-30"
              >
                こたえる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
