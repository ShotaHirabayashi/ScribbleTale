import { NextRequest, NextResponse } from 'next/server'
import { modifyCurrentPage } from '@/lib/story/engine'
import { orchestrate } from '@/lib/story/orchestrator'

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
    const { bookId, bookTitle, keyword, childUtterance, currentPageIndex, pages, trigger } = body

    if (!bookId || !bookTitle || !keyword || currentPageIndex == null || !pages || !trigger) {
      const missing = [
        !bookId && 'bookId',
        !bookTitle && 'bookTitle',
        !keyword && 'keyword',
        currentPageIndex == null && 'currentPageIndex',
        !pages && 'pages',
        !trigger && 'trigger',
      ].filter(Boolean)
      console.error('[modify] Missing fields:', missing, { bookId, bookTitle, keyword, currentPageIndex, trigger, pagesLength: pages?.length })
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // 改変エンジン呼び出し
    const result = await modifyCurrentPage({
      bookTitle,
      keyword,
      childUtterance,
      currentPageIndex,
      pages,
      trigger,
      apiKey,
    })

    // オーケストレーター呼び出し（整合性チェック + キャラクター反応）
    const targetPage = pages[result.targetPageIndex]
    const previousPages = pages
      .slice(0, result.targetPageIndex)
      .map((p: { pageNumber?: number; id: number; currentText?: string; text: string }) => ({
        pageNumber: p.pageNumber || p.id,
        currentText: p.currentText || p.text,
      }))

    const orchResult = await orchestrate({
      bookId,
      bookTitle,
      keyword,
      childUtterance,
      targetPage,
      modifiedText: result.modifiedText,
      previousPages,
      apiKey,
    })

    // オーケストレーター結果で modification.afterText を同期
    const finalModification = {
      ...result.modification,
      afterText: orchResult.modifiedText,
    }

    return NextResponse.json({
      modifiedText: orchResult.modifiedText,
      targetPageIndex: result.targetPageIndex,
      modification: finalModification,
      approved: orchResult.approved,
      characterReactions: orchResult.characterReactions,
    })
  } catch (error) {
    console.error('[modify] Error:', error)
    return NextResponse.json(
      { error: 'Modification failed' },
      { status: 500 }
    )
  }
}
