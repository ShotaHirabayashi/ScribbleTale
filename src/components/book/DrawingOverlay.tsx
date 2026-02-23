'use client'

import { useCallback } from 'react'
import { DrawingCanvas } from './DrawingCanvas'

interface DrawingOverlayProps {
  onComplete: (imageBase64: string) => void
  onCancel: () => void
}

export function DrawingOverlay({ onComplete, onCancel }: DrawingOverlayProps) {
  // iOS Safari の長押しコンテキストメニューを完全にブロック
  const preventContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div
      className="absolute inset-0 z-20 bg-black/10"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onContextMenu={preventContextMenu}
      onTouchStart={(e) => {
        // ツールバー以外のタッチで長押しメニューを防止
        e.preventDefault()
      }}
    >
      <DrawingCanvas onComplete={onComplete} onCancel={onCancel} />
    </div>
  )
}
