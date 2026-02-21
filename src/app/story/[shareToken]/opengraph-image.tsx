import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generateModificationHighlights } from '@/lib/story/modification-summary'

export const runtime = 'nodejs'
export const alt = 'ScribbleTale - みんなの えほん'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const COVER_IMAGES: Record<string, string> = {
  momotaro: 'momotaro-cover.jpg',
  akazukin: 'akazukin-cover.jpg',
}

type Params = Promise<{ shareToken: string }>

export default async function OGImage({ params }: { params: Params }) {
  const { shareToken } = await params

  let storyTitle = 'みんなの えほん'
  let bookId: string | null = null
  let highlights: string[] = []

  try {
    const { getStoryByShareToken } = await import('@/lib/firebase/firestore')
    const storyData = await getStoryByShareToken(shareToken)
    if (storyData) {
      bookId = storyData.bookId
      storyTitle = bookId === 'momotaro' ? 'ももたろう' : 'あかずきん'
      highlights = generateModificationHighlights(storyData.modifications, 3)
    }
  } catch {
    // Firebase未設定の場合はデフォルト表示
  }

  // カバー画像をBase64エンコード
  let coverBase64: string | null = null
  if (bookId && COVER_IMAGES[bookId]) {
    try {
      const imageData = await readFile(
        join(process.cwd(), 'public', 'images', COVER_IMAGES[bookId])
      )
      coverBase64 = `data:image/jpeg;base64,${imageData.toString('base64')}`
    } catch {
      // 画像読み込み失敗時はnullのまま
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#f5e6d3',
        }}
      >
        {/* 背景ドットパターン */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              'radial-gradient(circle, #c97b4b 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* 左: カバー画像 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '460px',
            height: '100%',
            padding: '40px',
          }}
        >
          {coverBase64 ? (
            <img
              src={coverBase64}
              alt=""
              width={380}
              height={480}
              style={{
                borderRadius: '16px',
                objectFit: 'cover',
                boxShadow: '0 8px 32px rgba(61, 43, 31, 0.25)',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '380px',
                height: '480px',
                borderRadius: '16px',
                backgroundColor: '#e8d5c0',
                color: '#8b7355',
                fontSize: 48,
              }}
            >
              {storyTitle}
            </div>
          )}
        </div>

        {/* 右: テキスト */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '40px 48px 40px 0',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#8b7355',
              letterSpacing: '0.08em',
            }}
          >
            ScribbleTale
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#3d2b1f',
              lineHeight: 1.2,
            }}
          >
            {storyTitle}
          </div>

          {/* 区切り線 */}
          <div
            style={{
              display: 'flex',
              width: '80px',
              height: '3px',
              backgroundColor: '#c97b4b',
              marginTop: '4px',
              marginBottom: '8px',
            }}
          />

          {highlights.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {highlights.map((text, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: 22,
                    color: '#4a3728',
                    lineHeight: 1.4,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#c97b4b',
                      flexShrink: 0,
                    }}
                  />
                  {text}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: 22,
                color: '#6b4f3a',
                lineHeight: 1.5,
              }}
            >
              AIと こどもが いっしょに つくった えほん
            </div>
          )}

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '16px',
              padding: '10px 28px',
              backgroundColor: '#c97b4b',
              borderRadius: '9999px',
              color: 'white',
              fontSize: 20,
              fontWeight: 'bold',
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
