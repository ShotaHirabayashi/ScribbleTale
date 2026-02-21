"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface BookCardProps {
  bookId: string
  title: string
  subtitle: string
  coverImage: string
  accentColor: string
  description: string
  pageCount: number
  href?: string
}

export function BookCard({
  title,
  subtitle,
  coverImage,
  accentColor,
  description,
  pageCount,
  href,
}: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const Wrapper = href ? Link : 'button'
  const wrapperProps = href ? { href } : {}

  return (
    <Wrapper
      {...(wrapperProps as Record<string, string>)}
      className="group relative flex w-full max-w-sm flex-col items-center text-left transition-transform duration-500 ease-out hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${title}をよむ`}
    >
      {/* Book cover with 3D effect */}
      <div className="relative w-full" style={{ perspective: "800px" }}>
        <div
          className="relative overflow-hidden rounded-lg transition-transform duration-500 ease-out"
          style={{
            transform: isHovered ? "rotateY(-6deg) rotateX(2deg)" : "rotateY(0deg)",
            transformStyle: "preserve-3d",
            boxShadow: isHovered
              ? "8px 8px 24px rgba(0,0,0,0.15), 2px 2px 8px rgba(0,0,0,0.1)"
              : "4px 4px 12px rgba(0,0,0,0.1), 1px 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          {/* Book spine effect */}
          <div
            className="absolute left-0 top-0 z-10 h-full w-3"
            style={{
              background: `linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.05), transparent)`,
            }}
            aria-hidden="true"
          />

          {/* Cover image */}
          <div className="aspect-[3/4] w-full overflow-hidden">
            <Image
              src={coverImage}
              alt={`${title}の表紙`}
              width={400}
              height={533}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              priority
            />
          </div>

          {/* Color overlay at bottom */}
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-5 pb-5 pt-20"
            style={{
              background: `linear-gradient(to top, ${accentColor}ee 0%, ${accentColor}bb 40%, transparent 100%)`,
            }}
          >
            <span className="font-serif text-2xl font-bold tracking-wide text-card md:text-3xl">
              {title}
            </span>
            <span className="mt-1 text-sm text-card/80">
              {subtitle}
            </span>
          </div>

          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(ellipse at center, ${accentColor}20 0%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
        </div>

        {/* Page edges (side) */}
        <div
          className="absolute right-0 top-2 -z-10 h-[calc(100%-16px)] w-2 rounded-r-sm"
          style={{
            background: "repeating-linear-gradient(to bottom, #f5e6d3 0px, #efe0d0 1px, #f5e6d3 2px)",
            boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
            transform: "translateX(4px)",
          }}
          aria-hidden="true"
        />
        {/* Page edges (bottom) */}
        <div
          className="absolute bottom-0 left-2 -z-10 h-2 w-[calc(100%-16px)] rounded-b-sm"
          style={{
            background: "repeating-linear-gradient(to right, #f5e6d3 0px, #efe0d0 1px, #f5e6d3 2px)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            transform: "translateY(4px)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Book info below */}
      <div className="mt-5 w-full px-2 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            {pageCount}ページ
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            こえ & おえかき
          </span>
        </div>
      </div>
    </Wrapper>
  )
}
