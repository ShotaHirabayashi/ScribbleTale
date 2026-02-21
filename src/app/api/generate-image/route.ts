import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini/image-generator'
import { buildImagePrompt } from '@/lib/gemini/prompts'

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
    const { sceneDescription, keyword, referenceImageBase64 } = body

    if (!sceneDescription) {
      return NextResponse.json(
        { error: 'sceneDescription is required' },
        { status: 400 }
      )
    }

    const prompt = buildImagePrompt(sceneDescription, keyword)
    const result = await generateImage(prompt, apiKey, referenceImageBase64)

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      model: result.model,
    })
  } catch (error) {
    console.error('[generate-image] Error:', error)
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 500 }
    )
  }
}
