'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Star } from 'lucide-react'

interface WaitingExperienceProps {
  previousIllustration?: string
  keyword?: string
}

interface StarParticle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  collected: boolean
}

/**
 * 画像生成待ち時間のインタラクティブ体験
 *
 * ImageShimmerを拡張し、子どもが退屈しないよう星タップゲームを追加。
 * 星をタップするとキラキラエフェクトが出る。
 */
export function WaitingExperience({ previousIllustration, keyword }: WaitingExperienceProps) {
  const [stars, setStars] = useState<StarParticle[]>([])
  const [score, setScore] = useState(0)
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([])
  const nextIdRef = useRef(0)
  const sparkleIdRef = useRef(0)

  // 定期的に星を生成
  useEffect(() => {
    const interval = setInterval(() => {
      setStars((prev) => {
        // 最大8個まで
        if (prev.filter((s) => !s.collected).length >= 8) return prev
        const id = nextIdRef.current++
        return [
          ...prev.filter((s) => !s.collected),
          {
            id,
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 70,
            size: 20 + Math.random() * 16,
            delay: Math.random() * 0.5,
            collected: false,
          },
        ]
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  // スパークルを自動削除
  useEffect(() => {
    if (sparkles.length === 0) return
    const timer = setTimeout(() => {
      setSparkles((prev) => prev.slice(1))
    }, 600)
    return () => clearTimeout(timer)
  }, [sparkles])

  const handleStarTap = useCallback((starId: number, x: number, y: number) => {
    setStars((prev) =>
      prev.map((s) => (s.id === starId ? { ...s, collected: true } : s))
    )
    setScore((prev) => prev + 1)
    setSparkles((prev) => [...prev, { id: sparkleIdRef.current++, x, y }])
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 前の画像をぼかして薄く表示 */}
      {previousIllustration && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previousIllustration}
          alt=""
          className="absolute inset-0 h-full w-full object-contain blur-sm opacity-40"
        />
      )}

      {/* シマーグラデーション */}
      <div className="absolute inset-0 bg-[var(--storybook-cream)]/60" />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          animation: 'shimmer 2s ease-in-out infinite',
        }}
      />

      {/* 星タップゲーム */}
      {stars.map((star) =>
        star.collected ? null : (
          <button
            key={star.id}
            className="absolute animate-pulse cursor-pointer border-none bg-transparent p-0"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              transform: 'translate(-50%, -50%)',
              animation: `float-sparkle 2s ease-in-out ${star.delay}s infinite`,
            }}
            onClick={() => handleStarTap(star.id, star.x, star.y)}
          >
            <Star
              className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
              style={{ width: star.size, height: star.size }}
              fill="currentColor"
            />
          </button>
        )
      )}

      {/* タップ時のスパークルエフェクト */}
      {sparkles.map((sp) => (
        <div
          key={sp.id}
          className="pointer-events-none absolute"
          style={{
            left: `${sp.x}%`,
            top: `${sp.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-yellow-300"
              style={{
                animation: `sparkle-burst 0.6s ease-out forwards`,
                transform: `rotate(${i * 90}deg) translateY(-12px)`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      ))}

      {/* スコアとメッセージ */}
      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1.5">
        {score > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-yellow-100/90 px-3 py-1 shadow-sm">
            <Star className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" />
            <span className="font-serif text-xs font-bold text-yellow-700">{score}</span>
          </div>
        )}
        <span className="rounded-full bg-background/80 px-4 py-1.5 font-serif text-xs text-[var(--storybook-brown)] shadow-sm sm:text-sm">
          {keyword ? `「${keyword}」の えを かいているよ...` : 'えを かいているよ...'}
        </span>
      </div>

      {/* スパークルバーストアニメーション */}
      <style jsx>{`
        @keyframes sparkle-burst {
          0% {
            opacity: 1;
            transform: rotate(var(--rotate, 0deg)) translateY(0);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotate, 0deg)) translateY(-24px);
          }
        }
      `}</style>
    </div>
  )
}
