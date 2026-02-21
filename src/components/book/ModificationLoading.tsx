'use client'

import { useMemo } from 'react'
import type { ModificationPhase } from '@/lib/types'

interface ModificationLoadingProps {
  phase: ModificationPhase
  keyword?: string
}

const keywordEmojiMap: Record<string, string[]> = {
  'ねこ': ['🐱', '🐾', '🐟'],
  'いぬ': ['🐶', '🐾', '🦴'],
  'りんご': ['🍎', '🌳', '🍏'],
  'うさぎ': ['🐰', '🥕', '🌸'],
  'くま': ['🐻', '🍯', '🌲'],
  'おはな': ['🌸', '🌷', '🌻'],
  'ほし': ['⭐', '🌙', '✨'],
  'にじ': ['🌈', '☀️', '🌧️'],
  'おかし': ['🍰', '🍩', '🍭'],
  'さかな': ['🐟', '🐠', '🌊'],
  'とり': ['🐦', '🌿', '☁️'],
  'ドラゴン': ['🐉', '🔥', '⚔️'],
  'りゅう': ['🐉', '🔥', '⚔️'],
}

const characterLines = [
  { emoji: '🐶', line: 'わくわく！かわるかな？' },
  { emoji: '🐵', line: 'うんうん、かんがえてるよ...' },
  { emoji: '🐦', line: 'どんなおはなしになるかな？' },
  { emoji: '🐱', line: 'たのしみだにゃ〜！' },
  { emoji: '🐻', line: 'もうすこしまってね！' },
]

function getEmojisForKeyword(keyword?: string): string[] {
  if (!keyword) return ['✨', '⭐', '🌟']
  for (const [key, emojis] of Object.entries(keywordEmojiMap)) {
    if (keyword.includes(key)) return emojis
  }
  return ['✨', '⭐', '🌟']
}

export function ModificationLoading({ phase, keyword }: ModificationLoadingProps) {
  if (phase === 'idle') return null

  const charLine = useMemo(() => {
    const idx = Math.floor(Math.random() * characterLines.length)
    return characterLines[idx]
  }, [])

  const floatingEmojis = useMemo(() => getEmojisForKeyword(keyword), [keyword])

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-6 flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-background/95 px-8 py-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500 sm:max-w-sm sm:px-10 sm:py-10">
        {/* 本アイコン */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
            <span className="text-3xl sm:text-4xl" style={{ animation: 'bounce 1s ease-in-out infinite' }}>
              📖
            </span>
          </div>
        </div>

        {/* プログレスステップ */}
        <div className="flex items-center gap-3 font-serif text-sm sm:text-base">
          <span className="text-[var(--storybook-brown)]">おはなし ✨</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground/60">え ⏳</span>
        </div>

        {/* キャラクターセリフ吹き出し */}
        <div className="flex items-start gap-2 rounded-2xl bg-primary/5 px-4 py-2.5">
          <span className="text-xl shrink-0">{charLine.emoji}</span>
          <p className="font-serif text-xs text-[var(--storybook-brown)] sm:text-sm">
            「{charLine.line}」
          </p>
        </div>

        {/* 浮遊キーワード絵文字 */}
        <div className="relative flex w-full justify-center gap-6 h-8">
          {floatingEmojis.map((emoji, i) => (
            <span
              key={i}
              className="text-lg sm:text-xl"
              style={{
                animation: `float-sparkle ${2.5 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* バウンスドット */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-primary/60"
              style={{
                animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
