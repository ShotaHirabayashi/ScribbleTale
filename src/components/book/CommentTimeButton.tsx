'use client'

import { Mic, Pencil } from 'lucide-react'

interface CommentTimeButtonProps {
  onStart: () => void
  onStartDrawing: () => void
  onSkip: () => void
}

export function CommentTimeButton({ onStart, onStartDrawing, onSkip }: CommentTimeButtonProps) {
  return (
    <div className="flex justify-center pt-2 pb-1">
      <div className="flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 font-serif text-xs font-bold text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
            aria-label="おはなししてね"
          >
            <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            おはなし
          </button>
          <button
            onClick={onStartDrawing}
            className="flex items-center gap-1.5 rounded-full bg-[var(--storybook-peach)] px-3.5 py-1.5 font-serif text-xs font-bold text-[var(--storybook-brown)] shadow-md transition-all hover:scale-105 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
            aria-label="おえかきしてね"
          >
            <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            おえかき
          </button>
        </div>
        <button
          onClick={onSkip}
          className="font-serif text-[10px] text-muted-foreground/60 underline decoration-dotted underline-offset-4 transition-colors hover:text-muted-foreground/80 sm:text-xs"
        >
          スキップ
        </button>
      </div>
    </div>
  )
}
