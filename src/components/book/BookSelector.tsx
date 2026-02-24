"use client"

import { useEffect, useState } from "react"
import { BookCard } from "./BookCard"

const books = [
  {
    bookId: "momotaro",
    title: "ももたろう",
    subtitle: "にほんの むかしばなし",
    coverImage: "/images/momotaro/page-01.jpg",
    accentColor: "#c97b4b",
    description: "おじいさんと おばあさんの もとに やってきた ももたろう。おにたいじの たびに でかけます。",
    pageCount: 12,
    href: "/book/momotaro",
  },
  {
    bookId: "akazukin",
    title: "あかずきん",
    subtitle: "せかいの めいさく",
    coverImage: "/images/akazukin/page-01.jpg",
    accentColor: "#b54e4e",
    description: "あかい ずきんの おんなのこが、おばあさんの おうちへ もりの みちを あるいていきます。",
    pageCount: 12,
    href: "/book/akazukin",
  },
  {
    bookId: "wizard-of-oz",
    title: "オズのまほうつかい",
    subtitle: "せかいの めいさく",
    coverImage: "/images/wizard-of-oz/page-01.jpg",
    accentColor: "#3a8f5c",
    description: "たつまきで ふしぎな くにへ とばされた ドロシー。なかまと いっしょに まほうつかいに あいに いきます。",
    pageCount: 12,
    href: "/book/wizard-of-oz",
  },
]

export function BookSelector() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section id="book-selector" className="relative scroll-mt-4 px-4 pb-20 pt-4">
      {/* Section header */}
      <div
        className={`mb-10 text-center transition-all duration-1000 ease-out md:mb-14 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
          えほんを えらんでね
        </h2>
        <div className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-primary/40" aria-hidden="true" />
      </div>

      {/* Book grid */}
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-10 md:flex-row md:gap-12 lg:gap-16">
        {books.map((book, index) => (
          <div
            key={book.bookId}
            className={`transition-all duration-1000 ease-out ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
            style={{ transitionDelay: `${900 + index * 200}ms` }}
          >
            <BookCard {...book} />
          </div>
        ))}
      </div>

      {/* Bottom decoration */}
      <div className="mx-auto mt-16 flex items-center justify-center gap-3 text-muted-foreground/40" aria-hidden="true">
        <WavyLine />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary/30">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
        <WavyLine />
      </div>
    </section>
  )
}

function WavyLine() {
  return (
    <svg width="80" height="8" viewBox="0 0 80 8" fill="none" className="text-border">
      <path
        d="M0 4C5 4 5 1 10 1S15 4 20 4 25 1 30 1s5 3 10 3 5-3 10-3 5 3 10 3 5-3 10-3 5 3 10 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
