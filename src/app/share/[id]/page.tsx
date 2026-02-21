"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getSavedBookById, demoBooks } from "@/lib/data/saved-books"
import { SvgFilters } from "@/components/effects/SvgFilters"
import { PaperTexture } from "@/components/effects/PaperTexture"
import { SharePreviewCard } from "@/components/share/SharePreviewCard"
import { ShareButtons } from "@/components/share/ShareButtons"
import { BookOpen, Library } from "lucide-react"
import type { SavedBook } from "@/lib/types"

export default function SharePage() {
  const params = useParams<{ id: string }>()
  const [book, setBook] = useState<SavedBook | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const found = getSavedBookById(params.id)
    setBook(found ?? null)
    setLoaded(true)
  }, [params.id])

  if (!loaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="font-serif text-muted-foreground">よみこみちゅう...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4">
        <SvgFilters />
        <PaperTexture />
        <p className="font-serif text-lg text-foreground">このえほんは みつかりませんでした</p>
        <Link
          href="/library"
          className="rounded-full bg-primary px-6 py-3 font-serif text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-105"
        >
          ほんだなへ もどる
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <SvgFilters />
      <PaperTexture />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        <Link
          href="/library"
          className="flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 py-1.5 font-serif text-sm text-foreground transition-colors hover:bg-secondary"
          aria-label="ほんだなへ もどる"
        >
          <Library className="h-4 w-4" />
          <span className="hidden sm:inline">ほんだな</span>
        </Link>
        <p className="font-serif text-sm font-bold text-primary">ScribbleTale</p>
        <div className="w-16 sm:w-20" />
      </header>

      <main className="flex flex-col items-center gap-10 px-4 pb-20 pt-4 md:pt-8">
        {/* Preview card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <SharePreviewCard book={book} />
        </div>

        {/* Share buttons */}
        <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700" style={{ animationDelay: "200ms" }}>
          <ShareButtons title={book.title} />
        </div>

        {/* Actions */}
        <div
          className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700"
          style={{ animationDelay: "400ms" }}
        >
          <Link
            href={book.shareToken ? `/story/${book.shareToken}` : `/book/${book.storyId}`}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-serif text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
            この えほんを よむ
          </Link>

          <Link
            href="/library"
            className="font-serif text-sm text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
          >
            ほんだなに もどる
          </Link>
        </div>
      </main>
    </div>
  )
}
