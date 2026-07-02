'use client'

import { useMemo, useState, useCallback } from 'react'

interface WaitingExperienceProps {
  previousIllustration?: string
  keyword?: string
}

const MAGIC_COLORS = [
  '#fcd34d', // 金
  '#f9a8d4', // ピンク
  '#7dd3fc', // 水色
  '#c4b5fd', // 薄紫
] as const

interface Particle {
  id: number
  left: number
  top: number
  color: string
  duration: number
  delay: number
}

/**
 * 魔法の粒子エフェクト
 *
 * 画像エリア全体に12個の光の粒がランダムに配置され、
 * float-magic アニメで上下にゆらゆら漂う。
 */
function MagicParticles() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: MAGIC_COLORS[Math.floor(Math.random() * MAGIC_COLORS.length)],
      duration: 2 + Math.random() * 2, // 2〜4秒
      delay: Math.random() * 2, // 0〜2秒
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animation: `float-magic ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

interface MagicButtonProps {
  onClick: () => void
  tapCount: number
}

/**
 * 魔法を強化するタップボタン
 *
 * タップするたびに周囲に4方向のスパークルが飛ぶ。
 */
function MagicButton({ onClick, tapCount }: MagicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="まほうをかける"
      className="relative flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400/80 shadow-lg transition-transform duration-150 active:scale-110"
    >
      <span className="text-3xl" aria-hidden>
        ✨
      </span>

      {/* タップごとに飛ぶスパークル（key に tapCount を含めて再生成） */}
      {tapCount > 0 &&
        [0, 1, 2, 3].map((i) => (
          <span
            key={`${tapCount}-${i}`}
            className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-yellow-200"
            style={
              {
                '--spark-rotate': `${i * 90}deg`,
                marginLeft: '-5px',
                marginTop: '-5px',
                boxShadow: '0 0 6px rgba(253,224,71,0.9)',
                animation: 'magic-spark-fly 0.6s ease-out forwards',
              } as React.CSSProperties
            }
          />
        ))}
    </button>
  )
}

/**
 * 画像生成待ち時間の「魔法をかけている」体験
 *
 * 魔法の絵筆が絵を描いているコンセプト。
 * 光の粒子が漂い、子どもはタップして魔法を強化できる。
 */
export function WaitingExperience({ previousIllustration, keyword }: WaitingExperienceProps) {
  const [tapCount, setTapCount] = useState(0)

  const handleTap = useCallback(() => {
    setTapCount((prev) => prev + 1)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 前の画像をぼかして薄く表示 */}
      {previousIllustration && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previousIllustration}
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-40 blur-sm"
        />
      )}

      {/* やわらかなクリーム色のベール */}
      <div className="absolute inset-0 bg-[var(--storybook-cream)]/60" />

      {/* 魔法演出本体 */}
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
        {/* 魔法の粒子エフェクト：画像コンテナ全体に漂う光の粒 */}
        <MagicParticles />

        {/* 中央メッセージ */}
        <div className="z-10 text-center">
          <p className="animate-pulse text-lg font-bold text-foreground/80">
            ✨ まほうで えを かいているよ...
          </p>
          {keyword && (
            <p className="mt-1 text-sm text-foreground/50">「{keyword}」のえ</p>
          )}
        </div>

        {/* タップして魔法を強化するボタン */}
        <div className="z-10 flex flex-col items-center gap-2">
          <MagicButton onClick={handleTap} tapCount={tapCount} />
          {tapCount > 0 && (
            <p className="text-sm font-bold text-foreground/70">
              {tapCount}かい まほうをかけたよ！
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
