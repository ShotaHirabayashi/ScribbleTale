"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 pb-8 pt-16 md:min-h-[60vh] md:pt-20">
      {/* Floating watercolor splashes - decorative */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl md:h-96 md:w-96"
        style={{ background: "var(--storybook-peach)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full opacity-15 blur-3xl md:h-80 md:w-80"
        style={{ background: "var(--storybook-sage)" }}
        aria-hidden="true"
      />

      {/* Hero illustration */}
      <div
        className={`relative mb-6 h-40 w-64 transition-all duration-1000 ease-out md:mb-8 md:h-56 md:w-80 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Image
          src="/images/hero-illustration.jpg"
          alt="魔法の絵本からキャラクターが飛び出すイラスト"
          fill
          className="rounded-2xl object-cover"
          style={{
            filter: "url(#watercolor-dissolve)",
            mixBlendMode: "multiply",
          }}
          priority
        />
        {/* Sparkle decorations */}
        <div className="absolute -right-3 -top-3 text-storybook-peach" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
          </svg>
        </div>
        <div className="absolute -bottom-2 -left-2 text-storybook-sage" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div
        className={`text-center transition-all delay-200 duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          <span className="text-primary">Scribble</span>
          <span className="text-storybook-brown">Tale</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-balance font-serif text-lg text-muted-foreground md:mt-4 md:text-xl">
          きみの「こえ」と「おえかき」で
          <br />
          えほんが まほうみたいに かわるよ
        </p>
      </div>

      {/* How it works badges */}
      <div
        className={`mt-8 flex flex-wrap items-center justify-center gap-3 transition-all delay-500 duration-1000 ease-out md:mt-10 md:gap-4 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <StepBadge
          number={1}
          label="えほんを えらぶ"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          }
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden text-muted-foreground/50 md:block" aria-hidden="true">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
        <StepBadge
          number={2}
          label="こえで おはなし"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          }
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden text-muted-foreground/50 md:block" aria-hidden="true">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
        <StepBadge
          number={3}
          label="えほんが かわる！"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
          }
        />
      </div>
    </section>
  )
}

function StepBadge({
  number,
  label,
  icon,
}: {
  number: number
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {number}
      </span>
      <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
      <span className="text-sm font-medium text-card-foreground">{label}</span>
    </div>
  )
}
