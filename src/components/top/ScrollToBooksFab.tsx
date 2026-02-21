"use client"

import { useEffect, useState, useCallback } from "react"

export function ScrollToBooksFab() {
  const [isVisible, setIsVisible] = useState(true)
  const [isBouncing, setIsBouncing] = useState(true)

  useEffect(() => {
    const booksSection = document.getElementById("book-selector")
    if (!booksSection) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide button when book selector is visible on screen
        setIsVisible(!entry.isIntersecting)
      },
      { threshold: 0.3 }
    )

    observer.observe(booksSection)
    return () => observer.disconnect()
  }, [])

  // Stop bouncing after a few seconds so it's not distracting
  useEffect(() => {
    const timer = setTimeout(() => setIsBouncing(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  const handleClick = useCallback(() => {
    const booksSection = document.getElementById("book-selector")
    if (booksSection) {
      booksSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  return (
    <button
      onClick={handleClick}
      aria-label="えほんを えらぶ"
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full border-2 border-primary/20 bg-card px-6 py-3.5 font-serif text-sm font-bold text-foreground shadow-lg transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 md:bottom-8 md:px-8 md:py-4 md:text-lg ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      } ${isBouncing ? "animate-bounce" : ""}`}
      style={{
        boxShadow: isVisible
          ? "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)"
          : "none",
      }}
    >
      {/* Book icon */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      </svg>
      <span>えほんを えらぶ</span>
      {/* Down arrow */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  )
}
