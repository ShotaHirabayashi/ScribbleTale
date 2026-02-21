"use client"

import { useEffect, useRef, useState } from "react"

const journeySteps = [
  {
    number: 1,
    label: "えらぶ",
    title: "どの おはなしに する？",
    description:
      "ももたろう、あかずきん… きょうは どれにしようかな？",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    bgColor: "bg-storybook-peach/20",
    iconBg: "bg-storybook-peach/40",
    borderColor: "border-storybook-peach/40",
  },
  {
    number: 2,
    label: "はなす",
    title: "「ももたろうが そらを とんだら…？」",
    description:
      "おもいついたこと、なんでも はなしてみて！",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
    bgColor: "bg-storybook-sage/20",
    iconBg: "bg-storybook-sage/40",
    borderColor: "border-storybook-sage/40",
  },
  {
    number: 3,
    label: "かく",
    title: "きみの え が えほんに でてくる！",
    description:
      "かいた ドラゴンが おはなしの なかで うごきだすよ。",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
        <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
      </svg>
    ),
    bgColor: "bg-primary/10",
    iconBg: "bg-primary/25",
    borderColor: "border-primary/20",
  },
  {
    number: 4,
    label: "みせる",
    title: "できた えほんを みんなに みせよう！",
    description:
      "せかいに ひとつだけの えほんを おともだちにも おしえてあげてね。",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
      </svg>
    ),
    bgColor: "bg-storybook-red/10",
    iconBg: "bg-storybook-red/25",
    borderColor: "border-storybook-red/20",
  },
]

export function ExperienceSection() {
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
      {/* Decorative blob */}
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-48 w-48 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--storybook-peach)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl">
        {/* Section header */}
        <div
          className={`mb-12 text-center transition-all duration-1000 ease-out md:mb-14 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            きみだったら どう する？
          </h2>
          <div
            className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-primary/40"
            aria-hidden="true"
          />
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            おはなしの つづきは きみが きめるんだよ。
          </p>
        </div>

        {/* Step cards with connecting line */}
        <div className="relative">
          {/* Vertical connecting line */}
          <div
            className="absolute left-6 top-2 h-[calc(100%-16px)] w-px bg-gradient-to-b from-storybook-peach via-storybook-sage to-storybook-red/50 md:left-7"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-6 md:gap-8">
            {journeySteps.map((step, index) => (
              <div
                key={step.label}
                className={`transition-all duration-700 ease-out ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${200 + index * 150}ms` }}
              >
                <div className="flex gap-5 md:gap-6">
                  {/* Number node */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${step.iconBg} text-foreground shadow-sm ring-4 ring-background md:h-14 md:w-14`}
                    >
                      <span className="sr-only">{'ステップ ' + step.number}</span>
                      {step.icon}
                    </div>
                  </div>

                  {/* Content card */}
                  <div
                    className={`flex-1 rounded-2xl border ${step.borderColor} ${step.bgColor} p-5 md:p-6`}
                  >
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {step.number}
                      </span>
                      <span className="rounded-full bg-card px-2.5 py-0.5 font-serif text-xs font-bold text-muted-foreground">
                        {step.label}
                      </span>
                    </div>
                    <h3 className="mb-1.5 font-serif text-lg font-bold text-foreground md:text-xl">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA hint */}
        <div
          className={`mt-12 text-center transition-all delay-1000 duration-1000 ease-out md:mt-14 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <p className="font-serif text-base text-muted-foreground md:text-lg">
            さあ、どんな おはなしに なるかな？
          </p>
        </div>
      </div>
    </section>
  )
}
