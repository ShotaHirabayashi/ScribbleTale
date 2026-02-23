'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Palette, PartyPopper } from 'lucide-react'
import type { ModificationPhase } from '@/lib/types'

interface ModificationLoadingProps {
  phase: ModificationPhase
  keyword?: string
}

/** orchestrating フェーズの段階メッセージ */
const orchestratingStages = [
  { delay: 0, message: (kw?: string) => kw ? `「${kw}」って いったね！` : 'おはなしを かんがえているよ...' },
  { delay: 2000, message: () => 'おはなしを かんがえているよ...' },
  { delay: 5000, message: () => 'もうすこしで できるよ...' },
]

/** generating_image フェーズの段階メッセージ */
const imageStages = [
  { delay: 0, message: () => 'えを かきはじめるよ...' },
  { delay: 4000, message: () => 'いろを ぬっているよ...' },
  { delay: 8000, message: () => 'とくべつな えを かいているよ！' },
]

export function ModificationLoading({ phase, keyword }: ModificationLoadingProps) {
  const [stageIndex, setStageIndex] = useState(0)
  const [phaseStartTime, setPhaseStartTime] = useState(Date.now())

  // フェーズ変更時にリセット
  useEffect(() => {
    setStageIndex(0)
    setPhaseStartTime(Date.now())
  }, [phase])

  // 経過時間に応じてステージを進める
  useEffect(() => {
    if (phase === 'idle' || phase === 'complete') return

    const stages = phase === 'orchestrating' ? orchestratingStages : imageStages

    const timers = stages.slice(1).map((stage, i) => {
      const elapsed = Date.now() - phaseStartTime
      const remaining = stage.delay - elapsed
      if (remaining <= 0) {
        setStageIndex(i + 1)
        return null
      }
      return setTimeout(() => setStageIndex(i + 1), remaining)
    })

    return () => {
      timers.forEach((t) => t && clearTimeout(t))
    }
  }, [phase, phaseStartTime])

  if (phase === 'idle') return null

  const stages = phase === 'orchestrating' ? orchestratingStages : phase === 'generating_image' ? imageStages : null
  const message = phase === 'complete'
    ? 'できたよ！'
    : stages?.[stageIndex]?.message(keyword) ?? 'おはなしを かんがえているよ...'

  const Icon = phase === 'generating_image' ? Palette : phase === 'complete' ? PartyPopper : Sparkles

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-6 flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl bg-background/95 px-8 py-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500 sm:max-w-sm sm:px-10 sm:py-10">
        {/* 魔法エフェクト */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
            <Icon className="h-8 w-8 animate-pulse text-primary sm:h-10 sm:w-10" />
          </div>
        </div>

        <p className="text-center font-serif text-base text-[var(--storybook-brown)] sm:text-lg">
          {message}
        </p>

        {/* プログレスドット */}
        {phase !== 'complete' && (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-primary/60"
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
