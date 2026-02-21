import { NextResponse } from 'next/server'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'scribble-tale'

interface FirestoreValue {
  stringValue?: string
  booleanValue?: boolean
  integerValue?: string
  arrayValue?: { values?: FirestoreValue[] }
  mapValue?: { fields?: Record<string, FirestoreValue> }
  timestampValue?: string
}

interface FirestoreDocument {
  name: string
  fields: Record<string, FirestoreValue>
  createTime: string
  updateTime: string
}

function parseFirestoreValue(val: FirestoreValue): unknown {
  if ('stringValue' in val) return val.stringValue
  if ('booleanValue' in val) return val.booleanValue
  if ('integerValue' in val) return Number(val.integerValue)
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

function docToObject(doc: FirestoreDocument) {
  const obj: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(doc.fields || {})) {
    obj[key] = parseFirestoreValue(val)
  }
  // ドキュメントIDを抽出
  const parts = doc.name.split('/')
  obj.id = parts[parts.length - 1]
  return obj
}

export async function GET() {
  try {
    // Firestore REST API で isShared == true のドキュメントを取得
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'stories' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'isShared' },
              op: 'EQUAL',
              value: { booleanValue: true },
            },
          },
          limit: 50,
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[api/library] Firestore REST error:', res.status, errText)
      return NextResponse.json({ stories: [], error: `Firestore: ${res.status}` }, { status: 500 })
    }

    const results = await res.json()

    // REST APIは [{document: {...}}, ...] の形式で返す（結果なしの場合は[{readTime: ...}]）
    const stories = (results as { document?: FirestoreDocument }[])
      .filter((r) => r.document)
      .map((r) => docToObject(r.document!))

    // updatedAt 降順ソート
    stories.sort((a, b) => {
      const aTime = (a.updatedAt as { seconds?: number })?.seconds ?? 0
      const bTime = (b.updatedAt as { seconds?: number })?.seconds ?? 0
      return bTime - aTime
    })

    return NextResponse.json({ stories })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/library] Error:', message)
    return NextResponse.json({ stories: [], error: message }, { status: 500 })
  }
}
