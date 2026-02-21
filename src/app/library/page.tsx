"use client"

import { useEffect, useState } from "react"
import { getSavedBooks } from "@/lib/data/saved-books"
import { SvgFilters } from "@/components/effects/SvgFilters"
import { PaperTexture } from "@/components/effects/PaperTexture"
import { LibraryHeader } from "@/components/library/LibraryHeader"
import { SavedBookCard } from "@/components/library/SavedBookCard"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import type { SavedBook } from "@/lib/types"

export default function LibraryPage() {
  const [books, setBooks] = useState<SavedBook[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setBooks(getSavedBooks())
    setLoaded(true)
  }, [])

  return (
    <div className="relative min-h-dvh bg-background">
      <SvgFilters />
      <PaperTexture />
      <LibraryHeader />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-4 md:px-8">
        {loaded && books.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-6 py-24">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-serif text-lg text-foreground">
                まだ えほんが ないよ
              </p>
              <p className="mt-2 font-serif text-sm text-muted-foreground">
                えほんを よんで、じぶんだけの ひょうしを つくってみよう
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-primary px-6 py-3 font-serif text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-105 hover:shadow-lg"
            >
              えほんを よみにいく
            </Link>
          </div>
        ) : (
          /* Book grid */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {books.map((book, index) => (
              <SavedBookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
