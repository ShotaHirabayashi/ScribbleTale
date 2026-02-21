import { useCallback, useEffect, useRef } from 'react'
import { useStoryStore } from '@/stores/story-store'
import type { StoryPage } from '@/lib/types'

/** Zustand storeのヘルパーフック */
export function useStory(bookId?: string, initialPages?: StoryPage[]) {
  const store = useStoryStore()
  const modificationInProgressRef = useRef(false)
  const regenerationInProgressRef = useRef(false)

  // ストーリー初期化（Firestoreセッション復元）
  useEffect(() => {
    if (bookId && initialPages && store.bookId !== bookId) {
      import('@/lib/firebase/firestore').then(({ getOrCreateStorySession }) => {
        getOrCreateStorySession(bookId, initialPages).then((session) => {
          store.initializeStory(bookId, session.pages, session.storyId)
        }).catch(() => {
          // Firestore接続失敗時はローカルのみで初期化
          store.initializeStory(bookId, initialPages)
        })
      }).catch(() => {
        // dynamic import失敗時もローカルで初期化
        store.initializeStory(bookId, initialPages)
      })
    }
  }, [bookId, initialPages, store])

  /** テキスト文字送り完了時のハンドラ */
  const handleReadingComplete = useCallback(() => {
    if (store.pagePhase === 'reading') {
      const currentPage = store.pages[store.currentPageIndex]
      const alreadyRevealed = currentPage?.textRevealed
      store.markTextRevealed(store.currentPageIndex)
      const modCount = currentPage?.modificationCount ?? 0
      if (modCount >= 2 && !alreadyRevealed) {
        // 2回改変済み & 初回表示 → コメントタイムなしで自動ページ送り
        store.setPagePhase('transitioning')
      } else {
        // 既読ページに戻った場合は readingComplete で止める
        store.setPagePhase('readingComplete')
      }
    }
    if (store.pagePhase === 'modified') {
      // 改変テキスト文字送り完了 → 自動でページ遷移
      store.markTextRevealed(store.currentPageIndex)
      store.setPagePhase('transitioning')
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
            throw new Error(`Modify API failed: ${response.status}`)
          }

          store.setModificationPhase('generating_image')

          const result = await response.json()

          // drawing トリガーの場合は挿絵に描画を合成
          let newIllustration: string | undefined
          if (
            store.selectedKeyword?.trigger === 'drawing' &&
            store.drawingImageBase64
          ) {
            try {
              const targetPage = store.pages[result.targetPageIndex]
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
          // エラー時は readingComplete に戻す（transitioning にすると次ページに進んでしまう）
          store.setModificationPhase('idle')
          store.setPagePhase('readingComplete')
        } finally {
          modificationInProgressRef.current = false
        }
      }

      runModification()
    }
  }, [store.pagePhase, store.selectedKeyword, store])

  // 波及再生成: reading フェーズ + needsContextRegeneration → 自動再生成
  useEffect(() => {
    const currentPage = store.pages[store.currentPageIndex]
    if (
      store.pagePhase === 'reading' &&
      currentPage?.needsContextRegeneration &&
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

          // フラグをクリアしてから改変完了（波及再生成なので連鎖伝播しない）
          store.clearContextRegenerationFlag(store.currentPageIndex)
          store.completeModification(
            result.targetPageIndex,
            result.modifiedText,
            undefined,
            undefined,
            true // skipPropagation: 波及再生成の連鎖を防止
          )
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
  }, [store.pagePhase, store.currentPageIndex, store])

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
