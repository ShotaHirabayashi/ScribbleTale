'use client'

import { Camera, CameraOff } from 'lucide-react'
import type { RefObject } from 'react'

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  isActive: boolean
  hasPermission: boolean | null
}

export function CameraPreview({
  videoRef,
  canvasRef,
  isActive,
  hasPermission,
}: CameraPreviewProps) {
  if (hasPermission === false) {
    return (
      <div className="fixed bottom-20 right-4 z-30 flex h-20 w-28 items-center justify-center rounded-xl bg-background/80 shadow-lg backdrop-blur-sm sm:bottom-24 sm:right-6 sm:h-24 sm:w-32">
        <div className="flex flex-col items-center gap-1">
          <CameraOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">カメラ オフ</span>
        </div>
      </div>
    )
  }

  if (!isActive) return null

  return (
    <div className="fixed bottom-20 right-4 z-30 overflow-hidden rounded-xl shadow-lg sm:bottom-24 sm:right-6">
      <div className="relative">
        <video
          ref={videoRef}
          className="h-20 w-28 object-cover sm:h-24 sm:w-32"
          autoPlay
          playsInline
          muted
        />
        <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-background/60 px-1.5 py-0.5 backdrop-blur-sm">
          <Camera className="h-2.5 w-2.5 text-primary" />
          <span className="text-[9px] text-foreground/80">らくがき</span>
        </div>
        {/* 隠しcanvas（フレームキャプチャ用） */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
