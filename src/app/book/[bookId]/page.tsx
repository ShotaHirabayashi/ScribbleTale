import { StoryBookViewer } from '@/components/book/StoryBookViewer'
import { momotaroStory } from '@/lib/story/momotaro'
import { akazukinStory } from '@/lib/story/akazukin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Story } from '@/lib/types'

const storyMap: Record<string, Story> = {
  momotaro: momotaroStory,
  akazukin: akazukinStory,
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
}

type Params = Promise<{ bookId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { bookId } = await params
  const meta = metadataMap[bookId]
  if (!meta) return {}
  return meta
}

export async function generateStaticParams() {
  return [{ bookId: 'momotaro' }, { bookId: 'akazukin' }]
}

export default async function BookPage({ params }: { params: Params }) {
  const { bookId } = await params
  const story = storyMap[bookId]

  if (!story) {
    notFound()
  }

  return <StoryBookViewer story={story} bookId={bookId} />
}
