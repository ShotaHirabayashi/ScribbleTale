import { NextRequest, NextResponse } from 'next/server'
import { regeneratePageInContext } from '@/lib/story/engine'
import { getBoldnessConfig } from '@/lib/story/boldness'
import type { ModificationBoldness } from '@/lib/types'

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
    const { bookTitle, currentPageIndex, pages, characterStates, boldnessLevel, remixPrompt } = body as {
      bookTitle: string
      currentPageIndex: number
      pages: unknown[]
      characterStates?: unknown[]
      boldnessLevel?: ModificationBoldness
      remixPrompt?: string
    }

    if (!bookTitle || currentPageIndex == null || !pages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const boldnessConfig = boldnessLevel ? getBoldnessConfig(boldnessLevel) : undefined

    const result = await regeneratePageInContext({
      bookTitle,
      currentPageIndex,
      pages: pages as import('@/lib/types').StoryPage[],
      apiKey,
      characterStates: characterStates as import('@/lib/types').CharacterState[] | undefined,
      boldnessConfig,
      remixPrompt,
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
