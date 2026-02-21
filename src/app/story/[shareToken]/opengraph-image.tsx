import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ScribbleTale - みんなの えほん'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Params = Promise<{ shareToken: string }>

export default async function OGImage({ params }: { params: Params }) {
  const { shareToken } = await params

  // Firestoreからストーリーデータ取得を試行
  let storyTitle = 'みんなの えほん'
  let bookId: string | null = null

  try {
    const { getStoryByShareToken } = await import('@/lib/firebase/firestore')
    const storyData = await getStoryByShareToken(shareToken)
    if (storyData) {
      bookId = storyData.bookId
      storyTitle = bookId === 'momotaro' ? 'ももたろう' : 'あかずきん'
    }
  } catch {
    // Firebase未設定の場合はデフォルト表示
  }

  const modifiedCount = 0 // Edge Runtimeでは簡易表示

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f5e6d3',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 背景パターン */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle, #c97b4b 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* ロゴ */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#3d2b1f',
              letterSpacing: '0.05em',
            }}
          >
            ScribbleTale
          </div>

          {/* ストーリータイトル */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#3d2b1f',
            }}
          >
            {storyTitle}
          </div>

          {/* サブテキスト */}
          <div
            style={{
              fontSize: 28,
              color: '#6b4f3a',
            }}
          >
            AIと こどもが いっしょに つくった えほん
          </div>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '12px 32px',
              backgroundColor: '#c97b4b',
              borderRadius: '9999px',
              color: 'white',
              fontSize: 24,
            }}
          >
            よんでみよう
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
