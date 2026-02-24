import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SharedStoryViewer } from './SharedStoryViewer'
import { generateOGDescription } from '@/lib/story/modification-summary'
import type { StoryPage, Modification } from '@/lib/types'

type Params = Promise<{ shareToken: string }>

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'scribble-tale'
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

interface FirestoreValue {
  stringValue?: string
  booleanValue?: boolean
  integerValue?: string
  doubleValue?: number
  nullValue?: null
  arrayValue?: { values?: FirestoreValue[] }
  mapValue?: { fields?: Record<string, FirestoreValue> }
  timestampValue?: string
}

function parseFirestoreValue(val: FirestoreValue): unknown {
  if ('nullValue' in val) return null
  if ('stringValue' in val) return val.stringValue
  if ('booleanValue' in val) return val.booleanValue
  if ('integerValue' in val) return Number(val.integerValue)
  if ('doubleValue' in val) return val.doubleValue
  if ('timestampValue' in val) {
    const d = new Date(val.timestampValue!)
    return { seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }
  }
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(parseFirestoreValue)
  }
  if ('mapValue' in val) {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
      obj[k] = parseFirestoreValue(v)
    }
    return obj
  }
  return null
}

function docToObject(fields: Record<string, FirestoreValue>) {
  const obj: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(fields)) {
    obj[key] = parseFirestoreValue(val)
  }
  return obj
}

interface SharedStoryData {
  bookId: string
  shareToken: string
  pages: StoryPage[]
  modifications: Modification[]
  title?: string
  authorName?: string
  coverImage?: string
}

async function getSharedStory(shareToken: string): Promise<SharedStoryData | null> {
  try {
    // 1. shareTokens コレクションから storyId を逆引き
    const tokenRes = await fetch(`${FIRESTORE_BASE}/shareTokens/${shareToken}`)
    if (!tokenRes.ok) return null
    const tokenDoc = await tokenRes.json()
    const storyId = tokenDoc.fields?.storyId?.stringValue
    if (!storyId) return null

    // 2. stories コレクションからストーリーデータを取得
    const storyRes = await fetch(`${FIRESTORE_BASE}/stories/${storyId}`)
    if (!storyRes.ok) return null
    const storyDoc = await storyRes.json()
    if (!storyDoc.fields) return null

    return docToObject(storyDoc.fields) as unknown as SharedStoryData
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { shareToken } = await params
  const storyData = await getSharedStory(shareToken)

  const displayTitle = storyData?.title
    || (storyData?.bookId === 'momotaro' ? 'ももたろう' : 'あかずきん')
  const title = storyData
    ? `${displayTitle} - みんなの えほん`
    : 'みんなの えほん - ScribbleTale'

  const description = storyData
    ? generateOGDescription(storyData.bookId, storyData.modifications)
    : 'AIと子どもが一緒につくった、世界にひとつだけの絵本'

  return {
    title: `${title} - ScribbleTale`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/story/${shareToken}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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

  // Firestoreに保存されたデータでテンプレートを上書き
  const mergedStory = {
    ...baseStory,
    ...(storyData.title && { title: storyData.title }),
    ...(storyData.coverImage && { coverImage: storyData.coverImage }),
    pages: storyData.pages.length > 0
      ? storyData.pages.map((page, index) => ({
          ...page,
          illustration: page.illustration || baseStory.pages[index]?.illustration || '',
          // currentText（改変後テキスト）を優先、未設定なら text にフォールバック
          currentText: page.currentText || page.text || baseStory.pages[index]?.text || '',
          text: page.currentText || page.text || baseStory.pages[index]?.text || '',
        }))
      : baseStory.pages,
  }

  return (
    <div className="flex h-dvh flex-col">
      <SharedStoryViewer story={mergedStory} authorName={storyData.authorName || "ScribbleTale"} />
    </div>
  )
}
