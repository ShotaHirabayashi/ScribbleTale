'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { StoryText } from './StoryText'
import { CommentTimeButton } from './CommentTimeButton'
import { CommentTimeOverlay } from './CommentTimeOverlay'
import { ModificationLoading } from './ModificationLoading'
import { ImageShimmer } from './ImageShimmer'
import { WaitingExperience } from './WaitingExperience'
import { DrawingConfirmOverlay } from './DrawingConfirmOverlay'
import { DrawingRecognizingModal } from './DrawingRecognizingModal'
import { DrawingErrorModal } from './DrawingErrorModal'
import { ConfirmationOverlay } from './ConfirmationOverlay'
import { soundManager } from '@/lib/audio/sound-manager'
import type { StoryPage } from '@/lib/types'
import type { PagePhase, ModificationPhase } from '@/lib/types'

interface BookPageProps {
  page: StoryPage
  isActive: boolean
  isCover?: boolean
  isLastPage?: boolean
  readOnly?: boolean
  pagePhase?: PagePhase
  modificationPhase?: ModificationPhase
  commentTimeRemainingMs?: number
  childUtterance?: string | null
  onReadingComplete?: () => void
  onStartCommentTime?: () => void
  onSkipCommentTime?: () => void
  onEndCommentTime?: () => void
  onStartDrawing?: () => void
  onDrawingComplete?: (imageBase64: string) => void
  onDrawingCancel?: () => void
  onDrawingConfirm?: () => void
  onDrawingReject?: () => void
  onConfirmModification?: () => void
  onCancelConfirmation?: () => void
  selectedKeyword?: string | null
  selectedUtterance?: string | null
  recognizedKeyword?: string | null
  drawingImageBase64?: string | null
  isRecognizingDrawing?: boolean
  drawingError?: string | null
  voiceError?: string | null
  onDrawingRetry?: () => void
  onDrawingErrorClose?: () => void
}

export function BookPage({
  page,
  isActive,
  isCover = false,
  isLastPage = false,
  readOnly = false,
  pagePhase,
  modificationPhase,
  commentTimeRemainingMs = 30000,
  childUtterance,
  onReadingComplete,
  onStartCommentTime,
  onSkipCommentTime,
  onEndCommentTime,
  onStartDrawing,
  onDrawingComplete,
  onDrawingCancel,
  onDrawingConfirm,
  onDrawingReject,
  onConfirmModification,
  onCancelConfirmation,
  selectedKeyword,
  selectedUtterance,
  recognizedKeyword,
  drawingImageBase64,
  isRecognizingDrawing,
  drawingError,
  voiceError,
  onDrawingRetry,
  onDrawingErrorClose,
}: BookPageProps) {
  // 表示するテキスト（改変済みの場合はcurrentTextを使用）
  const displayText = page.currentText || page.text

  // ボタン表示条件
  const canShowCommentTimeButton = onStartCommentTime && onStartDrawing

  // シマー表示制御: illustrationLoading解除後に遅延で非表示
  const [showShimmer, setShowShimmer] = useState(false)
  const [showCompletionEffect, setShowCompletionEffect] = useState(false)
  const wasLoadingRef = useState(false)
  useEffect(() => {
    if (page.illustrationLoading) {
      setShowShimmer(true)
      wasLoadingRef[1](true)
    } else if (showShimmer) {
      // ローディング中だった → 完了エフェクトを表示 + SE再生
      if (wasLoadingRef[0]) {
        setShowCompletionEffect(true)
        wasLoadingRef[1](false)
        soundManager.play('modification-complete')
        const effectTimer = setTimeout(() => setShowCompletionEffect(false), 1500)
        const shimmerTimer = setTimeout(() => setShowShimmer(false), 1000)
        return () => {
          clearTimeout(effectTimer)
          clearTimeout(shimmerTimer)
        }
      }
      const timer = setTimeout(() => setShowShimmer(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [page.illustrationLoading, showShimmer, wasLoadingRef])

  if (isCover) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--storybook-cream)] p-4 sm:p-6">
        <div className="relative w-full max-w-[75%] flex-1 min-h-0 overflow-hidden rounded-lg shadow-md">
          <Image
            src={page.illustration}
            alt={page.alt}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="mt-3 shrink-0 text-center sm:mt-4">
          <h2 className="font-serif text-xl tracking-wider text-[var(--storybook-brown)] sm:text-2xl md:text-3xl">
            {displayText.split('\n')[0] || 'えほん'}
          </h2>
          <p className="mt-1 font-serif text-xs text-muted-foreground sm:text-sm">
            {displayText.split('\n')[1] || ''}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative flex h-full w-full flex-col bg-[var(--storybook-cream)] ${pagePhase === 'drawing' ? 'drawing-overlay-active' : ''}`}>
      <div
        className="relative min-h-0 flex-[3] bg-[var(--storybook-cream)]"
        style={pagePhase === 'drawing' ? {
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          pointerEvents: 'none',
        } : undefined}
        onContextMenu={pagePhase === 'drawing' ? (e) => e.preventDefault() : undefined}
      >
        <Image
          src={page.illustration}
          alt={page.alt}
          fill
          className={`object-contain transition-all duration-1000 ${
            page.illustrationLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          } ${showCompletionEffect ? 'animate-image-reveal' : ''}`}
        />
        {showShimmer && (
          page.illustrationLoading ? (
            <WaitingExperience previousIllustration={page.previousIllustration} keyword={selectedKeyword ?? undefined} />
          ) : (
            <ImageShimmer previousIllustration={page.previousIllustration} />
          )
        )}
        {isLastPage && (
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--storybook-cream)] via-transparent to-transparent" />
        )}
      </div>
      <div className={`min-h-0 flex-[2] overflow-y-auto px-4 py-2 sm:px-6 sm:py-3 md:px-10 md:py-4 ${isLastPage ? 'flex flex-col items-center gap-1 sm:gap-2' : ''}`}>
        <StoryText
          key={`${page.id}-${page.modificationCount ?? 0}`}
          text={displayText}
          isActive={isActive}
          skipAnimation={page.textRevealed}
          className={`text-sm text-[var(--storybook-brown)] sm:text-base md:text-lg ${isLastPage ? 'text-center' : ''}`}
          onComplete={onReadingComplete}
        />
        {isLastPage && (
          <div className="font-serif text-xs text-muted-foreground sm:text-sm">
            おしまい
          </div>
        )}
      </div>

      {/* readOnly: ボタンなし / 通常: ボタン用スペース確保 */}
      {!readOnly && (
        <>
          <div className="shrink-0 h-[3.5rem] px-4 sm:px-6 md:px-10">
            {pagePhase === 'readingComplete' && canShowCommentTimeButton && (
              (page.modificationCount ?? 0) >= 2 ? (
                <div className="flex justify-center pt-2 pb-1 animate-in fade-in duration-500">
                  <p className="font-serif text-sm text-muted-foreground">
                    もう たくさん かえたね！つぎに すすもう
                  </p>
                </div>
              ) : (
                <CommentTimeButton
                  onStart={onStartCommentTime!}
                  onStartDrawing={onStartDrawing!}
                />
              )
            )}
          </div>

          {/* DrawingOverlay は transform 影響下で fixed が効かないため StoryBookViewer 側でレンダリング */}

          {isRecognizingDrawing && (
            <DrawingRecognizingModal />
          )}

          {drawingError && onDrawingRetry && onDrawingErrorClose && (
            <DrawingErrorModal
              message={drawingError}
              onRetry={onDrawingRetry}
              onClose={onDrawingErrorClose}
            />
          )}

          {pagePhase === 'drawingConfirm' && onDrawingConfirm && onDrawingReject && recognizedKeyword && drawingImageBase64 && (
            <DrawingConfirmOverlay
              keyword={recognizedKeyword}
              drawingImageBase64={drawingImageBase64}
              onConfirm={onDrawingConfirm}
              onReject={onDrawingReject}
            />
          )}

          {pagePhase === 'confirming' && onConfirmModification && onCancelConfirmation && selectedKeyword && (
            <ConfirmationOverlay
              keyword={selectedKeyword}
              utterance={selectedUtterance ?? null}
              onConfirm={onConfirmModification}
              onCancel={onCancelConfirmation}
            />
          )}

          {pagePhase === 'commentTime' && onSkipCommentTime && onEndCommentTime && (
            <CommentTimeOverlay
              remainingMs={commentTimeRemainingMs}
              childUtterance={childUtterance ?? null}
              voiceError={voiceError}
              onSkip={onSkipCommentTime}
              onEnd={onEndCommentTime}
            />
          )}

          {(
            (pagePhase === 'modifying' && (modificationPhase === 'orchestrating' || modificationPhase === 'generating_image')) ||
            (pagePhase === 'modified' && modificationPhase === 'generating_image')
          ) && (
            <ModificationLoading phase={modificationPhase} keyword={selectedKeyword ?? undefined} />
          )}
        </>
      )}
    </div>
  )
}
