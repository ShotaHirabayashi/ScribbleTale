import { NextRequest } from 'next/server'
import { modifyCurrentPage } from '@/lib/story/engine'
import { orchestrate } from '@/lib/story/orchestrator'
import { generateImage } from '@/lib/gemini/image-generator'
import { buildImagePrompt, buildImageEditPrompt } from '@/lib/gemini/prompts'
import type { StoryPage } from '@/lib/types'

/**
 * ストリーミング改変API
 *
 * NDJSON (newline-delimited JSON) でレスポンスを返す:
 * 1. {type:'text', ...} - テキスト改変結果（即座）
 * 2. {type:'orchestration', ...} - 整合性チェック結果（テキスト修正があれば差分）
 * 3. {type:'image', ...} - 画像生成結果
 * 4. {type:'done'} - 完了
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: {
    bookId: string
    bookTitle: string
    keyword: string
    childUtterance?: string
    currentPageIndex: number
    pages: Array<{
      id: number
      pageNumber?: number
      text: string
      currentText?: string
      alt?: string
      pageRole?: string
      fixedElements?: string[]
      originalText?: string
      illustration?: string
    }>
    trigger: 'voice' | 'drawing'
    characterStates?: Array<{
      characterId: string
      currentAppearance: string
      currentPersonality: string
      relationshipChanges: string[]
      changes: Array<{ pageNumber: number; description: string; timestamp: number }>
    }>
    // drawing トリガー用
    referenceImageBase64?: string
    originalDescription?: string
  }

  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { bookId, bookTitle, keyword, childUtterance, currentPageIndex, pages: rawPages, trigger, characterStates, referenceImageBase64, originalDescription } = body

  if (!bookId || !bookTitle || !keyword || currentPageIndex == null || !rawPages || !trigger) {
    const missing = [
      !bookId && 'bookId',
      !bookTitle && 'bookTitle',
      !keyword && 'keyword',
      currentPageIndex == null && 'currentPageIndex',
      !rawPages && 'pages',
      !trigger && 'trigger',
    ].filter(Boolean)
    return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // クライアントはillustrationを除外して送信するため、デフォルト値で補完
  const pages: StoryPage[] = rawPages.map((p) => ({
    ...p,
    illustration: p.illustration || '',
    alt: p.alt || '',
  }))

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
      }

      try {
        // Step 1: テキスト改変
        const result = await modifyCurrentPage({
          bookTitle,
          keyword,
          childUtterance,
          currentPageIndex,
          pages,
          trigger,
          apiKey,
          characterStates,
        })

        // テキスト結果を即座に送信（orchestrate を待たない）
        send({
          type: 'text',
          modifiedText: result.modifiedText,
          targetPageIndex: result.targetPageIndex,
          modification: result.modification,
        })

        // Step 2: orchestrate と 画像生成を並列実行
        const targetPage = pages[result.targetPageIndex]
        const previousPages = pages
          .slice(0, result.targetPageIndex)
          .map((p) => ({
            pageNumber: p.pageNumber || p.id,
            currentText: p.currentText || p.text,
          }))

        // 画像プロンプトを先に構築（orchestrate の結果を待たずに開始）
        const imagePrompt = trigger === 'drawing' && referenceImageBase64
          ? buildImageEditPrompt({
              originalDescription: originalDescription || targetPage?.alt || '',
              keyword,
              modifiedText: result.modifiedText,
            })
          : buildImagePrompt(result.modifiedText, keyword)

        const [orchResult, imageResult] = await Promise.allSettled([
          // オーケストレーション
          orchestrate({
            bookId,
            bookTitle,
            keyword,
            childUtterance,
            targetPage,
            modifiedText: result.modifiedText,
            previousPages,
            apiKey,
            characterStates,
          }),
          // 画像生成（並列）
          generateImage(imagePrompt, apiKey, referenceImageBase64).catch((error) => {
            console.warn('[modify-stream] Image generation failed:', error)
            return null
          }),
        ])

        // Step 3: orchestration 結果を送信
        if (orchResult.status === 'fulfilled') {
          const orch = orchResult.value
          // 整合性チェックでテキストが修正された場合は差分を送信
          const textCorrected = !orch.approved && orch.modifiedText !== result.modifiedText
          send({
            type: 'orchestration',
            approved: orch.approved,
            modifiedText: orch.modifiedText,
            textCorrected,
            characterReactions: orch.characterReactions,
            characterStateUpdates: orch.characterStateUpdates,
            modification: textCorrected ? {
              ...result.modification,
              afterText: orch.modifiedText,
            } : result.modification,
          })
        } else {
          console.error('[modify-stream] Orchestration failed:', orchResult.reason)
          send({
            type: 'orchestration',
            approved: true,
            modifiedText: result.modifiedText,
            textCorrected: false,
            characterReactions: [],
            characterStateUpdates: [],
            modification: result.modification,
          })
        }

        // Step 4: 画像結果を送信
        if (imageResult.status === 'fulfilled' && imageResult.value) {
          send({
            type: 'image',
            imageBase64: imageResult.value.imageBase64,
            mimeType: imageResult.value.mimeType,
            model: imageResult.value.model,
          })
        } else {
          send({
            type: 'image_failed',
            error: imageResult.status === 'rejected' ? 'Image generation failed' : 'No image generated',
          })
        }

        send({ type: 'done' })
      } catch (error) {
        console.error('[modify-stream] Error:', error)
        send({
          type: 'error',
          error: 'Modification failed',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    },
  })
}
