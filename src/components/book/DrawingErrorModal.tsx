'use client'

import { RotateCcw, X } from 'lucide-react'

interface DrawingErrorModalProps {
  message: string
  onRetry: () => void
  onClose: () => void
}

export function DrawingErrorModal({ message, onRetry, onClose }: DrawingErrorModalProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="mx-4 flex max-w-xs flex-col items-center gap-4 rounded-2xl bg-background p-6 shadow-xl animate-in zoom-in-95 duration-300">
        <div className="text-4xl">😢</div>
        <p className="text-center font-serif text-base font-bold text-foreground">
          {message}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-serif text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            もういちど
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-full bg-muted px-4 py-3 font-serif text-sm text-muted-foreground transition-all hover:bg-muted/80 active:scale-95"
          >
            <X className="h-4 w-4" />
            やめる
          </button>
        </div>
      </div>
    </div>
  )
}
