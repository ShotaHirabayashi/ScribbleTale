import { useCallback, useEffect, useRef } from 'react'
import { useStoryStore } from '@/stores/story-store'
import type { StoryPage } from '@/lib/types'

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
          store.initializeStory(bookId, restoredPages, session.storyId)
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

  // コメントタイム終了 → 改変フロー起動
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

          // サーバーサイドAPIルート経由で改変 + オーケストレーション
          // illustration (base64 data URI) を除外してペイロードを軽量化
          const lightPages = store.pages.map(({ illustration, ...rest }) => rest)
          const modifyController = new AbortController()
          const modifyTimer = setTimeout(() => modifyController.abort(), 60000)
          const response = await fetch('/api/modify', {
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
            }),
            signal: modifyController.signal,
          })
          clearTimeout(modifyTimer)

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}))
            throw new Error(`Modify API failed: ${response.status} - ${errBody.error || 'unknown'}`)
          }

          store.setModificationPhase('generating_image')

          const result = await response.json()

          // 挿絵を改変テキストに合わせて再生成
          let newIllustration: string | undefined
          const targetPage = store.pages[result.targetPageIndex]

          if (
            store.selectedKeyword?.trigger === 'drawing' &&
            store.drawingImageBase64
          ) {
            // drawing トリガー: 描画を参照して画像編集
            try {
              const editController = new AbortController()
              const editTimer = setTimeout(() => editController.abort(), 60000)
              const editResponse = await fetch('/api/edit-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  originalDescription: targetPage?.alt || '',
                  keyword: store.selectedKeyword.keyword,
                  modifiedText: result.modifiedText,
                  referenceImageBase64: store.drawingImageBase64,
                }),
                signal: editController.signal,
              })
              clearTimeout(editTimer)
              if (editResponse.ok) {
                const editResult = await editResponse.json()
                newIllustration = `data:${editResult.mimeType};base64,${editResult.imageBase64}`
              }
            } catch (imgError) {
              console.warn('[useStory] Image edit failed, continuing without:', imgError)
            }
          } else {
            // voice トリガー: 改変テキストに合わせて画像を新規生成
            try {
              const imgController = new AbortController()
              const imgTimer = setTimeout(() => imgController.abort(), 60000)
              const imgResponse = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sceneDescription: result.modifiedText,
                  keyword: store.selectedKeyword?.keyword,
                }),
                signal: imgController.signal,
              })
              clearTimeout(imgTimer)
              if (imgResponse.ok) {
                const imgResult = await imgResponse.json()
                newIllustration = `data:${imgResult.mimeType};base64,${imgResult.imageBase64}`
              }
            } catch (imgError) {
              console.warn('[useStory] Image generation failed, continuing without:', imgError)
            }
          }

          // 改変完了
          store.completeModification(
            result.targetPageIndex,
            result.modifiedText,
            newIllustration,
            result.modification
          )
        } catch (error) {
          console.error('[useStory] Modification failed:', error)
          // エラー時は readingComplete に戻す
          store.setModificationPhase('idle')
          store.setPagePhase('readingComplete')
          // ユーザー向けエラー表示（コンソールのみ）
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
