'use client'

import { useCallback, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Pencil, RotateCcw, X } from 'lucide-react'
import { DrawingCanvas } from './DrawingCanvas'

interface DrawingOverlayProps {
  illustration?: string
  onComplete: (imageBase64: string) => void
  onCancel: () => void
  isRecognizing?: boolean
  error?: string | null
  onRetry?: () => void
  onErrorClose?: () => void
}

export function DrawingOverlay({
  illustration,
  onComplete,
  onCancel,
  isRecognizing = false,
  error,
  onRetry,
  onErrorClose,
}: DrawingOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // iOS Safari の長押しコンテキストメニューを完全にブロック
  const preventContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
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

          {/* 認識中ローディングオーバーレイ */}
          {isRecognizing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
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
          )}

          {/* エラー表示オーバーレイ */}
          {error && onRetry && onErrorClose && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="rounded-2xl bg-background/95 px-6 py-4 shadow-lg">
                  <p className="font-serif text-sm text-foreground sm:text-base">
                    {error}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-serif text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:px-6 sm:py-3 sm:text-base"
                  >
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                    もういちど
                  </button>
                  <button
                    onClick={onErrorClose}
                    className="flex items-center gap-1.5 rounded-full bg-background/80 px-4 py-2.5 font-serif text-sm text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background hover:scale-105 active:scale-95 sm:px-5 sm:py-3 sm:text-base"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    やめる
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // SSR時はレンダリングしない、クライアントではPortalでbody直下にマウント
  if (!mounted) return null
  return createPortal(overlay, document.body)
}
