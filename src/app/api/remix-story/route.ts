import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { buildStoryRemixPrompt } from '@/lib/gemini/prompts'
import { CHILD_SAFE_SETTINGS } from '@/lib/gemini/safety'

const TEXT_MODEL = 'gemini-3-flash-preview'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }

  let body: {
    bookTitle: string
    remixPrompt: string
    pages: { pageNumber: number; pageRole?: string; text: string }[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bookTitle, remixPrompt, pages } = body

  if (!bookTitle || !remixPrompt || !pages || pages.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const genai = new GoogleGenAI({ apiKey })

    const prompt = buildStoryRemixPrompt({ bookTitle, remixPrompt, pages })

    const response = await genai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { safetySettings: CHILD_SAFE_SETTINGS },
    })

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    // JSON配列をパース（コードブロック除去）
    const jsonStr = rawText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    const remixedPages = JSON.parse(jsonStr) as { pageNumber: number; text: string }[]

    // \\n → 改行 正規化
    const normalizedPages = remixedPages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text.replace(/\\n/g, '\n'),
    }))

    return NextResponse.json({ remixedPages: normalizedPages })
  } catch (error) {
    console.error('[remix-story] Error:', error)
    return NextResponse.json(
      { error: 'Remix failed' },
      { status: 500 }
    )
  }
}
