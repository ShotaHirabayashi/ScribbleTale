import { useCallback, useEffect, useRef } from 'react'
import { useStoryStore } from '@/stores/story-store'
import { usePrefetchRegeneration } from './usePrefetchRegeneration'
import type { StoryPage } from '@/lib/types'

/** ストリームのNDJSONチャンクを読み取るユーティリティ */
async function* readNDJSON(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed) {
        try {
          yield JSON.parse(trimmed)
        } catch {
          console.warn('[useStory] Failed to parse NDJSON line:', trimmed)
        }
      }
    }
  }

  // 残りのバッファを処理
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim())
    } catch {
      console.warn('[useStory] Failed to parse remaining buffer:', buffer)
    }
  }
}

/** Zustand storeのヘルパーフック */
export function useStory(bookId?: string, initialPages?: StoryPage[], sessionId?: string) {
  const store = useStoryStore()
  const modificationInProgressRef = useRef(false)
  const regenerationInProgressRef = useRef(false)
  const initRef = useRef(false)

  // ストーリー初期化（1回だけ実行）
  useEffect(() => {
    if (!bookId || !initialPages || initRef.current) return
    initRef.current = true

    if (sessionId) {
      // セッションID付きURL → Firestoreから復元
      import('@/lib/firebase/firestore').then(({ restoreOrInitSession }) => {
        restoreOrInitSession(sessionId, bookId, initialPages).then((session) => {
          const isRestored = session.pages.some((p) => p.isModified)
          const restoredPages = isRestored
            ? session.pages.map((p) => ({ ...p, textRevealed: true }))
            : session.pages
          store.initializeStory(bookId, restoredPages, session.storyId, session.characterStates)
        }).catch(() => {
          store.initializeStory(bookId, initialPages, sessionId)
        })
      }).catch(() => {
        store.initializeStory(bookId, initialPages, sessionId)
      })
    } else {
      // セッションIDなし（readOnlyや旧URL）→ ローカルのみ
      store.initializeStory(bookId, initialPages)
    }
  }, [bookId, initialPages, sessionId, store])

  /** テキスト文字送り完了時のハンドラ */
  const handleReadingComplete = useCallback(() => {
    const phase = store.pagePhase
    console.log('[useStory] handleReadingComplete, phase:', phase)
    if (phase === 'reading') {
      store.markTextRevealed(store.currentPageIndex)
      store.setPagePhase('readingComplete')
    } else if (phase === 'modified') {
      // 改変テキスト文字送り完了 → ユーザーがページを読めるよう readingComplete で止める
      store.markTextRevealed(store.currentPageIndex)
      store.setPagePhase('readingComplete')
    }
  }, [store])

  /** コメントタイム開始 */
  const handleStartCommentTime = useCallback(() => {
    store.startCommentTime()
  }, [store])

  /** コメントタイム終了（おわりボタン） */
  const handleEndCommentTime = useCallback(() => {
    store.endCommentTime('end_keyword')
  }, [store])

  /** コメントタイムスキップ */
  const handleSkipCommentTime = useCallback(() => {
    store.skipCommentTime()
  }, [store])

  /** 確認オーバーレイ: 改変を承認 */
  const handleConfirmModification = useCallback(() => {
    store.confirmModification()
  }, [store])

  /** 確認オーバーレイ: キャンセル */
  const handleCancelConfirmation = useCallback(() => {
    store.cancelConfirmation()
  }, [store])

  // 波及再生成の先読み
  const { consumeCache: consumePrefetchCache } = usePrefetchRegeneration({
    pages: store.pages,
    currentPageIndex: store.currentPageIndex,
    pagePhase: store.pagePhase,
    modificationPhase: store.modificationPhase,
    bookId: store.bookId,
    characterStates: store.characterStates,
  })

  // コメントタイム終了 → ストリーミング改変フロー起動
  useEffect(() => {
    if (
      store.pagePhase === 'modifying' &&
      store.selectedKeyword &&
      !modificationInProgressRef.current
    ) {
      modificationInProgressRef.current = true

      const runModification = async () => {
        try {
          store.setModificationPhase('orchestrating')

          const bookTitle = store.bookId === 'momotaro' ? 'ももたろう' : 'あかずきん'

          // illustration (base64 data URI) を除外してペイロードを軽量化
          const lightPages = store.pages.map(({ illustration, ...rest }) => rest)

          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 90000) // ストリーム全体のタイムアウト

          const targetPage = store.pages[store.currentPageIndex]

          const response = await fetch('/api/modify-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookId: store.bookId,
              bookTitle,
              keyword: store.selectedKeyword!.keyword,
              childUtterance: store.selectedKeyword!.childUtterance,
              currentPageIndex: store.currentPageIndex,
              pages: lightPages,
              trigger: store.selectedKeyword!.trigger,
              characterStates: store.characterStates,
              // drawing トリガー用の追加パラメータ
              ...(store.selectedKeyword!.trigger === 'drawing' && store.drawingImageBase64
                ? {
                    referenceImageBase64: store.drawingImageBase64,
                    originalDescription: targetPage?.alt || '',
                  }
                : {}),
            }),
            signal: controller.signal,
          })
          clearTimeout(timer)

          if (!response.ok || !response.body) {
            throw new Error(`Modify stream failed: ${response.status}`)
          }

          const reader = response.body.getReader()
          let targetPageIndex = store.currentPageIndex
          let textApplied = false

          for await (const chunk of readNDJSON(reader)) {
            switch (chunk.type) {
              case 'text':
                // テキスト改変結果を即座に表示
                targetPageIndex = chunk.targetPageIndex
                store.applyTextFirst(
                  chunk.targetPageIndex,
                  chunk.modifiedText,
                  chunk.modification
                )
                textApplied = true
                break

              case 'orchestration':
                // キャラクター状態更新を反映
                if (chunk.characterStateUpdates && chunk.characterStateUpdates.length > 0) {
                  store.updateCharacterStates(chunk.characterStateUpdates)
                }
                // 整合性チェックでテキストが修正された場合は差分を適用
                if (chunk.textCorrected && chunk.modifiedText) {
                  store.applyTextFirst(
                    targetPageIndex,
                    chunk.modifiedText,
                    chunk.modification
                  )
                }
                break

              case 'image':
                // 画像生成結果を反映
                if (chunk.imageBase64 && chunk.mimeType) {
                  store.applyImageUpdate(
                    targetPageIndex,
                    `data:${chunk.mimeType};base64,${chunk.imageBase64}`
                  )
                }
                break

              case 'image_failed':
                // 画像生成失敗 → graceful degradation
                console.warn('[useStory] Image generation failed via stream:', chunk.error)
                store.handleImageFailure(targetPageIndex)
                break

              case 'error':
                throw new Error(chunk.error || 'Stream error')

              case 'done':
                // 画像が来ていない場合（テキストのみ成功）も完了扱い
                if (textApplied && store.modificationPhase === 'generating_image') {
                  // 画像はまだ生成中 or 失敗済み → そのまま
                }
                break
            }
          }
        } catch (error) {
          console.error('[useStory] Modification failed:', error)
          // エラー時は readingComplete に戻す
          store.setModificationPhase('idle')
          store.setPagePhase('readingComplete')
          console.error('[useStory] keyword:', store.selectedKeyword?.keyword, 'utterance:', store.selectedKeyword?.childUtterance)
        } finally {
          modificationInProgressRef.current = false
        }
      }

      runModification()
    }
  }, [store.pagePhase, store.selectedKeyword, store])

  // 波及再生成: reading フェーズ + needsContextRegeneration → 自動再生成
  const currentPageNeedsRegen = store.pages[store.currentPageIndex]?.needsContextRegeneration
  useEffect(() => {
    if (
      store.pagePhase === 'reading' &&
      currentPageNeedsRegen &&
      !regenerationInProgressRef.current
    ) {
      regenerationInProgressRef.current = true

      const runRegeneration = async () => {
        try {
          // 先読みキャッシュを確認
          const cached = consumePrefetchCache(store.currentPageIndex)
          if (cached) {
            console.log('[useStory] Using prefetched regeneration for page', store.currentPageIndex)
            store.completeRegeneration(cached.targetPageIndex, cached.modifiedText, cached.illustration)
            return
          }

          store.setPagePhase('modifying')
          store.setModificationPhase('orchestrating')

          const bookTitle = store.bookId === 'momotaro' ? 'ももたろう' : 'あかずきん'

          // サーバーサイドAPIルート経由で波及再生成
          // illustration を除外してペイロードを軽量化
          const lightPages = store.pages.map(({ illustration, ...rest }) => rest)
          const regenController = new AbortController()
          const regenTimer = setTimeout(() => regenController.abort(), 60000)
          const response = await fetch('/api/regenerate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookTitle,
              currentPageIndex: store.currentPageIndex,
              pages: lightPages,
              characterStates: store.characterStates,
            }),
            signal: regenController.signal,
          })
          clearTimeout(regenTimer)

          if (!response.ok) {
            throw new Error(`Regenerate API failed: ${response.status}`)
          }

          const result = await response.json()

          // 波及再生成されたテキストに合わせて挿絵も再生成
          store.setModificationPhase('generating_image')
          let newIllustration: string | undefined
          try {
            const imgController = new AbortController()
            const imgTimer = setTimeout(() => imgController.abort(), 60000)
            const imgResponse = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sceneDescription: result.modifiedText,
              }),
              signal: imgController.signal,
            })
            clearTimeout(imgTimer)
            if (imgResponse.ok) {
              const imgResult = await imgResponse.json()
              newIllustration = `data:${imgResult.mimeType};base64,${imgResult.imageBase64}`
            }
          } catch (imgError) {
            console.warn('[useStory] Regeneration image failed, continuing without:', imgError)
          }

          // 波及再生成完了: reading に戻し、ユーザーが自分でページ送りする
          store.completeRegeneration(result.targetPageIndex, result.modifiedText, newIllustration)
        } catch (error) {
          console.error('[useStory] Context regeneration failed:', error)
          store.clearContextRegenerationFlag(store.currentPageIndex)
          store.setPagePhase('reading')
        } finally {
          regenerationInProgressRef.current = false
        }
      }

      runRegeneration()
    }
  }, [store.pagePhase, store.currentPageIndex, currentPageNeedsRegen, store])

  // 注: transitioning → ページ送りはStoryBookViewer側で処理
  // （StoryBookViewerがtransitioning検知 → flip → 700ms後にsyncPageIndex → reading）

  return {
    ...store,
    handleReadingComplete,
    handleStartCommentTime,
    handleEndCommentTime,
    handleSkipCommentTime,
    handleConfirmModification,
    handleCancelConfirmation,
  }
}
