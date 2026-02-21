import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

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

    // Firebase が設定されている場合はFirestoreに保存
    try {
      const { saveStory } = await import('@/lib/firebase/firestore')
      await saveStory(generatedStoryId, {
        bookId,
        shareToken,
        pages,
        modifications: modifications || [],
        title,
        authorName,
        bgColor,
        frameStyle,
      })
    } catch {
      // Firebase未設定の場合はトークン生成のみ
      console.warn('[share] Firestore save skipped (Firebase not configured)')
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
