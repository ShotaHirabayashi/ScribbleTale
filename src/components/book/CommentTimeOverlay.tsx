'use client'

import { Mic, SkipForward, CheckCircle } from 'lucide-react'

interface CommentTimeOverlayProps {
  remainingMs: number
  childUtterance: string | null
  onSkip: () => void
  onEnd: () => void
}

export function CommentTimeOverlay({
  remainingMs,
  childUtterance,
  onSkip,
  onEnd,
}: CommentTimeOverlayProps) {
  const remainingSec = Math.ceil(remainingMs / 1000)
  const progress = 1 - remainingMs / 30000

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-14 sm:pb-18">
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
        <div className="h-1 w-32 overflow-hidden rounded-full bg-background/30 sm:w-40">
          <div
            className="h-full rounded-full bg-primary/70 transition-all duration-1000 ease-linear"
            style={{ width: `${(1 - progress) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="font-serif text-xs text-background/60">
            {remainingSec}びょう
          </span>
          <button
            onClick={onEnd}
            className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 font-serif text-xs font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:text-sm"
          >
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            おわり
          </button>
          <button
            onClick={onSkip}
            className="flex items-center gap-1 rounded-full bg-background/20 px-3 py-1.5 font-serif text-xs text-background/80 backdrop-blur-sm transition-all hover:bg-background/30 active:scale-95"
          >
            <SkipForward className="h-3 w-3" />
            スキップ
          </button>
        </div>
      </div>
    </div>
  )
}
