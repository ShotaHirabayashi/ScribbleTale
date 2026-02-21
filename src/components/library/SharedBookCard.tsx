"use client"

import Image from "next/image"
import Link from "next/link"
import type { StoryPage, Modification } from "@/lib/types"

const BOOK_TITLES: Record<string, string> = {
  momotaro: "ももたろう",
  akazukin: "あかずきん",
}

const BOOK_COLORS: Record<string, string> = {
  momotaro: "#f8e8d0",
  akazukin: "#e8d5d5",
}

interface SharedBookCardProps {
  story: {
    id: string
    bookId: string
    shareToken: string
    pages: StoryPage[]
    modifications: Modification[]
    updatedAt: unknown
    title?: string
    authorName?: string
    bgColor?: string
    frameStyle?: string
  }
  index: number
}

export function SharedBookCard({ story, index }: SharedBookCardProps) {
  const title = story.title || BOOK_TITLES[story.bookId] || story.bookId
  const bgColor = story.bgColor || BOOK_COLORS[story.bookId] || "#f0ead6"

  // カバー画像: 1ページ目（カバー）のillustration
  const coverImage = story.pages[0]?.illustration || `/images/${story.bookId}-cover.jpg`

  // 改変数
  const modCount = story.modifications?.length ?? 0

  // 日付
  let dateStr = ""
  if (story.updatedAt) {
    const ts = story.updatedAt as { seconds?: number }
    if (ts.seconds) {
      const d = new Date(ts.seconds * 1000)
      dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    }
  }

  return (
    <div
      className="group relative animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      style={{ animationDelay: `${index * 120}ms`, animationDuration: "600ms" }}
    >
      <Link
        href={`/story/${story.shareToken}`}
        className="block overflow-hidden rounded-2xl border-2 border-border bg-card shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Cover */}
        <div
          className="relative aspect-[3/4] w-full overflow-hidden"
          style={{ backgroundColor: bgColor }}
        >
          <div className="relative mx-auto mt-4 aspect-square w-4/5 overflow-hidden rounded-lg">
            <Image
              src={coverImage}
              alt={`${title}の表紙`}
              fill
              className="object-cover"
            />
          </div>

          {/* Title overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-3 pb-3 pt-8">
            <h3 className="font-serif text-sm font-bold leading-snug text-white md:text-base">
              {title}
            </h3>
            {story.authorName && (
              <p className="mt-0.5 font-serif text-xs text-white/90">
                さく: {story.authorName}
              </p>
            )}
            {modCount > 0 && (
              <p className="mt-0.5 font-serif text-xs text-white/80">
                {modCount}かい かきかえたよ
              </p>
            )}
          </div>

          {/* Paper texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-15 mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="font-serif text-xs text-muted-foreground">{dateStr}</span>
        </div>
      </Link>
    </div>
  )
}
