'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { MusicSessionManager } from '@/lib/gemini/music-session'
import { getBgmPrompts, type MusicPromptConfig } from '@/lib/audio/music-prompts'
import { Howl } from 'howler'

const FALLBACK_BGM_PATH = '/sounds/fallback-bgm.wav'
const COMMENT_TIME_VOLUME = 0.15
const NORMAL_VOLUME = 0.5
const CIRCUIT_BREAKER_THRESHOLD = 3

interface UseMusicSessionOptions {
  bookId: string
  currentPage: number
  isCommentTime: boolean
  isMuted: boolean
  isInitialized: boolean // SoundProvider の初期化フラグ
  bgmOverride?: MusicPromptConfig | null
}

export function useMusicSession({
  bookId,
  currentPage,
  isCommentTime,
  isMuted,
  isInitialized,
  bgmOverride,
}: UseMusicSessionOptions) {
  const managerRef = useRef<MusicSessionManager | null>(null)
  const fallbackRef = useRef<Howl | null>(null)
  const errorCountRef = useRef(0)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const promptsRef = useRef<Record<number, MusicPromptConfig>>({})

  // BGMプロンプトを bookId から取得
  useEffect(() => {
    promptsRef.current = getBgmPrompts(bookId)
  }, [bookId])

  // フォールバックBGM初期化
  const initFallback = useCallback(() => {
    if (fallbackRef.current) return

    fallbackRef.current = new Howl({
      src: [FALLBACK_BGM_PATH],
      loop: true,
      volume: NORMAL_VOLUME,
      preload: true,
    })
  }, [])

  // フォールバックに切り替え
  const switchToFallback = useCallback(() => {
    if (isUsingFallback) return

    console.warn('[useMusicSession] Switching to fallback BGM')
    setIsUsingFallback(true)

    // Lyria切断
    managerRef.current?.disconnect()

    // フォールバック再生
    initFallback()
    if (!isMuted) {
      fallbackRef.current?.play()
    }
  }, [isUsingFallback, isMuted, initFallback])

  // Lyria接続
  useEffect(() => {
    if (!isInitialized) return
    if (isUsingFallback) return

    let cancelled = false

    const initSession = async () => {
      // サーバーサイドからAPIキーを取得（NEXT_PUBLIC_を使わない）
      try {
        const res = await fetch('/api/session-key')
        if (!res.ok) {
          console.warn('[useMusicSession] Failed to get session key, using fallback')
          if (!cancelled) switchToFallback()
          return
        }
        const { apiKey } = await res.json()
        if (!apiKey || cancelled) {
          if (!cancelled) switchToFallback()
          return
        }

        const manager = new MusicSessionManager({
          onStateChange: (state) => {
            setIsConnected(state === 'connected')
          },
          onError: (error) => {
            console.error('[useMusicSession] Error:', error)
            errorCountRef.current++

            if (errorCountRef.current >= CIRCUIT_BREAKER_THRESHOLD) {
              switchToFallback()
            }
          },
        })

        if (cancelled) return
        managerRef.current = manager
        await manager.connect(apiKey)

        if (cancelled) {
          manager.disconnect()
          return
        }

        // 接続後に現在ページのプロンプトを設定して再生開始
        const config = promptsRef.current[currentPage + 1]
        if (config) {
          manager.updatePrompt(config.prompts)
          manager.updateConfig(config.generationConfig)
        }
        manager.play()
      } catch {
        if (!cancelled) switchToFallback()
      }
    }

    initSession()

    return () => {
      cancelled = true
      managerRef.current?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isUsingFallback])

  // ページ遷移時にBGMプロンプトを更新
  useEffect(() => {
    if (!isConnected || isUsingFallback) return

    const pageNumber = currentPage + 1 // 0-indexed → 1-indexed
    const config = promptsRef.current[pageNumber]
    if (!config) return

    const manager = managerRef.current
    if (!manager) return

    manager.updatePrompt(config.prompts)
    manager.updateConfig(config.generationConfig)
  }, [currentPage, isConnected, isUsingFallback])

  // BGMオーバーライド（改変時の動的プロンプト差し替え）
  useEffect(() => {
    if (!isConnected || isUsingFallback) return

    const manager = managerRef.current
    if (!manager) return

    if (bgmOverride) {
      // 改変による動的BGMプロンプトに切り替え
      console.log('[useMusicSession] Applying bgmOverride:', bgmOverride.prompts[0]?.text)
      manager.updatePrompt(bgmOverride.prompts)
      manager.updateConfig(bgmOverride.generationConfig)
    } else {
      // null = ページめくり後 → 通常のページプロンプトに復帰
      const pageNumber = currentPage + 1
      const config = promptsRef.current[pageNumber]
      if (config) {
        console.log('[useMusicSession] Reverting to page prompt, page:', pageNumber)
        manager.updatePrompt(config.prompts)
        manager.updateConfig(config.generationConfig)
      }
    }
  }, [bgmOverride, isConnected, isUsingFallback, currentPage])

  // コメントタイム中はボリュームを下げる
  useEffect(() => {
    const volume = isCommentTime ? COMMENT_TIME_VOLUME : NORMAL_VOLUME

    if (isUsingFallback) {
      fallbackRef.current?.volume(volume)
    } else {
      managerRef.current?.setVolume(volume)
    }
  }, [isCommentTime, isUsingFallback])

  // ミュート制御
  useEffect(() => {
    if (isUsingFallback) {
      if (isMuted) {
        fallbackRef.current?.pause()
      } else if (fallbackRef.current && !fallbackRef.current.playing()) {
        fallbackRef.current.play()
      }
    } else {
      if (isMuted) {
        managerRef.current?.pause()
      } else {
        managerRef.current?.play()
      }
    }
  }, [isMuted, isUsingFallback])

  // クリーンアップ
  useEffect(() => {
    return () => {
      managerRef.current?.disconnect()
      fallbackRef.current?.unload()
    }
  }, [])

  return { isUsingFallback, isConnected }
}
