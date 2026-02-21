import { NextRequest, NextResponse } from 'next/server'

/**
 * APIルートのレート制限 middleware
 *
 * IPベースの簡易レート制限。Vercel Edge Runtime対応。
 * - Gemini API呼び出しを伴う重いルート: 1分あたり10リクエスト
 * - 軽量ルート（session-key, share）: 1分あたり30リクエスト
 */

const HEAVY_ROUTES = ['/api/modify', '/api/regenerate', '/api/generate-image', '/api/edit-image', '/api/recognize-drawing']
const LIGHT_ROUTES = ['/api/session-key', '/api/share']

// デモ向けにゆるめの設定（本番ではHEAVY=10, LIGHT=30に下げること）
const HEAVY_LIMIT = 60
const LIGHT_LIMIT = 120
const WINDOW_MS = 60_000

// Edge Runtime ではグローバル変数はインスタンスごとに独立するが、
// 同一インスタンス内では有効なので簡易レート制限として機能する
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// 古いエントリを定期的にクリーンアップ（メモリリーク防止）
function cleanup() {
  const now = Date.now()
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // APIルート以外はスキップ
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const isHeavy = HEAVY_ROUTES.some((r) => pathname.startsWith(r))
  const isLight = LIGHT_ROUTES.some((r) => pathname.startsWith(r))

  if (!isHeavy && !isLight) {
    return NextResponse.next()
  }

  const limit = isHeavy ? HEAVY_LIMIT : LIGHT_LIMIT
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = `${ip}:${isHeavy ? 'heavy' : 'light'}`
  const now = Date.now()

  // 100エントリごとにクリーンアップ
  if (rateLimitMap.size > 100) {
    cleanup()
  }

  const entry = rateLimitMap.get(key)

  if (entry && now < entry.resetTime) {
    if (entry.count >= limit) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
          },
        }
      )
    }
    entry.count++
  } else {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
