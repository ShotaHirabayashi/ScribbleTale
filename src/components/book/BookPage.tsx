'use client'

import Image from 'next/image'
import { StoryText } from './StoryText'
import { CommentTimeButton } from './CommentTimeButton'
import { CommentTimeOverlay } from './CommentTimeOverlay'
import { ModificationLoading } from './ModificationLoading'
import type { StoryPage } from '@/lib/types'
import type { PagePhase, ModificationPhase } from '@/lib/types'

interface BookPageProps {
  page: StoryPage
  isActive: boolean
  isCover?: boolean
  isLastPage?: boolean
  pagePhase?: PagePhase
  modificationPhase?: ModificationPhase
  commentTimeRemainingMs?: number
  childUtterance?: string | null
  onReadingComplete?: () => void
  onStartCommentTime?: () => void
  onSkipCommentTime?: () => void
}

export function BookPage({
  page,
  isActive,
  isCover = false,
  isLastPage = false,
  pagePhase,
  modificationPhase,
  commentTimeRemainingMs = 30000,
  childUtterance,
  onReadingComplete,
  onStartCommentTime,
  onSkipCommentTime,
}: BookPageProps) {
  // 表示するテキスト（改変済みの場合はcurrentTextを使用）
  const displayText = page.currentText || page.text

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

  if (isLastPage) {
    return (
      <div className="relative flex h-full w-full flex-col bg-[var(--storybook-cream)]">
        <div className="relative min-h-0 flex-1">
          <Image
            src={page.illustration}
            alt={page.alt}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--storybook-cream)] via-transparent to-transparent" />
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1 px-4 pb-3 pt-2 sm:gap-2 sm:px-6 sm:pb-4 sm:pt-3 md:px-10">
          <StoryText
            text={displayText}
            isActive={isActive}
            className="text-center text-sm text-[var(--storybook-brown)] sm:text-base md:text-lg"
            onComplete={onReadingComplete}
          />
          <div className="font-serif text-xs text-muted-foreground sm:text-sm">
            おしまい
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--storybook-cream)]">
      <div className="relative min-h-0 flex-1">
        <Image
          src={page.illustration}
          alt={page.alt}
          fill
          className="object-cover"
        />
      </div>
      <div className="shrink-0 px-4 py-2 sm:px-6 sm:py-3 md:px-10 md:py-4">
        <StoryText
          text={displayText}
          isActive={isActive}
          className="text-sm text-[var(--storybook-brown)] sm:text-base md:text-lg"
          onComplete={onReadingComplete}
        />
      </div>

      {/* pagePhase オーバーレイ */}
      {pagePhase === 'readingComplete'
        && onStartCommentTime && onSkipCommentTime
        && (page.modificationCount ?? 0) < 2 && (
        <CommentTimeButton
          onStart={onStartCommentTime}
          onSkip={onSkipCommentTime}
        />
      )}

      {pagePhase === 'commentTime' && onSkipCommentTime && (
        <CommentTimeOverlay
          remainingMs={commentTimeRemainingMs}
          childUtterance={childUtterance ?? null}
          onSkip={onSkipCommentTime}
        />
      )}

      {pagePhase === 'modifying' && modificationPhase && (
        <ModificationLoading phase={modificationPhase} />
      )}
    </div>
  )
}
