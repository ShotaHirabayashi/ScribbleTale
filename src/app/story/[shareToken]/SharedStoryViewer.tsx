'use client'

import { StoryBookViewer } from '@/components/book/StoryBookViewer'
import type { Story } from '@/lib/types'

interface SharedStoryViewerProps {
  story: Story
}

export function SharedStoryViewer({ story }: SharedStoryViewerProps) {
  return <StoryBookViewer story={story} readOnly />
}
