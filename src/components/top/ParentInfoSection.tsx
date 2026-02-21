"use client"

import { useEffect, useRef, useState } from "react"

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "安全なAI体験",
    description: "お子さまの入力内容はAIが適切にフィルタリング。年齢に合った安心な物語体験をお届けします。",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
    ),
    title: "想像力を育む",
    description: "「もし～だったら？」と考える力を伸ばします。お子さまのアイデアが物語を動かす成功体験を。",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "ことばの力がつく",
    description: "声で物語に参加することで、語彙力や表現力が自然と身につきます。読み聞かせの新しいかたち。",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "何度でもあたらしい",
    description: "同じ絵本でも、お子さまの声やお絵かきで毎回ちがうお話に。飽きることなく楽しめます。",
  },
]

export function ParentInfoSection() {
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
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative px-4 py-16 md:py-24">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-card/50" aria-hidden="true" />

      <div className="relative mx-auto max-w-4xl">
        {/* Section header */}
        <div
          className={`mb-12 text-center transition-all duration-1000 ease-out md:mb-16 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p className="mb-2 text-sm font-medium tracking-wider text-primary">FOR PARENTS</p>
          <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            おうちのかたへ
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-primary/40" aria-hidden="true" />
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            ScribbleTaleは、お子さまの「声」と「お絵かき」でAIが絵本をリアルタイムに変化させる、
            新しい共創型の読み聞かせ体験です。
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`transition-all duration-700 ease-out ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
              style={{ transitionDelay: `${300 + index * 150}ms` }}
            >
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1.5 text-base font-bold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div
          className={`mt-10 text-center transition-all delay-700 duration-1000 ease-out md:mt-12 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-storybook-sage" aria-hidden="true">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>{'対象年齢：3〜6歳（保護者の方と一緒にお楽しみください）'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
