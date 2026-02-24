'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'

interface TextInputOverlayProps {
  onSubmit: (keyword: string) => void
  onCancel: () => void
}

export function TextInputOverlay({ onSubmit, onCancel }: TextInputOverlayProps) {
  const [textValue, setTextValue] = useState('')

  const handleSubmit = () => {
    const trimmed = textValue.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex w-[85%] max-w-sm flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-500">
        {/* ガイドテキスト */}
        <div className="rounded-2xl bg-background/95 px-5 py-3 font-serif text-base text-foreground shadow-lg sm:text-lg">
          おはなしを かえる ことばを いれてね
        </div>

        {/* テキスト入力 */}
        <input
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          placeholder="たとえば「ドラゴン」「にじいろ」"
          autoFocus
          className="w-full rounded-xl border-2 border-primary/30 bg-background/95 px-4 py-3 text-center font-serif text-base text-foreground shadow-inner outline-none transition-colors focus:border-primary sm:text-lg"
        />

        {/* ボタン */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!textValue.trim()}
            className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 font-serif text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 sm:px-8 sm:py-3 sm:text-base"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            これで おはなしを かえる！
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-full bg-background/80 px-5 py-2.5 font-serif text-sm text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:scale-105 active:scale-95 sm:px-7 sm:py-3 sm:text-base"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
            やめる
          </button>
        </div>
      </div>
    </div>
  )
}
