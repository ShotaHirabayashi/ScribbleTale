import { useEffect, useRef, useCallback } from 'react'
import type { StoryPage, CharacterState } from '@/lib/types'
import type { PagePhase, ModificationPhase } from '@/lib/types'

interface PrefetchResult {
  modifiedText: string
  illustration?: string
  targetPageIndex: number
}

/**
 * 波及再生成の先読みフック
 *
 * 改変完了（modified フェーズ）時に、次ページの波及再生成をバックグラウンドで開始し、
 * キャッシュに保存する。ユーザーが次ページに進んだ際にキャッシュヒットすれば即座に表示。
 */
export function usePrefetchRegeneration(params: {
  pages: StoryPage[]
  currentPageIndex: number
  pagePhase: PagePhase
  modificationPhase: ModificationPhase
  bookId: string | null
  characterStates: CharacterState[]
}) {
  const { pages, currentPageIndex, pagePhase, modificationPhase, bookId, characterStates } = params

  // キャッシュ: pageIndex → PrefetchResult
  const cacheRef = useRef(new Map<number, PrefetchResult>())
  // 進行中のプリフェッチを追跡
  const abortRef = useRef<AbortController | null>(null)
  // 最後にプリフェッチを開始したページインデックス
  const lastPrefetchedRef = useRef<number | null>(null)

  // 改変完了時に次ページの先読みを開始
  useEffect(() => {
    // 条件: modified フェーズ + generating_image or complete
    if (
      pagePhase !== 'modified' ||
      (modificationPhase !== 'generating_image' && modificationPhase !== 'complete') ||
      !bookId
    ) {
      return
    }

    const nextPageIndex = currentPageIndex + 1
    if (nextPageIndex >= pages.length) return

    const nextPage = pages[nextPageIndex]
    if (!nextPage?.needsContextRegeneration) return

    // 既にキャッシュ済み or 同じページのプリフェッチが進行中ならスキップ
    if (cacheRef.current.has(nextPageIndex) || lastPrefetchedRef.current === nextPageIndex) return

    lastPrefetchedRef.current = nextPageIndex

    // 前のプリフェッチをキャンセル
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const prefetch = async () => {
      try {
        const bookTitle = bookId === 'momotaro' ? 'ももたろう' : 'あかずきん'
        const lightPages = pages.map(({ illustration, ...rest }) => rest)

        // テキスト再生成
        const response = await fetch('/api/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookTitle,
            currentPageIndex: nextPageIndex,
            pages: lightPages,
            characterStates,
          }),
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Regenerate failed: ${response.status}`)
        const result = await response.json()

        // 画像再生成
        let illustration: string | undefined
        try {
          const imgResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sceneDescription: result.modifiedText,
            }),
            signal: controller.signal,
          })
          if (imgResponse.ok) {
            const imgResult = await imgResponse.json()
            illustration = `data:${imgResult.mimeType};base64,${imgResult.imageBase64}`
          }
        } catch (imgError) {
          if ((imgError as Error).name !== 'AbortError') {
            console.warn('[usePrefetchRegeneration] Image prefetch failed:', imgError)
          }
        }

        // キャッシュに保存
        if (!controller.signal.aborted) {
          cacheRef.current.set(nextPageIndex, {
            modifiedText: result.modifiedText,
            illustration,
            targetPageIndex: nextPageIndex,
          })
          console.log('[usePrefetchRegeneration] Cached prefetch for page', nextPageIndex)
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('[usePrefetchRegeneration] Prefetch failed:', error)
        }
      }
    }

    prefetch()

    return () => {
      controller.abort()
    }
  }, [pagePhase, modificationPhase, currentPageIndex, pages, bookId, characterStates])

  // キャッシュからプリフェッチ結果を取得
  const consumeCache = useCallback((pageIndex: number): PrefetchResult | null => {
    const result = cacheRef.current.get(pageIndex)
    if (result) {
      cacheRef.current.delete(pageIndex)
      console.log('[usePrefetchRegeneration] Cache hit for page', pageIndex)
      return result
    }
    return null
  }, [])

  // セッションリセット時にキャッシュをクリア
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
    lastPrefetchedRef.current = null
    abortRef.current?.abort()
  }, [])

  return { consumeCache, clearCache }
}
