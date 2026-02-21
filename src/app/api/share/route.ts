import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'scribble-tale'
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

/** Firestore REST API 用: JS値をFirestoreフィールド値に変換 */
function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === 'string') return { stringValue: val }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val }
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } }
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(val) }
}

/** Firestore REST API でドキュメントを作成/上書き */
async function firestoreSet(collection: string, docId: string, data: Record<string, unknown>) {
  const now = new Date().toISOString()
  const fields: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) fields[key] = toFirestoreValue(val)
  }
  // タイムスタンプ
  fields.updatedAt = { timestampValue: now }

  // 既存チェック
  const getRes = await fetch(`${FIRESTORE_BASE}/${collection}/${docId}`)
  if (getRes.ok) {
    // 更新（createdAt保持）
    const url = `${FIRESTORE_BASE}/${collection}/${docId}`
    const patchRes = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })
    if (!patchRes.ok) {
      const err = await patchRes.text()
      throw new Error(`Firestore PATCH failed: ${patchRes.status} ${err}`)
    }
  } else {
    // 新規作成
    fields.createdAt = { timestampValue: now }
    const url = `${FIRESTORE_BASE}/${collection}?documentId=${docId}`
    const createRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })
    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Firestore POST failed: ${createRes.status} ${err}`)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storyId, bookId, pages, modifications, title, authorName, bgColor, frameStyle } = body

    if (!bookId || !pages) {
      return NextResponse.json(
        { error: 'bookId and pages are required' },
        { status: 400 }
      )
    }

    const shareToken = nanoid(12)
    const generatedStoryId = storyId || `story-${nanoid(8)}`

    // Firestore REST API でストーリーを保存
    try {
      const storyData: Record<string, unknown> = {
        bookId,
        shareToken,
        isShared: true,
        pages,
        modifications: modifications || [],
      }
      if (title) storyData.title = title
      if (authorName) storyData.authorName = authorName
      if (bgColor) storyData.bgColor = bgColor
      if (frameStyle) storyData.frameStyle = frameStyle

      await firestoreSet('stories', generatedStoryId, storyData)

      // 逆引きインデックス
      await firestoreSet('shareTokens', shareToken, {
        storyId: generatedStoryId,
      })
    } catch (err) {
      console.error('[share] Firestore save failed:', err)
    }

    return NextResponse.json({
      shareToken,
      storyId: generatedStoryId,
      shareUrl: `/story/${shareToken}`,
    })
  } catch (error) {
    console.error('[share] Error:', error)
    return NextResponse.json(
      { error: 'Share token generation failed' },
      { status: 500 }
    )
  }
}
