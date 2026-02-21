'use client'

import { useRef, useCallback, useState } from 'react'

interface UseAudioStreamOptions {
  onAudioData: (base64Data: string) => void
  sampleRate?: number
}

export function useAudioStream({ onAudioData, sampleRate = 16000 }: UseAudioStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      setHasPermission(true)
      mediaStreamRef.current = stream

      const audioContext = new AudioContext({ sampleRate })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        // Float32 → Int16 PCM変換
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }

        // Base64エンコード
        const bytes = new Uint8Array(pcmData.buffer)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)

        onAudioData(base64)
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      setIsStreaming(true)
    } catch (error) {
      setHasPermission(false)
      console.error('[useAudioStream] Failed to get microphone access:', error)
    }
  }, [onAudioData, sampleRate])

  const stop = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    setIsStreaming(false)
  }, [])

  return {
    isStreaming,
    hasPermission,
    start,
    stop,
  }
}
