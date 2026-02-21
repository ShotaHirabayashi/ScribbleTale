"use client"

import { useEffect, useState } from "react"
import { SvgFilters } from "@/components/effects/SvgFilters"
import { PaperTexture } from "@/components/effects/PaperTexture"
import { LibraryHeader } from "@/components/library/LibraryHeader"
import { SharedBookCard } from "@/components/library/SharedBookCard"
import { BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import type { StoryPage, Modification } from "@/lib/types"

interface SharedStoryItem {
  id: string
  bookId: string
  shareToken: string
  pages: StoryPage[]
  modifications: Modification[]
  updatedAt: unknown
  title?: string
  authorName?: string
  coverImage?: string
  bgColor?: string
  frameStyle?: string
}

export default function LibraryPage() {
  const [stories, setStories] = useState<SharedStoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // サーバーサイドAPI経由でFirestoreクエリ（クライアントSDKの接続問題を回避）
        const res = await fetch("/api/library")
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setStories(data.stories as SharedStoryItem[])
      } catch (err) {
        console.error("[library] Failed to load stories:", err)
        setError(err instanceof Error ? err.message : "読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    // 安全タイムアウト
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 15000)

    load().finally(() => clearTimeout(safetyTimeout))
  }, [])

  return (
    <div className="relative min-h-dvh bg-background">
      <SvgFilters />
      <PaperTexture />
      <LibraryHeader />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-4 md:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="font-serif text-sm text-muted-foreground">
              よみこみちゅう...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <p className="font-serif text-sm text-destructive">{error}</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-serif text-lg text-foreground">
                まだ えほんが ないよ
              </p>
              <p className="mt-2 font-serif text-sm text-muted-foreground">
                えほんを よんで ひょうしを つくると ここに ならぶよ
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {stories.map((story, index) => (
              <SharedBookCard key={story.id} story={story} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
