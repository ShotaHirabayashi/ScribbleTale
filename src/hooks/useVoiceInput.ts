'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useLiveSession } from './useLiveSession'
import { useAudioStream } from './useAudioStream'
import { useCommentTime } from './useCommentTime'
import { useStoryStore } from '@/stores/story-store'
import type { ExtractionResult } from '@/lib/types'

interface UseVoiceInputOptions {
  bookId: string
  bookTitle: string
  currentPageIndex: number
  pages: { text: string; currentText?: string }[]
  isCommentTimePhase: boolean
}

/**
 * 音声入力の統合フック
 *
 * useLiveSession + useAudioStream + useCommentTime を接続し、
 * コメントタイム中のマイク起動→Live API→キーワード抽出→store反映を管理
 */
export function useVoiceInput({
  bookId,
  bookTitle,
  currentPageIndex,
  pages,
  isCommentTimePhase,
}: UseVoiceInputOptions) {
  const addPendingKeyword = useStoryStore((s) => s.addPendingKeyword)
  const setChildUtterance = useStoryStore((s) => s.setChildUtterance)
  const endCommentTime = useStoryStore((s) => s.endCommentTime)

  const isConnectingRef = useRef(false)
  const prevPhaseRef = useRef(false)

  const currentPageText = pages[currentPageIndex]?.currentText || pages[currentPageIndex]?.text || ''

  // キーワード抽出コールバック
  const handleKeywordExtracted = useCallback(
    (keyword: string, utterance: string) => {
      const extraction: ExtractionResult = {
        keyword,
        childUtterance: utterance,
        trigger: 'voice',
        timestamp: Date.now(),
      }
      addPendingKeyword(extraction)
      setChildUtterance(utterance)
    },
    [addPendingKeyword, setChildUtterance]
  )

  // Live APIからのコメントタイム終了シグナル
  const handleEndCommentTime = useCallback(
    (reason: string) => {
      if (reason === 'end_keyword') {
        endCommentTime('end_keyword')
      } else {
        endCommentTime('silence_timeout')
      }
    },
    [endCommentTime]
  )

  // トランスクリプト（子どもの発言表示用）
  const handleTranscript = useCallback(
    (text: string) => {
      setChildUtterance(text)
    },
    [setChildUtterance]
  )

  const [apiKey, setApiKey] = useState('')

  // サーバーサイドからAPIキーを取得（NEXT_PUBLIC_を使わない）
  useEffect(() => {
    fetch('/api/session-key')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.apiKey) setApiKey(data.apiKey)
      })
      .catch(() => {
        console.warn('[useVoiceInput] Failed to get session key')
      })
  }, [])

  // Live API セッション
  const liveSession = useLiveSession({
    apiKey,
    bookTitle,
    currentPageText,
    onKeywordExtracted: handleKeywordExtracted,
    onEndCommentTime: handleEndCommentTime,
    onTranscript: handleTranscript,
  })

  // コメントタイムタイマー
  const commentTime = useCommentTime({
    maxDurationMs: 30000,
    silenceTimeoutMs: 5000,
  })

  // 音声データ送信 + 無音タイマーリセット
  const handleAudioData = useCallback(
    (base64Data: string) => {
      liveSession.sendAudio(base64Data)
      commentTime.notifySpeech()
    },
    [liveSession.sendAudio, commentTime.notifySpeech] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // 音声ストリーム（マイク → Live APIへ送信）
  const audioStream = useAudioStream({
    onAudioData: handleAudioData,
  })

  // コメントタイムフェーズ開始/終了でマイクとLive API を制御
  useEffect(() => {
    const wasActive = prevPhaseRef.current
    prevPhaseRef.current = isCommentTimePhase

    if (isCommentTimePhase && !wasActive) {
      // コメントタイム開始 → マイク起動 + Live API接続
      if (!apiKey) {
        console.warn('[useVoiceInput] No API key, voice input disabled')
        return
      }

      if (isConnectingRef.current) return
      isConnectingRef.current = true

      const startVoice = async () => {
        try {
          // Live API接続（未接続の場合のみ）
          if (!liveSession.isConnected) {
            await liveSession.connect()
          }
          // ミュート解除
          liveSession.setMuted(false)
          // マイク起動
          await audioStream.start()
        } catch (err) {
          console.error('[useVoiceInput] Failed to start:', err)
        } finally {
          isConnectingRef.current = false
        }
      }

      startVoice()
    } else if (!isCommentTimePhase && wasActive) {
      // コメントタイム終了 → マイク停止 + ミュート
      audioStream.stop()
      liveSession.setMuted(true)
    }
  }, [isCommentTimePhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ページ遷移時にLive APIのコンテキストを更新
  useEffect(() => {
    if (liveSession.isConnected) {
      liveSession.updateContext(currentPageText)
    }
  }, [currentPageIndex, currentPageText]) // eslint-disable-line react-hooks/exhaustive-deps

  // クリーンアップ
  useEffect(() => {
    return () => {
      audioStream.stop()
      liveSession.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected: liveSession.isConnected,
    isStreaming: audioStream.isStreaming,
    hasPermission: audioStream.hasPermission,
    error: liveSession.error,
  }
}
