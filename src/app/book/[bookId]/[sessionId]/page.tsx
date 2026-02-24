import { StoryBookViewer } from '@/components/book/StoryBookViewer'
import { momotaroStory } from '@/lib/story/momotaro'
import { akazukinStory } from '@/lib/story/akazukin'
import { wizardOfOzStory } from '@/lib/story/wizard-of-oz'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Story } from '@/lib/types'

const storyMap: Record<string, Story> = {
  momotaro: momotaroStory,
  akazukin: akazukinStory,
  'wizard-of-oz': wizardOfOzStory,
}

const metadataMap: Record<string, { title: string; description: string }> = {
  momotaro: {
    title: 'ももたろう - ScribbleTale',
    description: 'ももたろうの絵本をよもう',
  },
  akazukin: {
    title: 'あかずきん - ScribbleTale',
    description: 'あかずきんの絵本をよもう',
  },
  'wizard-of-oz': {
    title: 'オズのまほうつかい - ScribbleTale',
    description: 'オズのまほうつかいの絵本をよもう',
  },
}

type Params = Promise<{ bookId: string; sessionId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { bookId } = await params
  const meta = metadataMap[bookId]
  if (!meta) return {}
  return meta
}

export default async function BookSessionPage({ params }: { params: Params }) {
  const { bookId, sessionId } = await params
  const story = storyMap[bookId]

  if (!story) {
    notFound()
  }

  return <StoryBookViewer story={story} bookId={bookId} sessionId={sessionId} />
}
