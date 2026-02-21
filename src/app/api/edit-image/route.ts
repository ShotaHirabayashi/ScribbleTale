import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini/image-generator'
import { buildImageEditPrompt } from '@/lib/gemini/prompts'

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
    const { originalDescription, keyword, modifiedText, referenceImageBase64 } = body

    if (!originalDescription || !keyword || !modifiedText) {
      return NextResponse.json(
        { error: 'originalDescription, keyword, and modifiedText are required' },
        { status: 400 }
      )
    }

    const prompt = buildImageEditPrompt({
      originalDescription,
      keyword,
      modifiedText,
    })

    const result = await generateImage(prompt, apiKey, referenceImageBase64)

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      model: result.model,
    })
  } catch (error) {
    console.error('[edit-image] Error:', error)
    return NextResponse.json(
      { error: 'Image editing failed' },
      { status: 500 }
    )
  }
}
