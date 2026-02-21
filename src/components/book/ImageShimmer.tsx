'use client'

interface ImageShimmerProps {
  previousIllustration?: string
}

const sparkles = [
  { emoji: '✨', left: '15%', delay: '0s', duration: '2.5s' },
  { emoji: '⭐', left: '45%', delay: '0.4s', duration: '3s' },
  { emoji: '🌟', left: '75%', delay: '0.8s', duration: '2.8s' },
  { emoji: '✨', left: '30%', delay: '1.2s', duration: '2.6s' },
  { emoji: '⭐', left: '60%', delay: '1.6s', duration: '3.2s' },
  { emoji: '🌟', left: '85%', delay: '2.0s', duration: '2.4s' },
]

export function ImageShimmer({ previousIllustration }: ImageShimmerProps) {
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

      {/* 浮遊キラキラ絵文字 */}
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute text-lg sm:text-xl pointer-events-none"
          style={{
            left: s.left,
            top: `${30 + (i % 3) * 20}%`,
            animation: `float-sparkle ${s.duration} ease-in-out ${s.delay} infinite`,
          }}
        >
          {s.emoji}
        </span>
      ))}

      {/* メッセージ */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <span className="rounded-full bg-background/80 px-4 py-1.5 font-serif text-xs text-[var(--storybook-brown)] shadow-sm sm:text-sm">
          えを かいているよ...
        </span>
      </div>
    </div>
  )
}
