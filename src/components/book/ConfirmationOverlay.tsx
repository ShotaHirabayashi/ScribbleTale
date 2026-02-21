'use client'

import { Sparkles, X } from 'lucide-react'

interface ConfirmationOverlayProps {
  keyword: string
  utterance: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationOverlay({
  keyword,
  utterance,
  onConfirm,
  onCancel,
}: ConfirmationOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-14 sm:pb-18">
      {/* 子どもの発言吹き出し */}
      {utterance && (
        <div className="mb-3 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="rounded-2xl bg-background/90 px-4 py-2 font-serif text-sm text-foreground shadow-md backdrop-blur-sm sm:text-base">
            &ldquo;{utterance}&rdquo;
          </div>
        </div>
      )}

      {/* キーワード表示 */}
      <div className="mb-4 animate-in fade-in zoom-in-95 duration-500 delay-150">
        <div className="rounded-full bg-primary/20 px-5 py-1.5 font-serif text-base font-bold text-primary shadow-sm backdrop-blur-sm sm:text-lg">
          {keyword}
        </div>
      </div>

      {/* ボタンエリア */}
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 rounded-full bg-background/20 px-3 py-1.5 font-serif text-xs text-background/80 backdrop-blur-sm transition-all hover:bg-background/30 active:scale-95 sm:px-4 sm:text-sm"
        >
          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          やめる
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-serif text-xs font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:px-5 sm:text-sm"
        >
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          これでおはなしをかえる！
        </button>
      </div>
    </div>
  )
}
