'use client'

import { Mic, SkipForward, CheckCircle } from 'lucide-react'

interface CommentTimeOverlayProps {
  remainingMs: number
  childUtterance: string | null
  voiceError?: string | null
  onSkip: () => void
  onEnd: () => void
}

export function CommentTimeOverlay({
  remainingMs,
  childUtterance,
  voiceError,
  onSkip,
  onEnd,
}: CommentTimeOverlayProps) {
  const progress = 1 - remainingMs / 30000

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-14 sm:pb-18">
      {/* 音声認識エラー */}
      {voiceError && (
        <div className="mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-2xl bg-orange-100 px-4 py-2 font-serif text-sm text-orange-800 shadow-md">
            🎤 {voiceError}
          </div>
        </div>
      )}

      {/* 子どもの発言吹き出し */}
      {childUtterance && (
        <div className="mb-4 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="rounded-2xl bg-background/90 px-4 py-2 font-serif text-sm text-foreground shadow-md backdrop-blur-sm sm:text-base">
            &ldquo;{childUtterance}&rdquo;
          </div>
        </div>
      )}

      {/* コントロールエリア */}
      <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
        {/* 波形インジケーター */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-primary/80"
              style={{
                height: `${12 + Math.sin(Date.now() / 200 + i * 0.8) * 8}px`,
                animation: `pulse ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
          <Mic className="ml-2 h-4 w-4 text-primary/80" />
        </div>

        {/* タイマーバー */}
        <div className="h-2.5 w-48 overflow-hidden rounded-full bg-background/30 sm:w-56">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${remainingMs <= 10000 ? 'bg-orange-400 animate-pulse' : 'bg-primary/70'}`}
            style={{ width: `${(1 - progress) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnd}
            className="flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 font-serif text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:text-base"
          >
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            おわり
          </button>
          <button
            onClick={onSkip}
            className="flex items-center gap-1 rounded-full bg-background/20 px-4 py-2.5 font-serif text-sm text-background/80 backdrop-blur-sm transition-all hover:bg-background/30 active:scale-95"
          >
            <SkipForward className="h-4 w-4" />
            スキップ
          </button>
        </div>
      </div>
    </div>
  )
}
