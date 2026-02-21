'use client'

import { StoryBookViewer } from '@/components/book/StoryBookViewer'
import type { Story } from '@/lib/types'

interface SharedStoryViewerProps {
  story: Story
  authorName?: string
}

export function SharedStoryViewer({ story, authorName }: SharedStoryViewerProps) {
  return <StoryBookViewer story={story} readOnly authorName={authorName} />
}
