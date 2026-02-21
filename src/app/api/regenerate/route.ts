import { NextRequest, NextResponse } from 'next/server'
import { regeneratePageInContext } from '@/lib/story/engine'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { bookTitle, currentPageIndex, pages, characterStates } = body

    if (!bookTitle || currentPageIndex == null || !pages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await regeneratePageInContext({
      bookTitle,
      currentPageIndex,
      pages,
      apiKey,
      characterStates,
    })

    return NextResponse.json({
      modifiedText: result.modifiedText,
      targetPageIndex: result.targetPageIndex,
    })
  } catch (error) {
    console.error('[regenerate] Error:', error)
    return NextResponse.json(
      { error: 'Regeneration failed' },
      { status: 500 }
    )
  }
}
