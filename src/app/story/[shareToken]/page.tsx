import type { Metadata } from 'next'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SharedStoryViewer } from './SharedStoryViewer'

type Params = Promise<{ shareToken: string }>

async function getSharedStory(shareToken: string) {
  try {
    const { getStoryByShareToken } = await import('@/lib/firebase/firestore')
    return await getStoryByShareToken(shareToken)
  } catch {
    // Firebase未設定の場合
    return null
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { shareToken } = await params
  const storyData = await getSharedStory(shareToken)

  const title = storyData
    ? `${storyData.bookId === 'momotaro' ? 'ももたろう' : 'あかずきん'} - みんなの えほん`
    : 'みんなの えほん - ScribbleTale'

  return {
    title: `${title} - ScribbleTale`,
    description: 'AIと子どもが一緒につくった、世界にひとつだけの絵本',
    openGraph: {
      title,
      description: 'AIと子どもが一緒につくった、世界にひとつだけの絵本',
      type: 'article',
      url: `/story/${shareToken}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'AIと子どもが一緒につくった、世界にひとつだけの絵本',
    },
  }
}

export default async function SharedStoryPage({ params }: { params: Params }) {
  const { shareToken } = await params
  const storyData = await getSharedStory(shareToken)

  if (!storyData) {
    // Firestoreにデータがない場合は404
    notFound()
  }

  // 元のストーリーデータ（ベーステンプレート）を取得して、改変データをマージ
  const bookId = storyData.bookId
  let baseStory
  try {
    if (bookId === 'momotaro') {
      const { momotaroStory } = await import('@/lib/story/momotaro')
      baseStory = momotaroStory
    } else if (bookId === 'akazukin') {
      const { akazukinStory } = await import('@/lib/story/akazukin')
      baseStory = akazukinStory
    }
  } catch {
    // ストーリーデータの読み込み失敗
  }

  if (!baseStory) {
    notFound()
  }

  // Firestoreに保存されたページデータで上書き
  const mergedStory = {
    ...baseStory,
    pages: storyData.pages.length > 0 ? storyData.pages : baseStory.pages,
  }

  return (
    <div className="flex h-dvh flex-col">
      <SharedStoryViewer story={mergedStory} />

      {/* フッターリンク */}
      <div className="fixed bottom-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 font-serif text-xs text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background sm:text-sm"
        >
          <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">じぶんも つくる</span>
        </Link>
      </div>
    </div>
  )
}
