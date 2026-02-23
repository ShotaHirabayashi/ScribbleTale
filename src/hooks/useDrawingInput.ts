import { useCallback } from 'react'
import { useStoryStore } from '@/stores/story-store'

interface UseDrawingInputParams {
  bookId: string
  currentPageIndex: number
}

export function useDrawingInput({ bookId, currentPageIndex }: UseDrawingInputParams) {
  const store = useStoryStore()

  const handleDrawingComplete = useCallback(
    async (imageBase64: string) => {
      store.setIsRecognizingDrawing(true)
      store.setDrawingError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        store.setDrawingImage(imageBase64)

        const response = await fetch('/api/recognize-drawing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            mimeType: 'image/jpeg',
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          console.error('[useDrawingInput] API error:', errBody)
          throw new Error(`Drawing recognition failed: ${response.status}`)
        }

        const result = await response.json()
        const keyword = result.keyword || result.description || 'おえかき'

        store.setRecognizedKeyword(keyword)
        store.setPagePhase('drawingConfirm')
      } catch (error) {
        console.error('[useDrawingInput] Recognition failed:', error)
        const message = error instanceof DOMException && error.name === 'AbortError'
          ? 'じかんが かかりすぎちゃったよ'
          : 'おえかきが うまく よめなかったよ'
        store.setDrawingError(message)
        store.setDrawingImage(null)
        store.setPagePhase('readingComplete')
      } finally {
        clearTimeout(timeoutId)
        store.setIsRecognizingDrawing(false)
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
  }
}
