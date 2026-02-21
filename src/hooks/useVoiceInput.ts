'use client'

import { useEffect, useRef } from 'react'
import { useCommentTime } from './useCommentTime'
import { useStoryStore } from '@/stores/story-store'
import { SpeechRecognitionManager } from '@/lib/speech/speech-recognition'

interface UseVoiceInputOptions {
  currentPageIndex: number
  pages: { text: string; currentText?: string }[]
  isCommentTimePhase: boolean
}

/**
 * 音声入力の統合フック
 *
 * Web Speech API で音声→テキスト変換し、
 * 確定テキストをそのまま改変エンジンに渡す（キーワード抽出APIは不要）
 */
export function useVoiceInput({
  currentPageIndex,
  pages,
  isCommentTimePhase,
}: UseVoiceInputOptions) {
  const addPendingKeyword = useStoryStore((s) => s.addPendingKeyword)
  const setChildUtterance = useStoryStore((s) => s.setChildUtterance)

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null)
  const prevPhaseRef = useRef(false)
  const finalTranscriptRef = useRef('')

  // コメントタイムタイマー
  const commentTime = useCommentTime({
    maxDurationMs: 30000,
    silenceTimeoutMs: 10000,
  })

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
            console.log('[useVoiceInput] Final transcript:', transcript.trim())

            // 発話テキストをそのままキーワード＆発話として即座にストアに登録
            addPendingKeyword({
              keyword: transcript.trim(),
              childUtterance: transcript.trim(),
              trigger: 'voice',
              timestamp: Date.now(),
            })
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
    isConnected: true,
    isStreaming: isCommentTimePhase,
    hasPermission: SpeechRecognitionManager.isSupported(),
    error: null,
  }
}
