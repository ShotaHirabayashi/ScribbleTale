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
        store.setPagePhase('modifying')
        store.setModificationPhase('orchestrating')

        // recognize-drawing API でキーワード抽出
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

        // キーワードを追加して選択 → useStory の modifying useEffect が発火
        const extractionResult = {
          keyword,
          childUtterance: `おえかき: ${keyword}`,
          trigger: 'drawing' as const,
          timestamp: Date.now(),
        }

        store.addPendingKeyword(extractionResult)
        store.selectKeyword(extractionResult)
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
