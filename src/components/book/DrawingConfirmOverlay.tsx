'use client'

import Image from 'next/image'
import { Check, RotateCcw } from 'lucide-react'

interface DrawingConfirmOverlayProps {
  keyword: string
  drawingImageBase64: string
  onConfirm: () => void
  onReject: () => void
}

export function DrawingConfirmOverlay({
  keyword,
  drawingImageBase64,
  onConfirm,
  onReject,
}: DrawingConfirmOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        {/* 描いた絵のプレビュー */}
        <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-background/80 bg-white shadow-xl sm:h-40 sm:w-40">
          <Image
            src={drawingImageBase64}
            alt="おえかき"
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>

        {/* 吹き出し */}
        <div className="relative max-w-[80%]">
          <div className="rounded-2xl bg-background/95 px-5 py-3 font-serif text-base text-foreground shadow-lg sm:text-lg">
            <span className="font-bold text-primary">{keyword}</span> をかいたのかな？
          </div>
          {/* 吹き出しの三角 */}
          <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-background/95" />
        </div>

        {/* ボタン */}
        <div className="flex items-center gap-4">
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 font-serif text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:px-8 sm:py-3 sm:text-base"
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
            うん！
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 rounded-full bg-background/80 px-5 py-2.5 font-serif text-sm text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:scale-105 active:scale-95 sm:px-7 sm:py-3 sm:text-base"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
            ちがう！
          </button>
        </div>
      </div>
    </div>
  )
}
