'use client'

interface ImageShimmerProps {
  previousIllustration?: string
}

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

      {/* メッセージ */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <span className="rounded-full bg-background/80 px-4 py-1.5 font-serif text-xs text-[var(--storybook-brown)] shadow-sm sm:text-sm">
          えを かいているよ...
        </span>
      </div>
    </div>
  )
}
