'use client'

import { useRef, useCallback, useState } from 'react'
import { LiveSessionManager } from '@/lib/gemini/live-session'

interface UseLiveSessionOptions {
  apiKey: string
  bookTitle: string
  currentPageText: string
  onKeywordExtracted: (keyword: string, utterance: string) => void
  onEndCommentTime: (reason: string) => void
  onTranscript: (text: string) => void
}

export function useLiveSession(options: UseLiveSessionOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const managerRef = useRef<LiveSessionManager | null>(null)

  const connect = useCallback(async () => {
    if (managerRef.current) {
      managerRef.current.disconnect()
    }

    const manager = new LiveSessionManager({
      apiKey: options.apiKey,
      bookTitle: options.bookTitle,
      currentPageText: options.currentPageText,
      onKeywordExtracted: options.onKeywordExtracted,
      onEndCommentTime: options.onEndCommentTime,
      onTranscript: options.onTranscript,
      onError: (err) => {
        setError(err)
        setIsConnected(false)
      },
    })

    managerRef.current = manager

    try {
      await manager.connect()
      setIsConnected(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [options])

  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.disconnect()
      managerRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendAudio = useCallback((audioData: string) => {
    managerRef.current?.sendAudio(audioData)
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    managerRef.current?.setMuted(muted)
  }, [])

  const updateContext = useCallback((pageText: string) => {
    managerRef.current?.updateContext(pageText)
  }, [])

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendAudio,
    setMuted,
    updateContext,
  }
}
