'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface UseCameraOptions {
  enabled: boolean
  onFrame?: (imageBase64: string) => void
  debounceMs?: number
}

export function useCamera({
  enabled,
  onFrame,
  debounceMs = 500,
}: UseCameraOptions) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isActive, setIsActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastCaptureRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      setHasPermission(true)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsActive(true)

      // フレームキャプチャ（debounce付き）
      if (onFrame) {
        intervalRef.current = setInterval(() => {
          const now = Date.now()
          if (now - lastCaptureRef.current < debounceMs) return
          lastCaptureRef.current = now

          captureFrame()
        }, debounceMs)
      }
    } catch (error) {
      setHasPermission(false)
      console.error('[useCamera] Failed to get camera access:', error)
    }
  }, [onFrame, debounceMs])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
  }, [])

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    const base64 = dataUrl.split(',')[1]

    onFrame?.(base64)
  }, [onFrame])

  // enabled状態に連動
  useEffect(() => {
    if (enabled && !isActive) {
      start()
    } else if (!enabled && isActive) {
      stop()
    }
  }, [enabled, isActive, start, stop])

  // クリーンアップ
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    videoRef,
    canvasRef,
    isActive,
    hasPermission,
    start,
    stop,
  }
}
