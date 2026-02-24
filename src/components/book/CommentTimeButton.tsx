'use client'

import { Mic, Pencil, Keyboard } from 'lucide-react'

interface CommentTimeButtonProps {
  onStart: () => void
  onStartDrawing: () => void
  onStartText?: () => void
}

export function CommentTimeButton({ onStart, onStartDrawing, onStartText }: CommentTimeButtonProps) {
  return (
    <div className="flex justify-center pt-2 pb-1">
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-serif text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95 sm:text-base"
          aria-label="おはなししてね"
        >
          <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          おはなし
        </button>
        <button
          onClick={onStartDrawing}
          className="flex items-center gap-2 rounded-full bg-[var(--storybook-peach)] px-5 py-3 font-serif text-sm font-bold text-[var(--storybook-brown)] shadow-md transition-all hover:scale-105 active:scale-95 sm:text-base"
          aria-label="おえかきしてね"
        >
          <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
          おえかき
        </button>
        {onStartText && (
          <button
            onClick={onStartText}
            className="flex items-center gap-2 rounded-full bg-background/80 px-5 py-3 font-serif text-sm font-bold text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:scale-105 active:scale-95 sm:text-base"
            aria-label="もじでにゅうりょく"
          >
            <Keyboard className="h-4 w-4 sm:h-5 sm:w-5" />
            もじ
          </button>
        )}
      </div>
    </div>
  )
}
