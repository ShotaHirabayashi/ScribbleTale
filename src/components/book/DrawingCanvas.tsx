'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Check, Eraser, Trash2 } from 'lucide-react'

interface DrawingCanvasProps {
  onComplete: (imageBase64: string) => void
  onCancel: () => void
}

const COLORS = [
  { name: 'あか', value: '#e74c3c' },
  { name: 'あお', value: '#3498db' },
  { name: 'きいろ', value: '#f1c40f' },
  { name: 'みどり', value: '#2ecc71' },
  { name: 'くろ', value: '#2c3e50' },
  { name: 'ピンク', value: '#e91e90' },
]

const LINE_WIDTH = 5
const ERASER_WIDTH = 20

// 出力画像の最大サイズ（px）- Base64サイズ削減のため
const MAX_OUTPUT_SIZE = 512
// JPEG品質（0.0〜1.0）
const JPEG_QUALITY = 0.7

export function DrawingCanvas({ onComplete, onCancel }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const [isEraser, setIsEraser] = useState(false)
  const isDrawingRef = useRef(false)

  // Canvas のサイズを親要素に合わせる
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resizeCanvas()

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.stopPropagation()
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.setPointerCapture(e.pointerId)
      isDrawingRef.current = true

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const pos = getPos(e)

      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = ERASER_WIDTH
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = selectedColor
        ctx.lineWidth = LINE_WIDTH
      }

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    },
    [selectedColor, isEraser, getPos]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.stopPropagation()
      e.preventDefault()
      if (!isDrawingRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      const pos = getPos(e)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    },
    [getPos]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.stopPropagation()
      e.preventDefault()
      isDrawingRef.current = false
    },
    []
  )

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const handleComplete = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Canvasをリサイズしてデータサイズを削減
    const scale = Math.min(MAX_OUTPUT_SIZE / canvas.width, MAX_OUTPUT_SIZE / canvas.height, 1)
    const outW = Math.round(canvas.width * scale)
    const outH = Math.round(canvas.height * scale)

    const offscreen = document.createElement('canvas')
    offscreen.width = outW
    offscreen.height = outH
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    // 白背景を描画（JPEG透過非対応のため）
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outW, outH)
    ctx.drawImage(canvas, 0, 0, outW, outH)

    const dataUrl = offscreen.toDataURL('image/jpeg', JPEG_QUALITY)
    const base64 = dataUrl.split(',')[1]
    onComplete(base64)
  }, [onComplete])

  const selectColor = useCallback((color: string) => {
    setSelectedColor(color)
    setIsEraser(false)
  }, [])

  // タッチスクロール防止
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Canvas area */}
      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair touch-none"
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Toolbar */}
      <div
        className="flex shrink-0 flex-col gap-1.5 bg-black/40 px-2 py-1.5 backdrop-blur-sm sm:px-3 sm:py-2"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Colors row */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => selectColor(color.value)}
              className={`relative h-9 w-9 rounded-full border-2 transition-transform sm:h-10 sm:w-10 ${
                selectedColor === color.value && !isEraser
                  ? 'scale-110 border-white'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={color.name}
            >
              {selectedColor === color.value && !isEraser && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:h-5 sm:w-5" />
              )}
            </button>
          ))}
          <button
            onClick={() => setIsEraser(true)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform sm:h-10 sm:w-10 ${
              isEraser
                ? 'scale-110 border-white bg-white/30'
                : 'border-transparent bg-white/20 hover:scale-105'
            }`}
            aria-label="けしごむ"
          >
            <Eraser className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={handleClear}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-transparent bg-white/20 transition-transform hover:scale-105 sm:h-10 sm:w-10"
            aria-label="ぜんぶけす"
          >
            <Trash2 className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-full bg-white/20 px-5 py-2 font-serif text-sm font-bold text-white transition-all hover:bg-white/30 active:scale-95 sm:px-6 sm:py-2.5 sm:text-base"
          >
            やめる
          </button>
          <button
            onClick={handleComplete}
            className="rounded-full bg-primary px-5 py-2 font-serif text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 sm:px-6 sm:py-2.5 sm:text-base"
          >
            できた！
          </button>
        </div>
      </div>
    </div>
  )
}
