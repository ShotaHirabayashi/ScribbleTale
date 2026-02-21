"use client"

import Image from "next/image"
import Link from "next/link"
import { Share2 } from "lucide-react"
import type { SavedBook } from "@/lib/types"

interface SavedBookCardProps {
  book: SavedBook
  index: number
}

export function SavedBookCard({ book, index }: SavedBookCardProps) {
  const date = new Date(book.createdAt)
  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`

  return (
    <div
      className="group relative animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      style={{ animationDelay: `${index * 120}ms`, animationDuration: "600ms" }}
    >
      <Link
        href={`/share/${book.id}`}
        className="block overflow-hidden rounded-2xl border-2 border-border bg-card shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Cover */}
        <div
          className="relative aspect-[3/4] w-full overflow-hidden"
          style={{ backgroundColor: book.bgColor }}
        >
          <div className="relative mx-auto mt-4 aspect-square w-4/5 overflow-hidden rounded-lg">
            <Image
              src={book.coverImage}
              alt={`${book.title}の表紙`}
              fill
              className="object-cover"
            />
          </div>

          {/* Title overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-3 pb-3 pt-8">
            <h3 className="font-serif text-sm font-bold leading-snug text-white md:text-base">
              {book.title}
            </h3>
            <p className="mt-0.5 font-serif text-xs text-white/80">
              さくしゃ: {book.authorName}
            </p>
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
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Share2 className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    </div>
  )
}
