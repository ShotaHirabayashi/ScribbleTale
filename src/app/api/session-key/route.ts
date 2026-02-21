import { NextResponse } from 'next/server'

/**
 * WebSocket接続（Live API / Lyria RealTime）用のAPIキーを提供する。
 *
 * NEXT_PUBLIC_ プレフィックスを使わずにサーバーサイドから取得することで、
 * クライアントバンドルへのハードコード露出を防ぐ。
 *
 * NOTE: 本番環境では短寿命のアクセストークンやプロキシに切り替えること。
 */
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json({ apiKey })
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve session key' },
      { status: 500 }
    )
  }
}
