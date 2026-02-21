import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { DRAWING_RECOGNITION_PROMPT } from '@/lib/gemini/prompts'

const MODEL = 'gemini-3-flash-preview'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('[recognize-drawing] GEMINI_API_KEY is not configured')
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { imageBase64, mimeType = 'image/png' } = body

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 is required' },
        { status: 400 }
      )
    }

    const genai = new GoogleGenAI({ apiKey })

    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType,
              },
            },
            { text: DRAWING_RECOGNITION_PROMPT },
          ],
        },
      ],
    })

    // 安全フィルタでブロックされた場合のチェック
    const candidate = response.candidates?.[0]
    if (!candidate || candidate.finishReason === 'SAFETY') {
      console.warn('[recognize-drawing] Blocked by safety filter:', JSON.stringify(response.candidates))
      // フォールバック: 安全フィルタに引っかかった場合はデフォルトキーワードを返す
      return NextResponse.json({
        keyword: 'おえかき',
        confidence: 0.5,
        description: '子どもの落書き',
      })
    }

    const text = candidate.content?.parts?.[0]?.text
    if (!text) {
      console.warn('[recognize-drawing] No text in response:', JSON.stringify(response))
      return NextResponse.json({
        keyword: 'おえかき',
        confidence: 0.3,
        description: '認識できませんでした',
      })
    }

    // JSONを抽出（コードブロックで囲まれている場合にも対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[recognize-drawing] Invalid response format, raw:', text)
      // パースできなくても、テキストからキーワードを推測
      return NextResponse.json({
        keyword: text.trim().slice(0, 20) || 'おえかき',
        confidence: 0.4,
        description: text.trim(),
      })
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[recognize-drawing] Error:', errMsg, error)
    return NextResponse.json(
      { error: `Drawing recognition failed: ${errMsg}` },
      { status: 500 }
    )
  }
}
