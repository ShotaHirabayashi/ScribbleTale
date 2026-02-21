import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { utterance, bookTitle, currentPageText } = await request.json()

    if (!utterance) {
      return NextResponse.json({ error: 'utterance is required' }, { status: 400 })
    }

    const prompt = `あなたは絵本「${bookTitle || 'えほん'}」の読み聞かせアシスタントです。

子どもが以下のように話しかけました:
「${utterance}」

現在のページのテキスト:
${currentPageText || '(なし)'}

子どもの発言から、物語の改変テーマとなるキーワードを**1語だけ**抽出してください。
必ず名詞1語（ひらがな）で返してください。文章や助詞は含めないでください。

良い例: りんご、うちゅう、ドラゴン、にじ、ロボット、おかあさん、おしろ
悪い例: りんごをつかわない、おかあさんにしてほしい、もっとたのしく

以下のJSON形式で回答してください（説明は不要です）:
{"keyword": "名詞1語（ひらがな）"}

もしキーワードが抽出できない場合（「おわり」「もういいよ」「つぎ」など終了の言葉の場合）は:
{"keyword": null}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    const text = response.text?.trim() || ''

    // JSON部分を抽出
    const jsonMatch = text.match(/\{[^}]+\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        keyword: parsed.keyword || null,
        utterance,
      })
    }

    return NextResponse.json({ keyword: null, utterance })
  } catch (error) {
    console.error('[extract-keyword] Error:', error)
    return NextResponse.json({ error: 'Keyword extraction failed' }, { status: 500 })
  }
}
