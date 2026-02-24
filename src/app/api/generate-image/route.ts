import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini/image-generator'
import { buildImagePrompt, buildCoverImagePrompt } from '@/lib/gemini/prompts'

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
    const { sceneDescription, keyword, referenceImageBase64, isCover, title, storyId, storySummary } = body

    if (!sceneDescription) {
      return NextResponse.json(
        { error: 'sceneDescription is required' },
        { status: 400 }
      )
    }

    // カバー画像の場合は表紙専用プロンプトを使用
    const prompt = isCover && title && storyId
      ? buildCoverImagePrompt({ title, storyId, storySummary: storySummary || sceneDescription })
      : buildImagePrompt(sceneDescription, keyword)
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
