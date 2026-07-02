'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { StoryText } from './StoryText'
import { CommentTimeButton } from './CommentTimeButton'
import { CommentTimeOverlay } from './CommentTimeOverlay'
import { ModificationLoading } from './ModificationLoading'
import { ImageShimmer } from './ImageShimmer'
import { WaitingExperience } from './WaitingExperience'
import { DrawingConfirmOverlay } from './DrawingConfirmOverlay'
import { ConfirmationOverlay } from './ConfirmationOverlay'
import { soundManager } from '@/lib/audio/sound-manager'
import { useStoryStore } from '@/stores/story-store'
import type { StoryPage } from '@/lib/types'
import type { PagePhase, ModificationPhase } from '@/lib/types'

// ── リワード演出（紙吹雪） ──
const CONFETTI_COLORS = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98'] as const

// 丸ごとに位置・色・遅延をランダム化した紙吹雪の設定を生成
function createConfettiPieces(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.round(Math.random() * 100)}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.round(Math.random() * 600)}ms`,
  }))
}

// 画像コンテナ上に降らせる紙吹雪オーバーレイ
function ConfettiOverlay() {
  const [pieces] = useState(() => createConfettiPieces(10))
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="animate-confetti-fall absolute top-0 h-3 w-3 rounded-full"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
          }}
        />
      ))}
    </div>
  )
}

// 改変完了時に画像上部へ表示するキーワードバナー
function KeywordBanner({ keyword, fading }: { keyword: string; fading: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center">
      <div
        className={`rounded-full bg-yellow-400/90 px-4 py-2 text-sm font-bold text-yellow-900 shadow-md ${
          fading
            ? 'animate-out fade-out duration-500'
            : 'animate-in slide-in-from-top-4 duration-500'
        }`}
      >
        ✨ {keyword} をいれたね！
      </div>
    </div>
  )
}

interface BookPageProps {
  page: StoryPage
  isActive: boolean
  isCover?: boolean
  isLastPage?: boolean
  readOnly?: boolean
  pagePhase?: PagePhase
  modificationPhase?: ModificationPhase
  maxModifications?: number
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
  onTextSubmit?: (keyword: string) => void
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
  onTextSubmit,
  maxModifications = 2,
}: BookPageProps) {
  // 表示するテキスト（改変済みの場合はcurrentTextを使用）
  const displayText = page.currentText || page.text

  // ボタン表示条件
  const canShowCommentTimeButton = onStartCommentTime && onStartDrawing

  // リワード演出用キーワード取得
  // 「このページに入れたキーワード」に相当する情報はストア上の
  // selectedKeyword / recognizedKeyword / pendingKeywords に保持されている
  const rewardKeyword = useStoryStore((state) => {
    if (state.selectedKeyword?.keyword) return state.selectedKeyword.keyword
    if (state.recognizedKeyword) return state.recognizedKeyword
    const last = state.pendingKeywords[state.pendingKeywords.length - 1]
    return last?.keyword ?? ''
  })

  // シマー表示制御: illustrationLoading解除後に遅延で非表示
  const [showShimmer, setShowShimmer] = useState(false)
  const [showCompletionEffect, setShowCompletionEffect] = useState(false)
  // キーワードバナー: 表示 → 2秒後フェードアウト開始 → 3秒後非表示
  const [bannerKeyword, setBannerKeyword] = useState<string>('')
  const [bannerFading, setBannerFading] = useState(false)
  // 完了エフェクト発火時の最新キーワードを参照するための ref（依存配列に含めず再実行を防ぐ）
  const rewardKeywordRef = useRef(rewardKeyword)
  rewardKeywordRef.current = rewardKeyword
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

        // キーワードバナー表示（キーワードがある場合のみ）
        const keyword = rewardKeywordRef.current
        let bannerFadeTimer: ReturnType<typeof setTimeout> | undefined
        let bannerHideTimer: ReturnType<typeof setTimeout> | undefined
        if (keyword) {
          setBannerKeyword(keyword)
          setBannerFading(false)
          // 2秒後にフェードアウト開始
          bannerFadeTimer = setTimeout(() => setBannerFading(true), 2000)
          // 合計3秒後に非表示
          bannerHideTimer = setTimeout(() => {
            setBannerKeyword('')
            setBannerFading(false)
          }, 3000)
        }

        const effectTimer = setTimeout(() => setShowCompletionEffect(false), 1500)
        const shimmerTimer = setTimeout(() => setShowShimmer(false), 1000)
        return () => {
          clearTimeout(effectTimer)
          clearTimeout(shimmerTimer)
          if (bannerFadeTimer) clearTimeout(bannerFadeTimer)
          if (bannerHideTimer) clearTimeout(bannerHideTimer)
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
            className={`object-cover transition-all duration-1000 ${
              page.illustrationLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            } ${showCompletionEffect ? 'animate-image-reveal' : ''}`}
            priority
          />
          {showShimmer && (
            page.illustrationLoading ? (
              <WaitingExperience previousIllustration={page.previousIllustration} />
            ) : (
              <ImageShimmer previousIllustration={page.previousIllustration} />
            )
          )}
          {/* 改変完了時のリワード演出: 紙吹雪 */}
          {showCompletionEffect && <ConfettiOverlay />}
          {/* 改変完了時のリワード演出: キーワードバナー */}
          {bannerKeyword && <KeywordBanner keyword={bannerKeyword} fading={bannerFading} />}
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
        {/* 改変完了時のリワード演出: 紙吹雪 */}
        {showCompletionEffect && <ConfettiOverlay />}
        {/* 改変完了時のリワード演出: キーワードバナー */}
        {bannerKeyword && <KeywordBanner keyword={bannerKeyword} fading={bannerFading} />}
        {isLastPage && (
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--storybook-cream)] via-transparent to-transparent" />
        )}
      </div>
      <div
        className={`min-h-0 flex-[2] overflow-y-auto px-4 py-2 sm:px-6 sm:py-3 md:px-10 md:py-4 ${isLastPage ? 'flex flex-col items-center gap-1 sm:gap-2' : ''}`}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
        onTouchStart={(e) => {
          const el = e.currentTarget
          if (el.scrollHeight > el.clientHeight) {
            e.stopPropagation()
          }
        }}
        onTouchMove={(e) => {
          const el = e.currentTarget
          if (el.scrollHeight > el.clientHeight) {
            e.stopPropagation()
          }
        }}
      >
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
          <div className="shrink-0 h-[5.5rem] px-4 sm:px-6 md:px-10">
            {pagePhase === 'readingComplete' && canShowCommentTimeButton && (
              (page.modificationCount ?? 0) >= maxModifications ? (
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

          {/* DrawingOverlay / RecognizingModal / ErrorModal は StoryBookViewer 側でレンダリング */}

          {pagePhase === 'drawingConfirm' && onDrawingConfirm && onDrawingReject && recognizedKeyword && drawingImageBase64 && (
            <DrawingConfirmOverlay
              keyword={recognizedKeyword}
              drawingImageBase64={drawingImageBase64}
              onConfirm={onDrawingConfirm}
              onReject={onDrawingReject}
              onTextSubmit={onTextSubmit}
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
