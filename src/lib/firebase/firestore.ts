import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { StoryPage, Modification } from '@/lib/types'

const STORIES_COLLECTION = 'stories'
const SHARE_TOKENS_COLLECTION = 'shareTokens'

interface FirestoreStoryData {
  bookId: string
  shareToken: string
  isShared: boolean
  pages: StoryPage[]
  modifications: Modification[]
  title?: string
  authorName?: string
  bgColor?: string
  frameStyle?: string
  createdAt: ReturnType<typeof serverTimestamp>
  updatedAt: ReturnType<typeof serverTimestamp>
}

/** ストーリーをFirestoreに保存（共有時） */
export async function saveStory(
  storyId: string,
  data: {
    bookId: string
    shareToken: string
    pages: StoryPage[]
    modifications: Modification[]
    title?: string
    authorName?: string
    bgColor?: string
    frameStyle?: string
  }
): Promise<void> {
  const storyRef = doc(collection(db, STORIES_COLLECTION), storyId)

  // 表紙メタ情報（undefinedのフィールドはFirestoreに書き込まない）
  const coverMeta: Record<string, string> = {}
  if (data.title) coverMeta.title = data.title
  if (data.authorName) coverMeta.authorName = data.authorName
  if (data.bgColor) coverMeta.bgColor = data.bgColor
  if (data.frameStyle) coverMeta.frameStyle = data.frameStyle

  // 既存ドキュメントがあればcreatedAtを保護
  const existing = await getDoc(storyRef)

  if (existing.exists()) {
    await updateDoc(storyRef, {
      bookId: data.bookId,
      shareToken: data.shareToken,
      isShared: true,
      pages: data.pages,
      modifications: data.modifications,
      ...coverMeta,
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(storyRef, {
      bookId: data.bookId,
      shareToken: data.shareToken,
      isShared: true,
      pages: data.pages,
      modifications: data.modifications,
      ...coverMeta,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as FirestoreStoryData)
  }

  // 逆引きインデックス
  const tokenRef = doc(collection(db, SHARE_TOKENS_COLLECTION), data.shareToken)
  await setDoc(tokenRef, {
    storyId,
    createdAt: serverTimestamp(),
  })
}

/** 共有トークンからストーリーを取得 */
export async function getStoryByShareToken(
  shareToken: string
): Promise<(FirestoreStoryData & { id: string }) | null> {
  // 逆引きでstoryIdを取得
  const tokenRef = doc(collection(db, SHARE_TOKENS_COLLECTION), shareToken)
  const tokenSnap = await getDoc(tokenRef)

  if (!tokenSnap.exists()) return null

  const { storyId } = tokenSnap.data() as { storyId: string }

  // ストーリーデータを取得
  const storyRef = doc(collection(db, STORIES_COLLECTION), storyId)
  const storySnap = await getDoc(storyRef)

  if (!storySnap.exists()) return null

  return {
    id: storySnap.id,
    ...(storySnap.data() as FirestoreStoryData),
  }
}

/** 共有済みストーリーを全件取得（本棚用） */
export async function getSharedStories(
  max: number = 50
): Promise<(FirestoreStoryData & { id: string })[]> {
  const q = query(
    collection(db, STORIES_COLLECTION),
    where('isShared', '==', true),
    firestoreLimit(max),
  )

  // タイムアウト付きでクエリ実行（10秒）
  const snap = await Promise.race([
    getDocs(q),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore query timeout')), 10000)
    ),
  ])

  const results = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as FirestoreStoryData),
  }))

  // クライアント側で updatedAt 降順ソート（複合インデックス不要にするため）
  results.sort((a, b) => {
    const aTime = (a.updatedAt as { seconds?: number })?.seconds ?? 0
    const bTime = (b.updatedAt as { seconds?: number })?.seconds ?? 0
    return bTime - aTime
  })

  return results
}

/** ストーリーIDで直接取得 */
export async function getStoryById(
  storyId: string
): Promise<(FirestoreStoryData & { id: string }) | null> {
  const storyRef = doc(collection(db, STORIES_COLLECTION), storyId)
  const storySnap = await getDoc(storyRef)

  if (!storySnap.exists()) return null

  return {
    id: storySnap.id,
    ...(storySnap.data() as FirestoreStoryData),
  }
}

/** 改変のたびにページデータと改変履歴を更新 */
export async function updateStoryPages(
  storyId: string,
  pages: StoryPage[],
  modifications: Modification[]
): Promise<void> {
  const storyRef = doc(collection(db, STORIES_COLLECTION), storyId)

  await updateDoc(storyRef, {
    pages,
    modifications,
    updatedAt: serverTimestamp(),
  })
}

/** セッションの取得または新規作成 */
export async function getOrCreateStorySession(
  bookId: string,
  initialPages: StoryPage[]
): Promise<{ storyId: string; pages: StoryPage[]; modifications: Modification[] }> {
  const sessionKey = `scribble-session-${bookId}`
  const existingSessionId = typeof window !== 'undefined'
    ? localStorage.getItem(sessionKey)
    : null

  // 既存セッションがあればFirestoreから復元
  if (existingSessionId) {
    try {
      const existing = await getStoryById(existingSessionId)
      if (existing) {
        return {
          storyId: existing.id,
          pages: existing.pages,
          modifications: existing.modifications,
        }
      }
    } catch (error) {
      console.warn('[firestore] Failed to restore session, creating new:', error)
    }
  }

  // 新規作成
  const storyRef = doc(collection(db, STORIES_COLLECTION))
  const storyId = storyRef.id

  await setDoc(storyRef, {
    bookId,
    shareToken: '',
    isShared: false,
    pages: initialPages,
    modifications: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } satisfies FirestoreStoryData)

  // セッションIDをlocalStorageに保存
  if (typeof window !== 'undefined') {
    localStorage.setItem(sessionKey, storyId)
  }

  return {
    storyId,
    pages: initialPages,
    modifications: [],
  }
}
