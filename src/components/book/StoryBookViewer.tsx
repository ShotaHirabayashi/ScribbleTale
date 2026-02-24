'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookPage } from './BookPage'
import { DrawingOverlay } from './DrawingOverlay'
import { StoryRemixOverlay } from '@/components/story/StoryRemixOverlay'
import { ChevronLeft, ChevronRight, Home, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useStory } from '@/hooks/useStory'
import { usePagePreloader } from '@/hooks/usePagePreloader'
import { useStoryStore } from '@/stores/story-store'
import { useMusicSession } from '@/hooks/useMusicSession'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useDrawingInput } from '@/hooks/useDrawingInput'
import { useSounds } from '@/components/audio/SoundProvider'
import { getBoldnessConfig } from '@/lib/story/boldness'
import type { Story, StoryPage, ModificationBoldness } from '@/lib/types'

interface StoryBookViewerProps {
  story: Story
  bookId?: string
  sessionId?: string
  readOnly?: boolean
  authorName?: string
}

export function StoryBookViewer({ story, bookId, sessionId, readOnly = false, authorName }: StoryBookViewerProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward' | null>(null)
  const [flippedPages, setFlippedPages] = useState<Set<number>>(new Set())
  const [showRemixOverlay, setShowRemixOverlay] = useState(!readOnly)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const bookRef = useRef<HTMLDivElement>(null)

  // Zustand storeとの接続
  const {
    pagePhase,
    modificationPhase,
    commentTimeRemainingMs,
    childUtterance,
    pages: storePages,
    selectedKeyword,
    handleReadingComplete,
    handleStartCommentTime,
    handleEndCommentTime,
    handleSkipCommentTime,
    handleConfirmModification,
    handleCancelConfirmation,
  } = useStory(bookId || story.id, story.pages, sessionId)

  const syncPageIndex = useStoryStore((s) => s.syncPageIndex)
  const storySessionId = useStoryStore((s) => s.storySessionId)
  const applyRemix = useStoryStore((s) => s.applyRemix)
  const setBoldness = useStoryStore((s) => s.setBoldness)
  const setRemixPrompt = useStoryStore((s) => s.setRemixPrompt)
  const storeBoldness = useStoryStore((s) => s.boldness)
  const maxModifications = getBoldnessConfig(storeBoldness).maxModifications

  // storeのページデータがあればそちらを使用（改変反映）
  const displayPages = readOnly ? story.pages : (storePages.length > 0 ? storePages : story.pages)
  const totalPages = displayPages.length

  // 前後2ページの画像をプリロード
  usePagePreloader(displayPages, currentPage)

  // BGM（readOnlyモードでは無効）
  const { isMuted: isSoundMuted, isInitialized: isSoundInitialized } = useSounds()
  const bgmOverride = useStoryStore((s) => s.bgmOverride)
  useMusicSession({
    bookId: bookId || story.id,
    currentPage,
    isCommentTime: pagePhase === 'commentTime',
    isMuted: readOnly || isSoundMuted,
    isInitialized: !readOnly && isSoundInitialized,
    bgmOverride: readOnly ? null : bgmOverride,
  })

  // 描画入力（readOnlyモードでは無効）
  const { handleDrawingComplete, handleDrawingCancel } = useDrawingInput({
    bookId: bookId || story.id,
    currentPageIndex: currentPage,
  })

  const startDrawing = useStoryStore((s) => s.startDrawing)
  const confirmDrawing = useStoryStore((s) => s.confirmDrawing)
  const rejectDrawing = useStoryStore((s) => s.rejectDrawing)
  const recognizedKeyword = useStoryStore((s) => s.recognizedKeyword)
  const drawingImageBase64 = useStoryStore((s) => s.drawingImageBase64)
  const isRecognizingDrawing = useStoryStore((s) => s.isRecognizingDrawing)
  const drawingError = useStoryStore((s) => s.drawingError)
  const voiceError = useStoryStore((s) => s.voiceError)
  const setDrawingError = useStoryStore((s) => s.setDrawingError)
  const submitTextKeyword = useStoryStore((s) => s.submitTextKeyword)
  const handleStartDrawing = useCallback(() => {
    startDrawing()
  }, [startDrawing])
  const handleDrawingConfirm = useCallback(() => {
    confirmDrawing()
  }, [confirmDrawing])
  const handleDrawingReject = useCallback(() => {
    rejectDrawing()
  }, [rejectDrawing])
  const handleDrawingRetry = useCallback(() => {
    setDrawingError(null)
    startDrawing()
  }, [setDrawingError, startDrawing])
  const handleDrawingErrorClose = useCallback(() => {
    setDrawingError(null)
  }, [setDrawingError])
  const handleTextSubmit = useCallback((keyword: string) => {
    submitTextKeyword(keyword)
  }, [submitTextKeyword])

  // リミックス後の画像バックグラウンド再生成
  const applyImageUpdate = useStoryStore((s) => s.applyImageUpdate)
  const handleImageFailure = useStoryStore((s) => s.handleImageFailure)

  const regenerateRemixImages = useCallback(async (remixedPages: StoryPage[], storyId: string) => {
    // 全ページ（カバー含む）の画像をバックグラウンドで再生成
    const generateForPage = async (i: number) => {
      const page = remixedPages[i]
      const sceneDescription = page.currentText || page.text
      // カバー(index 0)は表紙用プロンプトで生成
      const isCoverPage = i === 0
      const body = isCoverPage
        ? {
            sceneDescription,
            isCover: true,
            title: sceneDescription.split('\n')[0] || story.title,
            storyId,
            storySummary: remixedPages.slice(1, 4).map((p) => p.currentText || p.text).join(' '),
          }
        : { sceneDescription }
      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (response.ok) {
          const result = await response.json()
          applyImageUpdate(i, `data:${result.mimeType};base64,${result.imageBase64}`)
        } else {
          handleImageFailure(i)
        }
      } catch {
        handleImageFailure(i)
      }
    }

    // 最初の2ページ（カバー + 1ページ目）を並列で先に生成
    const firstBatch = remixedPages.slice(0, 2).map((_, i) => generateForPage(i))
    await Promise.allSettled(firstBatch)

    // 残りのページを順次生成
    for (let i = 2; i < remixedPages.length; i++) {
      await generateForPage(i)
    }
  }, [applyImageUpdate, handleImageFailure, story.title])

  // Story Remix 完了ハンドラ
  const handleRemixComplete = useCallback((remixedPages: StoryPage[] | null, boldness: ModificationBoldness, remixPromptText: string | null) => {
    setBoldness(boldness)
    if (remixedPages && remixPromptText) {
      setRemixPrompt(remixPromptText)
      applyRemix(remixedPages)
      // バックグラウンドで全ページの画像を再生成
      regenerateRemixImages(remixedPages, bookId || story.id)
    }
    setShowRemixOverlay(false)
  }, [setBoldness, setRemixPrompt, applyRemix, regenerateRemixImages, bookId, story.id])

  // 音声入力（readOnlyモードでは無効）
  useVoiceInput({
    currentPageIndex: currentPage,
    pages: displayPages,
    isCommentTimePhase: !readOnly && pagePhase === 'commentTime',
    bookTitle: story.title,
  })

  const goToNextPage = useCallback(() => {
    if (currentPage >= totalPages - 1 || isFlipping) return

    setIsFlipping(true)
    setFlipDirection('forward')

    setTimeout(() => {
      setFlippedPages((prev) => {
        const next = new Set(prev)
        next.add(currentPage)
        return next
      })
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      setIsFlipping(false)
      setFlipDirection(null)
      syncPageIndex(nextPage)
    }, 700)
  }, [currentPage, totalPages, isFlipping, syncPageIndex])

  const goToPrevPage = useCallback(() => {
    if (currentPage <= 0 || isFlipping) return

    setIsFlipping(true)
    setFlipDirection('backward')

    const prevPage = currentPage - 1
    setFlippedPages((prev) => {
      const next = new Set(prev)
      next.delete(prevPage)
      return next
    })
    setCurrentPage(prevPage)

    setTimeout(() => {
      setIsFlipping(false)
      setFlipDirection(null)
      syncPageIndex(prevPage)
    }, 700)
  }, [currentPage, isFlipping, syncPageIndex])

  // Touch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // RemixOverlay / drawing / drawingConfirm / confirming フェーズ中はスワイプ無効
      if (showRemixOverlay) return
      if (pagePhase === 'drawing' || pagePhase === 'drawingConfirm' || pagePhase === 'confirming') return
      const deltaX = e.changedTouches[0].clientX - touchStartX.current
      const deltaY = e.changedTouches[0].clientY - touchStartY.current
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) goToNextPage()
        else goToPrevPage()
      }
    },
    [goToNextPage, goToPrevPage, pagePhase, showRemixOverlay]
  )

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // RemixOverlay表示中はキーボードナビ無効
      if (showRemixOverlay) return
      // テキスト入力中・描画確認中はキーボードナビ無効
      if (pagePhase === 'drawingConfirm' || pagePhase === 'commentTime' || pagePhase === 'drawing' || pagePhase === 'confirming') return
      // input/textarea にフォーカス中はナビ無効（テキスト入力を妨げない）
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goToNextPage()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevPage()
      } else if (e.key === 'Escape') {
        router.push('/')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextPage, goToPrevPage, router, pagePhase, showRemixOverlay])

  // transitioning フェーズ検知 → CSS flip アニメーション連動
  useEffect(() => {
    if (pagePhase === 'transitioning' && !isFlipping) {
      goToNextPage()
    }
  }, [pagePhase]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLastPage = currentPage === totalPages - 1

  return (
    <div className="flex h-dvh flex-col bg-[var(--storybook-brown)]">
      {/* Header nav - compact */}
      <div className="flex shrink-0 items-center justify-between px-3 pb-1 pt-2 sm:px-4 sm:pt-3 md:px-8 md:pt-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 font-serif text-xs text-foreground backdrop-blur-sm transition-colors hover:bg-background sm:px-3 sm:py-1.5 sm:text-sm"
          aria-label="トップページへもどる"
        >
          <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">もどる</span>
        </button>
        <div className="rounded-full bg-background/80 px-2.5 py-1 font-serif text-xs text-muted-foreground backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-sm">
          {currentPage + 1} / {totalPages}
        </div>
      </div>

      {/* Book container - fills remaining space */}
      <div
        ref={bookRef}
        className="flex min-h-0 flex-1 items-center justify-center px-3 py-1 sm:px-6 sm:py-2 md:px-12 md:py-4"
        style={{ perspective: '1800px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Book body - constrained to available space */}
        <div className="relative h-full w-full overflow-hidden rounded-lg shadow-2xl sm:rounded-xl"
          style={{ maxWidth: 'min(100%, 40rem)', maxHeight: '100%' }}
        >
          {/* Page stack */}
          {displayPages.map((page, index) => {
            const isFlipped = flippedPages.has(index)
            const isCurrentlyFlipping =
              isFlipping &&
              ((flipDirection === 'forward' && index === currentPage) ||
                (flipDirection === 'backward' && index === currentPage))

            const zIndex = isFlipped ? index : totalPages - index

            let rotateY = '0deg'
            if (isFlipped && !(isCurrentlyFlipping && flipDirection === 'backward')) {
              rotateY = '-180deg'
            }
            if (isCurrentlyFlipping && flipDirection === 'forward') {
              rotateY = '-180deg'
            }
            if (isCurrentlyFlipping && flipDirection === 'backward') {
              rotateY = '0deg'
            }

            const isPageActive = currentPage === index && !isFlipping
            const isCover = index === 0
            const isPageLastPage = index === totalPages - 1

            return (
              <div
                key={index}
                className="absolute inset-0"
                style={{
                  zIndex,
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'left center',
                  transform: `rotateY(${rotateY})`,
                  transition: isCurrentlyFlipping
                    ? 'transform 700ms cubic-bezier(0.645, 0.045, 0.355, 1)'
                    : 'none',
                }}
              >
                {/* Front of page */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <BookPage
                    page={page}
                    isActive={isPageActive}
                    isCover={isCover}
                    isLastPage={isPageLastPage}
                    readOnly={readOnly}
                    maxModifications={maxModifications}
                    pagePhase={isPageActive && !readOnly ? pagePhase : undefined}
                    modificationPhase={isPageActive && !readOnly ? modificationPhase : undefined}
                    commentTimeRemainingMs={commentTimeRemainingMs}
                    childUtterance={childUtterance}
                    onReadingComplete={isPageActive && !isCover && !readOnly ? handleReadingComplete : undefined}
                    onStartCommentTime={isPageActive && !readOnly ? handleStartCommentTime : undefined}
                    onEndCommentTime={isPageActive && !readOnly ? handleEndCommentTime : undefined}
                    onSkipCommentTime={isPageActive && !readOnly ? handleSkipCommentTime : undefined}
                    onStartDrawing={isPageActive && !readOnly ? handleStartDrawing : undefined}
                    onDrawingComplete={isPageActive && !readOnly ? handleDrawingComplete : undefined}
                    onDrawingCancel={isPageActive && !readOnly ? handleDrawingCancel : undefined}
                    onDrawingConfirm={isPageActive && !readOnly ? handleDrawingConfirm : undefined}
                    onDrawingReject={isPageActive && !readOnly ? handleDrawingReject : undefined}
                    onConfirmModification={isPageActive && !readOnly ? handleConfirmModification : undefined}
                    onCancelConfirmation={isPageActive && !readOnly ? handleCancelConfirmation : undefined}
                    selectedKeyword={isPageActive && !readOnly ? selectedKeyword?.keyword ?? null : undefined}
                    selectedUtterance={isPageActive && !readOnly ? childUtterance : undefined}
                    recognizedKeyword={isPageActive && !readOnly ? recognizedKeyword : undefined}
                    drawingImageBase64={isPageActive && !readOnly ? drawingImageBase64 : undefined}
                    isRecognizingDrawing={isPageActive && !readOnly ? isRecognizingDrawing : undefined}
                    drawingError={isPageActive && !readOnly ? drawingError : undefined}
                    voiceError={isPageActive && !readOnly ? voiceError : undefined}
                    onDrawingRetry={isPageActive && !readOnly ? handleDrawingRetry : undefined}
                    onDrawingErrorClose={isPageActive && !readOnly ? handleDrawingErrorClose : undefined}
                    onTextSubmit={isPageActive && !readOnly ? handleTextSubmit : undefined}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/5 to-transparent" />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
                    }}
                  />
                </div>

                {/* Back of page */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="h-full w-full bg-[var(--storybook-cream)]">
                    <div
                      className="h-full w-full opacity-20"
                      style={{
                        backgroundImage: `radial-gradient(circle, var(--storybook-peach) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }}
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/15 to-transparent" />
                </div>
              </div>
            )
          })}

          {/* Book spine shadow */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[999] w-3 bg-gradient-to-r from-black/20 to-transparent" />
        </div>
      </div>

      {/* Bottom controls - fixed height */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 px-3 pb-2 pt-1 sm:gap-2 sm:px-4 sm:pb-3 md:gap-3 md:px-8 md:pb-4">
        {/* Navigation */}
        <div className="flex w-full max-w-lg items-center justify-between gap-3">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 0 || isFlipping}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background disabled:opacity-30 disabled:shadow-none sm:h-12 sm:w-12"
            aria-label="まえのページ"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="ページ">
            {displayPages.map((_, index) => (
              <div
                key={index}
                role="tab"
                aria-selected={currentPage === index}
                aria-label={`ページ ${index + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 sm:h-3.5 ${
                  currentPage === index
                    ? 'w-6 bg-[var(--storybook-peach)] sm:w-8'
                    : 'w-2.5 bg-background/50 sm:w-3'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goToNextPage}
            disabled={isLastPage || isFlipping}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-background disabled:opacity-30 disabled:shadow-none sm:h-12 sm:w-12"
            aria-label="つぎのページ"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Cover creation CTA on last page */}
        {isLastPage && !isFlipping ? (
          readOnly ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-serif text-xs font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              じぶんも えほんを つくる
            </Link>
          ) : (
            <Link
              href={`/book/${story.id}/cover${storySessionId ? `?session=${storySessionId}` : ''}`}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-serif text-xs font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ひょうしを つくる
            </Link>
          )
        ) : readOnly && authorName ? (
          <p className="font-serif text-[10px] text-background/60 sm:text-xs">
            さくしゃ: {authorName}
          </p>
        ) : (
          <p className="font-serif text-[10px] text-background/40 sm:text-xs">
            スワイプ または やじるしキーで ページをめくれるよ
          </p>
        )}
      </div>

      {/* DrawingOverlay: transform 影響外でレンダリングし fixed を正しく機能させる */}
      {/* 認識中・エラー中もオーバーレイを維持し、内部でローディング/エラーを表示 */}
      {!readOnly && (pagePhase === 'drawing' || isRecognizingDrawing || (drawingError && pagePhase !== 'drawingConfirm')) && (
        <DrawingOverlay
          illustration={displayPages[currentPage]?.illustration}
          onComplete={handleDrawingComplete}
          onCancel={handleDrawingCancel}
          isRecognizing={isRecognizingDrawing}
          error={drawingError}
          onRetry={handleDrawingRetry}
          onErrorClose={handleDrawingErrorClose}
        />
      )}

      {/* Story Remix Overlay */}
      {showRemixOverlay && storePages.length > 0 && (
        <StoryRemixOverlay
          bookId={bookId || story.id}
          bookTitle={story.title}
          pages={storePages}
          onComplete={handleRemixComplete}
        />
      )}
    </div>
  )
}
