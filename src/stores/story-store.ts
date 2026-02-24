import { create } from 'zustand'
import type {
  StoryPage,
  PagePhase,
  ModificationPhase,
  ExtractionResult,
  Modification,
  CommentTimeEndReason,
  CharacterState,
} from '@/lib/types'
import { buildDynamicBgmPrompt, getBgmPrompts, type MusicPromptConfig } from '@/lib/audio/music-prompts'

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

  // ── エラー ──
  drawingError: string | null
  voiceError: string | null

  // ── 共有 ──
  shareToken: string | null
  isShared: boolean
  isSharing: boolean

  // ── BGMオーバーライド ──
  bgmOverride: MusicPromptConfig | null

  // ── キャラクター状態メモリ ──
  characterStates: CharacterState[]

  // ── Firestoreセッション ──
  storySessionId: string | null

  // ── アクション ──
  initializeStory: (bookId: string, pages: StoryPage[], storySessionId?: string, characterStates?: CharacterState[]) => void
  updateCharacterStates: (updates: CharacterState[]) => void
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
  applyTextFirst: (
    targetPageIndex: number,
    newText: string,
    modification?: Modification,
  ) => void
  applyImageUpdate: (targetPageIndex: number, newIllustration: string) => void
  handleImageFailure: (targetPageIndex: number) => void
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
  completeRegeneration: (targetPageIndex: number, newText: string, newIllustration?: string) => void
  clearContextRegenerationFlag: (pageIndex: number) => void
  resetSession: () => void
  setBgmOverride: (override: MusicPromptConfig | null) => void
  setDrawingError: (error: string | null) => void
  setVoiceError: (error: string | null) => void
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
  drawingError: null as string | null,
  voiceError: null as string | null,
  bgmOverride: null as MusicPromptConfig | null,
  characterStates: [] as CharacterState[],
  shareToken: null as string | null,
  isShared: false,
  isSharing: false,
  storySessionId: null as string | null,
}

export const useStoryStore = create<StoryState>((set, get) => ({
  ...initialState,

  initializeStory: (bookId, pages, storySessionId, characterStates) => {
    console.log('[story-store] initializeStory called, bookId:', bookId, 'pages:', pages.length, 'sessionId:', storySessionId, 'characterStates:', characterStates?.length || 0)
    set({
      ...initialState,
      bookId,
      pages,
      storySessionId: storySessionId || null,
      characterStates: characterStates || [],
    })
  },

  updateCharacterStates: (updates) => {
    set((state) => {
      const merged = [...state.characterStates]
      for (const update of updates) {
        const idx = merged.findIndex((cs) => cs.characterId === update.characterId)
        if (idx >= 0) {
          // 既存キャラはマージ
          merged[idx] = {
            ...merged[idx],
            currentAppearance: update.currentAppearance,
            currentPersonality: update.currentPersonality,
            relationshipChanges: [
              ...merged[idx].relationshipChanges,
              ...update.relationshipChanges.filter(
                (r) => !merged[idx].relationshipChanges.includes(r)
              ),
            ],
            changes: update.changes,
          }
        } else {
          // 新規キャラは追加
          merged.push(update)
        }
      }
      return { characterStates: merged }
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
    const { pendingKeywords, currentPageIndex, pages } = get()
    const keyword = pendingKeywords.length > 0 ? pendingKeywords[pendingKeywords.length - 1] : null
    const currentPage = pages[currentPageIndex]
    const modCount = currentPage?.modificationCount ?? 0

    set({
      isCommentTimeActive: false,
      commentTimeEndReason: reason,
      selectedKeyword: keyword,
    })

    if (keyword && modCount < 2) {
      // キーワード（発話テキスト）があり、改変回数制限内なら改変開始
      set({ pagePhase: 'modifying' })
    } else if (reason === 'manual_skip') {
      // 明示的スキップ → 次ページへ
      set({ pagePhase: 'transitioning' })
    } else {
      // キーワードなし or 改変回数制限超過 → ボタンに戻す（再挑戦可能）
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

    // コメントタイム中 or 終了後にキーワードが到着 → 即座に改変開始
    if (pagePhase === 'readingComplete' || pagePhase === 'commentTime') {
      set({ selectedKeyword: keyword, pagePhase: 'modifying' })
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

      return {
        pages: newPages,
        modificationPhase: 'complete',
        pagePhase: 'modified',
        modifications: newModifications,
      }
    })

    // Firestore自動保存 + data: URI画像のStorageアップロード（バックグラウンド）
    const { storySessionId } = get()
    if (storySessionId) {
      if (newIllustration && newIllustration.startsWith('data:')) {
        // data: URI画像をFirebase Storageにアップロードし、URLに差し替えてからFirestore保存
        import('@/lib/firebase/storage').then(({ uploadImage, getStoryImagePath }) => {
          const base64Data = newIllustration.split(',')[1]
          if (!base64Data) return
          const mimeMatch = newIllustration.match(/^data:(image\/\w+);/)
          const mimeType = mimeMatch?.[1] || 'image/png'
          const path = getStoryImagePath(storySessionId, targetPageIndex)
          uploadImage(path, base64Data, mimeType).then((downloadUrl) => {
            // Zustand内の画像をStorage URLに差し替え
            set((state) => {
              const updatedPages = [...state.pages]
              if (targetPageIndex >= 0 && targetPageIndex < updatedPages.length &&
                  updatedPages[targetPageIndex].illustration === newIllustration) {
                updatedPages[targetPageIndex] = {
                  ...updatedPages[targetPageIndex],
                  illustration: downloadUrl,
                }
              }
              return { pages: updatedPages }
            })
            // Firestore保存（Storage URL反映済み）
            const current = get()
            import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
              updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
            }).catch(() => {})
          }).catch(() => {
            // アップロード失敗時もFirestore保存は試みる（data: URIはサニタイズされる）
            const current = get()
            import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
              updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
            }).catch(() => {})
          })
        }).catch(() => {})
      } else {
        // 画像なし or 既にURL → そのままFirestore保存
        const current = get()
        import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
          updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
        }).catch(() => {})
      }
    }
  },

  applyTextFirst: (targetPageIndex, newText, modification) => {
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
          illustrationLoading: true,
          previousIllustration: newPages[targetPageIndex].illustration,
        }

        // 後続ページに needsContextRegeneration をセット
        for (let i = targetPageIndex + 1; i < newPages.length; i++) {
          newPages[i] = {
            ...newPages[i],
            needsContextRegeneration: true,
          }
        }
      }

      const newModifications = modification
        ? [...state.modifications, modification]
        : state.modifications

      // BGMプロンプトを動的差し替え
      let bgmOverride: MusicPromptConfig | null = null
      if (state.bookId && state.selectedKeyword) {
        const pageNumber = targetPageIndex + 1
        const prompts = getBgmPrompts(state.bookId)
        const baseConfig = prompts[pageNumber]
        if (baseConfig) {
          bgmOverride = buildDynamicBgmPrompt({
            keyword: state.selectedKeyword.keyword,
            modifiedText: newText,
            baseConfig,
          })
        }
      }

      return {
        pages: newPages,
        modificationPhase: 'generating_image',
        pagePhase: 'modified',
        modifications: newModifications,
        bgmOverride,
      }
    })
  },

  applyImageUpdate: (targetPageIndex, newIllustration) => {
    // まずZustandを即座に更新してUI反映
    set((state) => {
      const newPages = [...state.pages]
      if (targetPageIndex >= 0 && targetPageIndex < newPages.length) {
        newPages[targetPageIndex] = {
          ...newPages[targetPageIndex],
          illustration: newIllustration,
          illustrationLoading: false,
          previousIllustration: undefined,
        }
      }
      return {
        pages: newPages,
        modificationPhase: 'complete',
      }
    })

    // data: URI の場合、バックグラウンドでFirebase Storageにアップロードし URL に差し替え
    const { storySessionId } = get()
    if (storySessionId && newIllustration && newIllustration.startsWith('data:')) {
      import('@/lib/firebase/storage').then(({ uploadImage, getStoryImagePath }) => {
        const base64Data = newIllustration.split(',')[1]
        if (!base64Data) return
        const mimeMatch = newIllustration.match(/^data:(image\/\w+);/)
        const mimeType = mimeMatch?.[1] || 'image/png'
        const path = getStoryImagePath(storySessionId, targetPageIndex)
        uploadImage(path, base64Data, mimeType).then((downloadUrl) => {
          // Zustand内の画像をStorage URLに差し替え
          set((state) => {
            const updatedPages = [...state.pages]
            if (targetPageIndex >= 0 && targetPageIndex < updatedPages.length &&
                updatedPages[targetPageIndex].illustration === newIllustration) {
              updatedPages[targetPageIndex] = {
                ...updatedPages[targetPageIndex],
                illustration: downloadUrl,
              }
            }
            return { pages: updatedPages }
          })
          // Firestore自動保存（Storage URL反映済み）
          const current = get()
          import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
            updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
          }).catch(() => {})
        }).catch((err) => {
          console.warn('[story-store] Image upload failed, falling back to Firestore save:', err)
          // アップロード失敗してもFirestore保存は試みる（data: URIはサニタイズされる）
          const current = get()
          import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
            updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
          }).catch(() => {})
        })
      }).catch(() => {})
    } else if (storySessionId) {
      // data: URI以外（既にStorage URL等）の場合はそのままFirestore保存
      const current = get()
      import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
        updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
      }).catch(() => {})
    }
  },

  handleImageFailure: (targetPageIndex) => {
    set((state) => {
      const newPages = [...state.pages]
      if (targetPageIndex >= 0 && targetPageIndex < newPages.length) {
        newPages[targetPageIndex] = {
          ...newPages[targetPageIndex],
          illustrationLoading: false,
          previousIllustration: undefined,
        }
      }

      // テキストは変更済みなのでFirestore保存
      if (state.storySessionId) {
        import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
          updateStoryPages(state.storySessionId!, newPages, state.modifications, state.characterStates).catch(() => {})
        }).catch(() => {})
      }

      return {
        pages: newPages,
        modificationPhase: 'complete',
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

  setDrawingError: (error) => {
    set({ drawingError: error })
  },

  setVoiceError: (error) => {
    set({ voiceError: error })
  },

  confirmDrawing: () => {
    const { recognizedKeyword, currentPageIndex, pages } = get()
    if (!recognizedKeyword) return

    // 改変回数制限チェック
    const currentPage = pages[currentPageIndex]
    if ((currentPage?.modificationCount ?? 0) >= 2) {
      set({ pagePhase: 'readingComplete' })
      return
    }

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
      bgmOverride: null,
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

  completeRegeneration: (targetPageIndex, newText, newIllustration) => {
    set((state) => {
      const newPages = [...state.pages]
      if (targetPageIndex >= 0 && targetPageIndex < newPages.length) {
        newPages[targetPageIndex] = {
          ...newPages[targetPageIndex],
          currentText: newText,
          isModified: true,
          needsContextRegeneration: false,
          textRevealed: false,
          ...(newIllustration ? { illustration: newIllustration } : {}),
        }
      }

      return {
        pages: newPages,
        modificationPhase: 'idle',
        pagePhase: 'reading',
      }
    })

    // Firestore自動保存 + data: URI画像のStorageアップロード（バックグラウンド）
    const { storySessionId } = get()
    if (storySessionId) {
      if (newIllustration && newIllustration.startsWith('data:')) {
        import('@/lib/firebase/storage').then(({ uploadImage, getStoryImagePath }) => {
          const base64Data = newIllustration.split(',')[1]
          if (!base64Data) return
          const mimeMatch = newIllustration.match(/^data:(image\/\w+);/)
          const mimeType = mimeMatch?.[1] || 'image/png'
          const path = getStoryImagePath(storySessionId, targetPageIndex)
          uploadImage(path, base64Data, mimeType).then((downloadUrl) => {
            set((state) => {
              const updatedPages = [...state.pages]
              if (targetPageIndex >= 0 && targetPageIndex < updatedPages.length &&
                  updatedPages[targetPageIndex].illustration === newIllustration) {
                updatedPages[targetPageIndex] = {
                  ...updatedPages[targetPageIndex],
                  illustration: downloadUrl,
                }
              }
              return { pages: updatedPages }
            })
            const current = get()
            import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
              updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
            }).catch(() => {})
          }).catch(() => {
            const current = get()
            import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
              updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
            }).catch(() => {})
          })
        }).catch(() => {})
      } else {
        const current = get()
        import('@/lib/firebase/firestore').then(({ updateStoryPages }) => {
          updateStoryPages(storySessionId, current.pages, current.modifications, current.characterStates).catch(() => {})
        }).catch(() => {})
      }
    }
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

  setBgmOverride: (override) => {
    set({ bgmOverride: override })
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
