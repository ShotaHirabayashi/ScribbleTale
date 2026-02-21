import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { getSharedStories } = await import('@/lib/firebase/firestore')
    const stories = await getSharedStories(50)
    return NextResponse.json({ stories })
  } catch (err) {
    console.error('[api/library] Error:', err)
    return NextResponse.json({ stories: [] }, { status: 500 })
  }
}
