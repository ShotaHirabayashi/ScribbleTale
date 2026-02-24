'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { DrawingCanvas } from './DrawingCanvas'

interface DrawingOverlayProps {
  illustration?: string
  onComplete: (imageBase64: string) => void
  onCancel: () => void
}

export function DrawingOverlay({ illustration, onComplete, onCancel }: DrawingOverlayProps) {
  // iOS Safari の長押しコンテキストメニューを完全にブロック
  const preventContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onContextMenu={preventContextMenu}
      onTouchStart={(e) => {
        e.preventDefault()
      }}
    >
      <div className="relative flex h-[85dvh] w-[92vw] max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        {/* 挿絵を薄く背景表示 */}
        {illustration && (
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={illustration}
              alt=""
              fill
              className="object-contain opacity-20"
            />
          </div>
        )}

        {/* ヘッダー */}
        <div className="shrink-0 bg-[var(--storybook-peach)]/80 px-4 py-2 text-center backdrop-blur-sm">
          <p className="font-serif text-sm font-bold text-[var(--storybook-brown)]">
            すきな えを かいてね！
          </p>
        </div>

        {/* 描画キャンバス */}
        <div className="relative min-h-0 flex-1">
          <DrawingCanvas onComplete={onComplete} onCancel={onCancel} />
        </div>
      </div>
    </div>
  )
}
