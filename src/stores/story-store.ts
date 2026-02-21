import { create } from 'zustand'
import type {
  StoryPage,
  PagePhase,
  ModificationPhase,
  ExtractionResult,
  Modification,
  CommentTimeEndReason,
} from '@/lib/types'

interface StoryState {
  // ── ページ状態 ──
  currentPageIndex: number
  pagePhase: PagePhase
  pages: StoryPage[]
  bookId: string | null

  // ── コメントタイム ──
  isCommentTimeActive: boolean
  commentTimeRemainingMs: number
  commentTimeEndReason: CommentTimeEndReason | null
  childUtterance: string | null

  // ── キーワード ──
  pendingKeywords: ExtractionResult[]
  selectedKeyword: ExtractionResult | null

  // ── 改変 ──
  modificationPhase: ModificationPhase
  modifications: Modification[]

  // ── 描画 ──
  drawingImageBase64: string | null
  recognizedKeyword: string | null
  isRecognizingDrawing: boolean

  // ── 共有 ──
  shareToken: string | null
  isShared: boolean
  isSharing: boolean

  // ── Firestoreセッション ──
  storySessionId: string | null

  // ── アクション ──
  initializeStory: (bookId: string, pages: StoryPage[], storySessionId?: string) => void
  setPagePhase: (phase: PagePhase) => void
  startCommentTime: () => void
  endCommentTime: (reason: CommentTimeEndReason) => void
  setCommentTimeRemaining: (ms: number) => void
  setChildUtterance: (utterance: string | null) => void
  addPendingKeyword: (keyword: ExtractionResult) => void
  selectKeyword: (keyword: ExtractionResult | null) => void
  startModification: () => void
  setModificationPhase: (phase: ModificationPhase) => void
  completeModification: (
    targetPageIndex: number,
    newText: string,
    newIllustration?: string,
    modification?: Modification,
    skipPropagation?: boolean
  ) => void
  startDrawing: () => void
  setDrawingImage: (base64: string | null) => void
  setRecognizedKeyword: (keyword: string | null) => void
  setIsRecognizingDrawing: (flag: boolean) => void
  confirmDrawing: () => void
  rejectDrawing: () => void
  confirmModification: () => void
  cancelConfirmation: () => void
  skipCommentTime: () => void
  goToNextPage: () => void
  goToPrevPage: () => void
  syncPageIndex: (index: number) => void
  markTextRevealed: (pageIndex: number) => void
  clearContextRegenerationFlag: (pageIndex: number) => void
  resetSession: () => void
  shareStory: () => Promise<string | null>
}

const initialState = {
  currentPageIndex: 0,
  pagePhase: 'reading' as PagePhase,
  pages: [] as StoryPage[],
  bookId: null as string | null,
  isCommentTimeActive: false,
  commentTimeRemainingMs: 30000,
  commentTimeEndReason: null as CommentTimeEndReason | null,
  childUtterance: null as string | null,
  pendingKeywords: [] as ExtractionResult[],
  selectedKeyword: null as ExtractionResult | null,
  modificationPhase: 'idle' as ModificationPhase,
  modifications: [] as Modification[],
  drawingImageBase64: null as string | null,
  recognizedKeyword: null as string | null,
  isRecognizingDrawing: false,
  shareToken: null as string | null,
  isShared: false,
  isSharing: false,
  storySessionId: null as string | null,
}

export const useStoryStore = create<StoryState>((set, get) => ({
  ...initialState,

  initializeStory: (bookId, pages, storySessionId) => {
    set({
      ...initialState,
      bookId,
      pages,
      storySessionId: storySessionId || null,
    })
  },

  setPagePhase: (phase) => {
    set({ pagePhase: phase })
  },

  startCommentTime: () => {
    set({
      isCommentTimeActive: true,
      pagePhase: 'commentTime',
      commentTimeRemainingMs: 30000,
      commentTimeEndReason: null,
      pendingKeywords: [],
      selectedKeyword: null,
      childUtterance: null,
    })
  },

  endCommentTime: (reason) => {
    const { pendingKeywords } = get()
    const keyword = pendingKeywords.length > 0 ? pendingKeywords[pendingKeywords.length - 1] : null

    set({
      isCommentTimeActive: false,
      commentTimeEndReason: reason,
      selectedKeyword: keyword,
    })

    if (keyword) {
      // キーワードが抽出されていれば確認フェーズへ
      set({ pagePhase: 'confirming' })
    } else if (reason === 'manual_skip') {
      // 明示的スキップ → 次ページへ
      set({ pagePhase: 'transitioning' })
    } else {
      // end_keyword / タイムアウト等 → ボタンに戻す（再挑戦可能）
      // ※ end_keywordでキーワードがない場合は非同期抽出待ちの可能性がある
      //   addPendingKeyword で後から confirming に遷移する
      set({ pagePhase: 'readingComplete' })
    }
  },

  setCommentTimeRemaining: (ms) => {
    set({ commentTimeRemainingMs: ms })
  },

  setChildUtterance: (utterance) => {
    set({ childUtterance: utterance })
  },

  addPendingKeyword: (keyword) => {
    const { pagePhase } = get()
    set((state) => ({
      pendingKeywords: [...state.pendingKeywords, keyword],
    }))

    // コメントタイム終了後に非同期でキーワードが到着した場合 → 自動で確認フェーズへ
    if (pagePhase === 'readingComplete') {
      set({ selectedKeyword: keyword, pagePhase: 'confirming' })
    }
  },

  selectKeyword: (keyword) => {
    set({ selectedKeyword: keyword })
  },

  startModification: () => {
    set({
      modificationPhase: 'orchestrating',
      pagePhase: 'modifying',
    })
  },

  setModificationPhase: (phase) => {
    set({ modificationPhase: phase })
  },

  completeModification: (targetPageIndex, newText, newIllustration, modification, skipPropagation) => {
    set((state) => {
      const newPages = [...state.pages]
      if (targetPageIndex >= 0 && targetPageIndex < newPages.length) {
        const prevCount = newPages[targetPageIndex].modificationCount ?? 0
        newPages[targetPageIndex] = {
          ...newPages[targetPageIndex],
          currentText: newText,
          isModified: true,
          modificationCount: prevCount + 1,
          textRevealed: false,
          ...(newIllustration ? { illustration: newIllustration } : {}),
        }

        // ユーザー起因の改変のみ後続ページに needsContextRegeneration をセット
        // 波及再生成(skipPropagation=true)では連鎖を防ぐためフラグを立てない
        if (!skipPropagation) {
          for (let i = targetPageIndex + 1; i < newPages.length; i++) {
            if ((newPages[i].modificationCount ?? 0) === 0) {
              newPages[i] = {
                ...newPages[i],
                needsContextRegeneration: true,
              }
            }
          }
        }
      }

      const newModifications = modification
        ? [...state.modifications, modification]
        : state.modifications

      // Firestore自動保存（バックグラウンド、失敗してもUXに影響しない）
      if (state.storySessionId) {
        import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
          updateStoryPages(state.storySessionId!, newPages, newModifications).catch(() => {
            // AbortError等を含む全エラーを静かに無視（UXに影響しない）
          })
        }).catch(() => {
          // dynamic import失敗も無視
        })
      }

      return {
        pages: newPages,
        modificationPhase: 'complete',
        pagePhase: 'modified',
        modifications: newModifications,
      }
    })
  },

  startDrawing: () => {
    set({
      pagePhase: 'drawing',
      pendingKeywords: [],
      selectedKeyword: null,
      childUtterance: null,
      drawingImageBase64: null,
      recognizedKeyword: null,
    })
  },

  setDrawingImage: (base64) => {
    set({ drawingImageBase64: base64 })
  },

  setRecognizedKeyword: (keyword) => {
    set({ recognizedKeyword: keyword })
  },

  setIsRecognizingDrawing: (flag) => {
    set({ isRecognizingDrawing: flag })
  },

  confirmDrawing: () => {
    const { recognizedKeyword } = get()
    if (!recognizedKeyword) return

    const extractionResult = {
      keyword: recognizedKeyword,
      childUtterance: `おえかき: ${recognizedKeyword}`,
      trigger: 'drawing' as const,
      timestamp: Date.now(),
    }

    set((state) => ({
      pendingKeywords: [...state.pendingKeywords, extractionResult],
      selectedKeyword: extractionResult,
      pagePhase: 'modifying',
    }))
  },

  rejectDrawing: () => {
    set({
      pagePhase: 'drawing',
      pendingKeywords: [],
      selectedKeyword: null,
      childUtterance: null,
      drawingImageBase64: null,
      recognizedKeyword: null,
    })
  },

  confirmModification: () => {
    set({ pagePhase: 'modifying' })
  },

  cancelConfirmation: () => {
    set({
      selectedKeyword: null,
      pagePhase: 'readingComplete',
    })
  },

  skipCommentTime: () => {
    set({
      isCommentTimeActive: false,
      commentTimeEndReason: 'manual_skip',
      pagePhase: 'transitioning',
    })
  },

  goToNextPage: () => {
    const { currentPageIndex, pages } = get()
    if (currentPageIndex >= pages.length - 1) return

    set({
      currentPageIndex: currentPageIndex + 1,
      pagePhase: 'reading',
      modificationPhase: 'idle',
      pendingKeywords: [],
      selectedKeyword: null,
      childUtterance: null,
    })
  },

  goToPrevPage: () => {
    const { currentPageIndex } = get()
    if (currentPageIndex <= 0) return

    set({
      currentPageIndex: currentPageIndex - 1,
      pagePhase: 'reading',
    })
  },

  syncPageIndex: (index) => {
    set({
      currentPageIndex: index,
      pagePhase: 'reading',
      modificationPhase: 'idle',
      pendingKeywords: [],
      selectedKeyword: null,
      childUtterance: null,
      drawingImageBase64: null,
    })
  },

  markTextRevealed: (pageIndex) => {
    set((state) => {
      const newPages = [...state.pages]
      if (pageIndex >= 0 && pageIndex < newPages.length) {
        newPages[pageIndex] = {
          ...newPages[pageIndex],
          textRevealed: true,
        }
      }
      return { pages: newPages }
    })
  },

  clearContextRegenerationFlag: (pageIndex) => {
    set((state) => {
      const newPages = [...state.pages]
      if (pageIndex >= 0 && pageIndex < newPages.length) {
        newPages[pageIndex] = {
          ...newPages[pageIndex],
          needsContextRegeneration: false,
        }
      }
      return { pages: newPages }
    })
  },

  resetSession: () => {
    set(initialState)
  },

  shareStory: async () => {
    const { bookId, pages, modifications, shareToken: existingToken, isSharing, storySessionId } = get()
    if (isSharing) return existingToken
    if (existingToken) return existingToken

    if (!bookId || pages.length === 0) return null

    set({ isSharing: true })
    try {
      const storyId = storySessionId || `story-${bookId}-${Date.now()}`

      // data: URI の改変画像を Firebase Storage にアップロードし URL に差し替え
      const { uploadImage, getStoryImagePath } = await import('@/lib/firebase/storage')
      const uploadedPages = await Promise.all(
        pages.map(async (page, index) => {
          if (page.illustration && page.illustration.startsWith('data:')) {
            try {
              // data:image/png;base64,XXXX → base64 部分を抽出
              const base64Data = page.illustration.split(',')[1]
              if (!base64Data) return page

              const mimeMatch = page.illustration.match(/^data:(image\/\w+);/)
              const mimeType = mimeMatch?.[1] || 'image/png'

              const path = getStoryImagePath(storyId, index)
              const downloadUrl = await uploadImage(path, base64Data, mimeType)
              return { ...page, illustration: downloadUrl }
            } catch (err) {
              console.warn(`[story-store] Image upload failed for page ${index}:`, err)
              return page
            }
          }
          return page
        })
      )

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          bookId,
          pages: uploadedPages,
          modifications,
        }),
      })
      if (!res.ok) throw new Error('Share failed')
      const data = await res.json()

      // アップロード済み URL をローカル pages にも反映
      set({
        pages: uploadedPages,
        shareToken: data.shareToken,
        isShared: true,
        isSharing: false,
      })
      return data.shareUrl as string
    } catch (error) {
      console.error('[story-store] shareStory failed:', error)
      set({ isSharing: false })
      return null
    }
  },
}))
