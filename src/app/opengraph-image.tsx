import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'ScribbleTale - おえかきで絵本がかわる'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  const imageData = await readFile(
    join(process.cwd(), 'public', 'images', 'hero-illustration.jpg')
  )
  const base64Image = `data:image/jpeg;base64,${imageData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#f5e6d3',
          position: 'relative',
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

        {/* 左: ヒーロー画像 */}
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
          <img
            src={base64Image}
            alt=""
            width={380}
            height={380}
            style={{
              borderRadius: '24px',
              objectFit: 'cover',
              boxShadow: '0 8px 32px rgba(61, 43, 31, 0.2)',
            }}
          />
        </div>

        {/* 右: テキスト */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '40px 48px 40px 0',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#3d2b1f',
              letterSpacing: '0.02em',
              lineHeight: 1.1,
            }}
          >
            ScribbleTale
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#6b4f3a',
              lineHeight: 1.5,
            }}
          >
            おえかきで えほんが かわる
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 20,
              color: '#8b7355',
              lineHeight: 1.6,
              marginTop: '8px',
            }}
          >
            <span>こどもの「らくがき」と「こえ」で</span>
            <span>絵本がリアルタイムにかわる</span>
          </div>
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
            あそんでみよう
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
