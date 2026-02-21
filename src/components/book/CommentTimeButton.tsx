'use client'

import { Mic } from 'lucide-react'

interface CommentTimeButtonProps {
  onStart: () => void
  onSkip: () => void
}

export function CommentTimeButton({ onStart, onSkip }: CommentTimeButtonProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center pb-16 sm:pb-20">
      <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-serif text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:px-6 sm:py-3.5 sm:text-base"
          aria-label="おはなししてね"
        >
          <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          おはなし してね！
        </button>
        <button
          onClick={onSkip}
          className="font-serif text-xs text-background/60 underline decoration-dotted underline-offset-4 transition-colors hover:text-background/80 sm:text-sm"
        >
          スキップする
        </button>
      </div>
    </div>
  )
}
