"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export function BookshelfSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative px-4 py-12 md:py-16">
      <div
        className={`mx-auto max-w-md transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Link
          href="/library"
          className="group relative block overflow-hidden rounded-2xl border border-storybook-brown/20 bg-gradient-to-br from-storybook-peach/30 via-card to-storybook-sage/20 p-6 shadow-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:p-8"
        >
          {/* Decorative bookshelf illustration */}
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-storybook-brown/15 transition-transform duration-500 group-hover:scale-110 md:h-20 md:w-20">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-storybook-brown md:h-10 md:w-10"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                <path d="M8 7h6" />
                <path d="M8 11h4" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h2 className="font-serif text-xl font-bold text-foreground md:text-2xl">
              みんなの ほんだな
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              つくった えほんが ならんでいるよ。
              <br className="hidden sm:block" />
              いつでも よみかえせるよ。
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="mt-4 flex items-center justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-storybook-brown/10 px-4 py-1.5 font-serif text-xs font-bold text-storybook-brown transition-colors group-hover:bg-storybook-brown/20">
              ほんだなを みる
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </div>

          {/* Decorative sparkle */}
          <div className="pointer-events-none absolute -right-2 -top-2 text-storybook-peach/40 transition-opacity duration-500 group-hover:opacity-100 md:opacity-60" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
            </svg>
          </div>
        </Link>
      </div>
    </section>
  )
}
