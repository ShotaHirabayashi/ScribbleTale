"use client"

import Image from "next/image"
import type { FrameStyle } from "@/lib/types"

interface CoverPreviewProps {
  title: string
  authorName: string
  coverImage: string
  bgColor: string
  frameStyle: FrameStyle
}

export function FrameDecoration({ style }: { style: FrameStyle }) {
  const base = "absolute pointer-events-none"

  switch (style) {
    case "stars":
      return (
        <>
          <svg className={`${base} -left-2 -top-2 h-10 w-10 text-amber-400/70`} viewBox="0 0 40 40" fill="currentColor">
            <path d="M20 2l4.5 9.1 10 1.5-7.2 7 1.7 10L20 25l-9 4.6 1.7-10-7.2-7 10-1.5z" />
          </svg>
          <svg className={`${base} -right-2 -top-2 h-8 w-8 text-amber-300/60`} viewBox="0 0 40 40" fill="currentColor">
            <path d="M20 2l4.5 9.1 10 1.5-7.2 7 1.7 10L20 25l-9 4.6 1.7-10-7.2-7 10-1.5z" />
          </svg>
          <svg className={`${base} -bottom-1 -right-1 h-7 w-7 text-amber-400/50`} viewBox="0 0 40 40" fill="currentColor">
            <path d="M20 2l4.5 9.1 10 1.5-7.2 7 1.7 10L20 25l-9 4.6 1.7-10-7.2-7 10-1.5z" />
          </svg>
          <svg className={`${base} -bottom-2 -left-1 h-6 w-6 text-amber-300/40`} viewBox="0 0 40 40" fill="currentColor">
            <path d="M20 2l4.5 9.1 10 1.5-7.2 7 1.7 10L20 25l-9 4.6 1.7-10-7.2-7 10-1.5z" />
          </svg>
        </>
      )
    case "flowers":
      return (
        <>
          {["-top-3 -left-3", "-top-3 -right-3", "-bottom-3 -left-3", "-bottom-3 -right-3"].map((pos, i) => (
            <svg key={i} className={`${base} ${pos} h-10 w-10`} viewBox="0 0 40 40">
              {[0, 72, 144, 216, 288].map((r) => (
                <ellipse key={r} cx="20" cy="10" rx="5" ry="8" fill="oklch(0.80 0.12 350 / 0.5)" transform={`rotate(${r} 20 20)`} />
              ))}
              <circle cx="20" cy="20" r="4" fill="oklch(0.85 0.15 80 / 0.7)" />
            </svg>
          ))}
        </>
      )
    case "ribbon":
      return (
        <>
          <div className={`${base} inset-x-4 -top-1.5 h-3 rounded-full bg-storybook-red/20`} />
          <div className={`${base} inset-x-4 -bottom-1.5 h-3 rounded-full bg-storybook-red/20`} />
          <div className={`${base} inset-y-4 -left-1.5 w-3 rounded-full bg-storybook-red/20`} />
          <div className={`${base} inset-y-4 -right-1.5 w-3 rounded-full bg-storybook-red/20`} />
        </>
      )
    case "simple":
    default:
      return (
        <div className={`${base} inset-3 rounded-xl border-2 border-dashed border-foreground/10`} />
      )
  }
}

export function CoverPreview({ title, authorName, coverImage, bgColor, frameStyle }: CoverPreviewProps) {
  return (
    <div
      className="relative mx-auto aspect-[3/4] w-48 overflow-hidden rounded-2xl shadow-xl transition-all duration-500 md:w-64 lg:w-72"
      style={{ backgroundColor: bgColor }}
    >
      <FrameDecoration style={frameStyle} />

      {/* Cover image */}
      <div className="relative mx-auto mt-6 aspect-square w-4/5 overflow-hidden rounded-xl shadow-md">
        <Image
          src={coverImage}
          alt="表紙イラスト"
          fill
          className="object-cover"
          {...(coverImage.startsWith("data:") ? { unoptimized: true } : {})}
        />
      </div>

      {/* Title */}
      <div className="mt-4 px-4 text-center">
        <h3 className="font-serif text-lg font-bold leading-snug text-foreground md:text-xl">
          {title || "タイトルを いれてね"}
        </h3>
      </div>

      {/* Author */}
      <div className="mt-2 px-4 text-center">
        <p className="font-serif text-xs text-muted-foreground md:text-sm">
          さくしゃ: {authorName || "なまえを いれてね"}
        </p>
      </div>

      {/* Paper texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
