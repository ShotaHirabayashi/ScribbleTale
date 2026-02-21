'use client'

import { DrawingCanvas } from './DrawingCanvas'

interface DrawingOverlayProps {
  onComplete: (imageBase64: string) => void
  onCancel: () => void
}

export function DrawingOverlay({ onComplete, onCancel }: DrawingOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 bg-black/10">
      <DrawingCanvas onComplete={onComplete} onCancel={onCancel} />
    </div>
  )
}
