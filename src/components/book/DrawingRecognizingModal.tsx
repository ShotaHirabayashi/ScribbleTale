'use client'

import { Pencil } from 'lucide-react'

export function DrawingRecognizingModal() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background/95 shadow-xl sm:h-24 sm:w-24">
          <Pencil className="h-8 w-8 animate-bounce text-primary sm:h-10 sm:w-10" />
        </div>
        <div className="rounded-2xl bg-background/95 px-6 py-3 shadow-lg">
          <p className="font-serif text-sm text-foreground sm:text-base">
            なにを かいたのか かんがえているよ…
          </p>
        </div>
      </div>
    </div>
  )
}
