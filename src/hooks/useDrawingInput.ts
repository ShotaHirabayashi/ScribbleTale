import { useCallback, useState } from 'react'
import { useStoryStore } from '@/stores/story-store'

interface UseDrawingInputParams {
  bookId: string
  currentPageIndex: number
}

export function useDrawingInput({ bookId, currentPageIndex }: UseDrawingInputParams) {
  const store = useStoryStore()
  const [isRecognizing, setIsRecognizing] = useState(false)

  const handleDrawingComplete = useCallback(
    async (imageBase64: string) => {
      setIsRecognizing(true)

      try {
        // 描画データを保存
        store.setDrawingImage(imageBase64)

        // recognize-drawing API でキーワード抽出（完了後に modifying へ遷移）
        const response = await fetch('/api/recognize-drawing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            mimeType: 'image/png',
          }),
        })

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          console.error('[useDrawingInput] API error:', errBody)
          throw new Error(`Drawing recognition failed: ${response.status}`)
        }

        const result = await response.json()
        const keyword = result.keyword || result.description || 'おえかき'

        // 認識結果を保存して確認画面へ遷移（まだ改変は開始しない）
        store.setRecognizedKeyword(keyword)
        store.setPagePhase('drawingConfirm')
      } catch (error) {
        console.error('[useDrawingInput] Recognition failed:', error)
        // 失敗時は readingComplete に戻す
        store.setDrawingImage(null)
        store.setPagePhase('readingComplete')
      } finally {
        setIsRecognizing(false)
      }
    },
    [store]
  )

  const handleDrawingCancel = useCallback(() => {
    store.setDrawingImage(null)
    store.setPagePhase('readingComplete')
  }, [store])

  return {
    handleDrawingComplete,
    handleDrawingCancel,
    isRecognizing,
  }
}
