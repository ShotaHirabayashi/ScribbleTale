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
    modification?: Modification
  ) => void
  startDrawing: () => void
  setDrawingImage: (base64: string | null) => void
  skipCommentTime: () => void
  goToNextPage: () => void
  goToPrevPage: () => void
  syncPageIndex: (index: number) => void
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

    // キーワードが抽出されていれば改変フェーズへ、なければ次ページへ
    if (keyword) {
      set({ pagePhase: 'modifying' })
    } else {
      set({ pagePhase: 'transitioning' })
    }
  },

  setCommentTimeRemaining: (ms) => {
    set({ commentTimeRemainingMs: ms })
  },

  setChildUtterance: (utterance) => {
    set({ childUtterance: utterance })
  },

  addPendingKeyword: (keyword) => {
    set((state) => ({
      pendingKeywords: [...state.pendingKeywords, keyword],
    }))
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

  completeModification: (targetPageIndex, newText, newIllustration, modification) => {
    set((state) => {
      const newPages = [...state.pages]
      if (targetPageIndex >= 0 && targetPageIndex < newPages.length) {
        const prevCount = newPages[targetPageIndex].modificationCount ?? 0
        newPages[targetPageIndex] = {
          ...newPages[targetPageIndex],
          currentText: newText,
          isModified: true,
          modificationCount: prevCount + 1,
          ...(newIllustration ? { illustration: newIllustration } : {}),
        }

        // 改変したページより後のページに needsContextRegeneration フラグをセット
        // ただし既にユーザーが改変済み(modificationCount > 0)のページはフラグを立てない
        for (let i = targetPageIndex + 1; i < newPages.length; i++) {
          if ((newPages[i].modificationCount ?? 0) === 0) {
            newPages[i] = {
              ...newPages[i],
              needsContextRegeneration: true,
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
          updateStoryPages(state.storySessionId!, newPages, newModifications).catch((err) => {
            console.warn('[story-store] Firestore auto-save failed:', err)
          })
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
    })
  },

  setDrawingImage: (base64) => {
    set({ drawingImageBase64: base64 })
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
    const { bookId, pages, modifications, shareToken: existingToken, isSharing } = get()
    if (isSharing) return existingToken
    if (existingToken) return existingToken

    if (!bookId || pages.length === 0) return null

    set({ isSharing: true })
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, pages, modifications }),
      })
      if (!res.ok) throw new Error('Share failed')
      const data = await res.json()
      set({
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
