import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { DRAWING_RECOGNITION_PROMPT } from '@/lib/gemini/prompts'
import { CHILD_SAFE_SETTINGS } from '@/lib/gemini/safety'

const MODEL = 'gemini-2.5-flash-lite-preview-06-17'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { imageBase64, mimeType = 'image/jpeg' } = body

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
      config: { safetySettings: CHILD_SAFE_SETTINGS },
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json(
        { error: 'No recognition result' },
        { status: 500 }
      )
    }

    // JSONを抽出（コードブロックで囲まれている場合にも対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Invalid response format', raw: text },
        { status: 500 }
      )
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (error) {
    console.error('[recognize-drawing] Error:', error)
    return NextResponse.json(
      { error: 'Drawing recognition failed' },
      { status: 500 }
    )
  }
}
