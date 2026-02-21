import type { Metadata, Viewport } from 'next'
import { Zen_Maru_Gothic, Yomogi, Klee_One } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SoundProvider } from '@/components/audio/SoundProvider'
import './globals.css'

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-zen-maru-gothic',
  display: 'swap',
})

const yomogi = Yomogi({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-yomogi',
  display: 'swap',
})

const kleeOne = Klee_One({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-klee-one',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://scribble-tale.vercel.app'),
  title: 'ScribbleTale - おえかきで絵本がかわる',
  description: 'こどもの「らくがき」と「こえ」で絵本がリアルタイムにかわる、共創型インタラクティブ絵本アプリ',
  generator: 'v0.app',
  openGraph: {
    title: 'ScribbleTale - おえかきで絵本がかわる',
    description: 'こどもの「らくがき」と「こえ」で絵本がリアルタイムにかわる、共創型インタラクティブ絵本アプリ',
    url: 'https://scribble-tale.vercel.app',
    siteName: 'ScribbleTale',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScribbleTale - おえかきで絵本がかわる',
    description: 'こどもの「らくがき」と「こえ」で絵本がリアルタイムにかわる、共創型インタラクティブ絵本アプリ',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f5e6d3',
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${zenMaruGothic.variable} ${yomogi.variable} ${kleeOne.variable} font-sans antialiased`}>
        <SoundProvider>
          {children}
        </SoundProvider>
        <Analytics />
      </body>
    </html>
  )
}
