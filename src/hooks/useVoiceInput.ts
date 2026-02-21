'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCommentTime } from './useCommentTime'
import { useStoryStore } from '@/stores/story-store'
import { SpeechRecognitionManager } from '@/lib/speech/speech-recognition'
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
 * Web Speech API で音声→テキスト変換し、
 * /api/extract-keyword でキーワード抽出→store反映を管理
 */
export function useVoiceInput({
  bookTitle,
  currentPageIndex,
  pages,
  isCommentTimePhase,
}: UseVoiceInputOptions) {
  const addPendingKeyword = useStoryStore((s) => s.addPendingKeyword)
  const setChildUtterance = useStoryStore((s) => s.setChildUtterance)
  const setIsExtractingKeyword = useStoryStore((s) => s.setIsExtractingKeyword)

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null)
  const prevPhaseRef = useRef(false)
  const extractingRef = useRef(false)
  const finalTranscriptRef = useRef('')

  const currentPageText = pages[currentPageIndex]?.currentText || pages[currentPageIndex]?.text || ''

  // コメントタイムタイマー
  const commentTime = useCommentTime({
    maxDurationMs: 30000,
    silenceTimeoutMs: 10000,
  })

  // キーワード抽出（サーバーサイド）
  const extractKeyword = useCallback(
    async (utterance: string) => {
      if (extractingRef.current || !utterance.trim()) return
      extractingRef.current = true
      setIsExtractingKeyword(true)

      try {
        console.log('[useVoiceInput] Extracting keyword from:', utterance)
        const res = await fetch('/api/extract-keyword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utterance,
            bookTitle,
            currentPageText,
          }),
        })

        if (!res.ok) {
          console.warn('[useVoiceInput] Keyword extraction failed:', res.status)
          setIsExtractingKeyword(false)
          return
        }

        const data = await res.json()
        if (data.keyword) {
          console.log('[useVoiceInput] Keyword extracted:', data.keyword)
          const extraction: ExtractionResult = {
            keyword: data.keyword,
            childUtterance: utterance,
            trigger: 'voice',
            timestamp: Date.now(),
          }
          addPendingKeyword(extraction)
          setChildUtterance(utterance)
        } else {
          // キーワードなし → フラグ解除（readingCompleteへフォールバック）
          setIsExtractingKeyword(false)
        }
      } catch (err) {
        console.error('[useVoiceInput] Extraction error:', err)
        setIsExtractingKeyword(false)
      } finally {
        extractingRef.current = false
      }
    },
    [bookTitle, currentPageText, addPendingKeyword, setChildUtterance, setIsExtractingKeyword]
  )

  // コメントタイムフェーズ開始/終了で音声認識を制御
  useEffect(() => {
    const wasActive = prevPhaseRef.current
    prevPhaseRef.current = isCommentTimePhase

    if (isCommentTimePhase && !wasActive) {
      // コメントタイム開始 → 音声認識起動
      if (!SpeechRecognitionManager.isSupported()) {
        console.warn('[useVoiceInput] SpeechRecognition not supported in this browser')
        return
      }

      finalTranscriptRef.current = ''

      const manager = new SpeechRecognitionManager({
        lang: 'ja-JP',
        onResult: (transcript, isFinal) => {
          setChildUtterance(transcript)
          commentTime.notifySpeech()

          if (isFinal && transcript.trim()) {
            finalTranscriptRef.current = transcript.trim()
            // 確定テキストをキーワード抽出に送る
            extractKeyword(transcript.trim())
          }
        },
        onError: (error) => {
          console.warn('[useVoiceInput] Speech recognition error:', error)
        },
        onEnd: () => {
          // コメントタイム中なら再起動（音声認識は一定時間で自動終了することがある）
          if (prevPhaseRef.current && recognitionRef.current) {
            console.log('[useVoiceInput] Restarting speech recognition...')
            setTimeout(() => {
              recognitionRef.current?.start()
            }, 100)
          }
        },
      })

      recognitionRef.current = manager
      manager.start()
      console.log('[useVoiceInput] Speech recognition started')
    } else if (!isCommentTimePhase && wasActive) {
      // コメントタイム終了 → 音声認識停止
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [isCommentTimePhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // クリーンアップ
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [])

  return {
    isConnected: true, // Web Speech APIは常に利用可能
    isStreaming: isCommentTimePhase,
    hasPermission: SpeechRecognitionManager.isSupported(),
    error: null,
  }
}
