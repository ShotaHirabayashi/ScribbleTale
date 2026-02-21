"use client"

import Image from "next/image"
import type { SavedBook } from "@/lib/types"

interface SharePreviewCardProps {
  book: SavedBook
}

export function SharePreviewCard({ book }: SharePreviewCardProps) {
  const date = new Date(book.createdAt)
  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`

  return (
    <div className="mx-auto w-72 md:w-80">
      {/* Polaroid-style card */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-xl">
        {/* Inner frame with bg color */}
        <div
          className="relative mx-4 mt-4 aspect-[3/4] overflow-hidden rounded-xl"
          style={{ backgroundColor: book.bgColor }}
        >
          {/* Cover image */}
          <div className="relative mx-auto mt-4 aspect-square w-4/5 overflow-hidden rounded-lg shadow-md">
            <Image
              src={book.coverImage}
              alt={`${book.title}の表紙`}
              fill
              className="object-cover"
            />
          </div>

          {/* Title area */}
          <div className="mt-3 px-4 text-center">
            <h2 className="font-serif text-base font-bold leading-snug text-foreground md:text-lg">
              {book.title}
            </h2>
            <p className="mt-1 font-serif text-xs text-muted-foreground">
              さく: {book.authorName}
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

        {/* Bottom strip */}
        <div className="flex items-center justify-between px-5 py-3">
          <p className="font-serif text-xs text-muted-foreground">{dateStr}</p>
          <p className="font-serif text-xs font-bold text-primary">ScribbleTale</p>
        </div>
      </div>

      {/* Tape decoration */}
      <div className="mx-auto -mt-1 h-6 w-16 rounded-sm bg-amber-100/60 shadow-sm" aria-hidden="true" />
    </div>
  )
}
