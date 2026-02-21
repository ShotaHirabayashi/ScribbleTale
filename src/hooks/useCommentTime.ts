'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useStoryStore } from '@/stores/story-store'
import type { CommentTimeEndReason } from '@/lib/types'

interface UseCommentTimeOptions {
  maxDurationMs?: number
  silenceTimeoutMs?: number
}

/**
 * コメントタイムライフサイクル管理フック
 *
 * 終了条件:
 * - 無音5秒 (silenceTimeoutMs)
 * - 最大30秒 (maxDurationMs)
 * - 手動スキップ
 * - 終了キーワード
 */
export function useCommentTime({
  maxDurationMs = 30000,
  silenceTimeoutMs = 5000,
}: UseCommentTimeOptions = {}) {
  const {
    isCommentTimeActive,
    commentTimeRemainingMs,
    setCommentTimeRemaining,
    endCommentTime,
  } = useStoryStore()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSpeechRef = useRef<number>(Date.now())

  // カウントダウンタイマー
  useEffect(() => {
    if (!isCommentTimeActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    lastSpeechRef.current = Date.now()
    const startTime = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, maxDurationMs - elapsed)
      setCommentTimeRemaining(remaining)

      // 最大時間到達
      if (remaining <= 0) {
        endCommentTime('max_time_reached')
        return
      }

      // 無音タイムアウト
      const silenceElapsed = Date.now() - lastSpeechRef.current
      if (silenceElapsed >= silenceTimeoutMs) {
        endCommentTime('silence_timeout')
      }
    }, 100)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isCommentTimeActive, maxDurationMs, silenceTimeoutMs, setCommentTimeRemaining, endCommentTime])

  /** 音声入力があった際に呼ぶ（無音タイマーリセット） */
  const notifySpeech = useCallback(() => {
    lastSpeechRef.current = Date.now()
  }, [])

  /** キーワード検出時 */
  const handleKeywordDetected = useCallback(
    (reason: CommentTimeEndReason = 'keyword_detected') => {
      endCommentTime(reason)
    },
    [endCommentTime]
  )

  return {
    isCommentTimeActive,
    commentTimeRemainingMs,
    notifySpeech,
    handleKeywordDetected,
  }
}
