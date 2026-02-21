"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CoverPreview } from "./CoverPreview"
import { saveBook } from "@/lib/data/saved-books"
import { useStoryStore } from "@/stores/story-store"
import { BookOpen, Sparkles, Wand2 } from "lucide-react"
import { buildCoverImagePrompt } from "@/lib/gemini/prompts"
import type { Story, FrameStyle } from "@/lib/types"

interface CoverCreatorProps {
  story: Story
}

const BG_COLORS = [
  { value: "#f8e8d0", label: "クリーム" },
  { value: "#e8d5d5", label: "ピンク" },
  { value: "#d5e0e8", label: "そら" },
  { value: "#d8e8d5", label: "みどり" },
]

const FRAME_STYLES: { value: FrameStyle; label: string }[] = [
  { value: "stars", label: "ほし" },
  { value: "flowers", label: "おはな" },
  { value: "ribbon", label: "リボン" },
  { value: "simple", label: "シンプル" },
]

export function CoverCreator({ story }: CoverCreatorProps) {
  const router = useRouter()
  const { storySessionId, pages, modifications } = useStoryStore()
  const [title, setTitle] = useState(story.title)
  const [authorName, setAuthorName] = useState("")
  const [bgColor, setBgColor] = useState(BG_COLORS[0].value)
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("stars")
  const [isSaving, setIsSaving] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [generatedCoverImage, setGeneratedCoverImage] = useState<string | null>(null)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)

  // Fade in on mount
  useState(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  })

  const handleGenerateCover = useCallback(async () => {
    setIsGeneratingCover(true)
    try {
      const storyPages = pages.length > 0 ? pages : story.pages
      const storySummary = storyPages
        .filter((p) => (p.pageNumber ?? 0) > 0)
        .map((p) => p.currentText || p.text)
        .join(" ")

      const sceneDescription = buildCoverImagePrompt({
        title: title.trim() || story.title,
        storyId: story.id,
        storySummary,
      })

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneDescription }),
      })

      if (!res.ok) {
        console.error("[CoverCreator] Cover generation failed:", res.status)
        return
      }

      const { imageBase64, mimeType } = await res.json()
      setGeneratedCoverImage(`data:${mimeType};base64,${imageBase64}`)
    } catch (err) {
      console.error("[CoverCreator] Cover generation error:", err)
    } finally {
      setIsGeneratingCover(false)
    }
  }, [pages, story, title])

  const handleSave = useCallback(async () => {
    if (!authorName.trim()) return
    setIsSaving(true)

    const finalTitle = title.trim() || story.title
    const finalAuthor = authorName.trim()

    const book = {
      id: `book-${Date.now()}`,
      storyId: story.id,
      title: finalTitle,
      authorName: finalAuthor,
      coverImage: generatedCoverImage || story.coverImage,
      bgColor,
      frameStyle,
      createdAt: new Date().toISOString(),
    }

    // localStorage に保存（/share/[id] ページ用）
    saveBook(book)

    // Firestore に保存（/library ページ用）
    // Zustand の pages が空の場合は story.pages（マスターデータ）をフォールバック
    const storyPages = pages.length > 0 ? pages : story.pages
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: storySessionId || book.id,
          bookId: story.id,
          pages: storyPages,
          modifications,
          title: finalTitle,
          authorName: finalAuthor,
          bgColor,
          frameStyle,
        }),
      })
      if (!res.ok) {
        console.warn("[CoverCreator] Firestore save failed:", res.status)
      }
    } catch (err) {
      console.warn("[CoverCreator] Firestore save error:", err)
    }

    setTimeout(() => {
      router.push(`/share/${book.id}`)
    }, 600)
  }, [authorName, bgColor, frameStyle, router, story, title, storySessionId, pages, modifications, generatedCoverImage])

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-center px-4 pb-2 pt-6">
        <div
          className={`flex items-center gap-2 transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-serif text-lg text-foreground md:text-xl">
            じぶんだけの ひょうしを つくろう
          </h1>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-4 py-3 md:flex-row md:justify-center md:gap-16 md:py-12">
        {/* Live preview */}
        <div
          className={`transition-all delay-200 duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <CoverPreview
            title={title}
            authorName={authorName}
            coverImage={generatedCoverImage || story.coverImage}
            bgColor={bgColor}
            frameStyle={frameStyle}
          />
        </div>

        {/* Controls */}
        <div
          className={`flex w-full max-w-sm flex-col gap-6 transition-all delay-400 duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          {/* Title input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="font-serif text-sm text-muted-foreground">
              タイトル
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
              placeholder={story.title}
              className="rounded-xl border-2 border-border bg-card px-4 py-3 font-serif text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
            />
          </div>

          {/* Generate cover image button */}
          <button
            onClick={handleGenerateCover}
            disabled={isGeneratingCover}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 font-serif text-sm text-primary transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50"
          >
            {isGeneratingCover ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                ひょうしの えを つくっています...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                ひょうしの えを つくる
              </>
            )}
          </button>

          {/* Author name input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="author" className="font-serif text-sm text-muted-foreground">
              さくしゃの なまえ
            </label>
            <input
              id="author"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={15}
              placeholder="なまえを いれてね"
              className="rounded-xl border-2 border-border bg-card px-4 py-3 font-serif text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
            />
          </div>

          {/* Background color */}
          <div className="flex flex-col gap-2">
            <span className="font-serif text-sm text-muted-foreground">いろを えらぶ</span>
            <div className="flex gap-3">
              {BG_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setBgColor(color.value)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                    bgColor === color.value
                      ? "scale-110 border-primary shadow-md"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={color.label}
                  title={color.label}
                >
                  {bgColor === color.value && (
                    <div className="h-2.5 w-2.5 rounded-full bg-foreground/40" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Frame style */}
          <div className="flex flex-col gap-2">
            <span className="font-serif text-sm text-muted-foreground">かざりを えらぶ</span>
            <div className="flex flex-wrap gap-2">
              {FRAME_STYLES.map((frame) => (
                <button
                  key={frame.value}
                  onClick={() => setFrameStyle(frame.value)}
                  className={`rounded-full border-2 px-4 py-2 font-serif text-sm transition-all ${
                    frameStyle === frame.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {frame.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!authorName.trim() || isSaving}
            className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-serif text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            <BookOpen className="h-5 w-5" />
            {isSaving ? "ほぞんしています..." : "ほぞんする"}
          </button>

          {!authorName.trim() && (
            <p className="text-center font-serif text-xs text-muted-foreground">
              なまえを いれると ほぞんできるよ
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
