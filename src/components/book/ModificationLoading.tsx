'use client'

import { Sparkles } from 'lucide-react'
import type { ModificationPhase } from '@/lib/types'

interface ModificationLoadingProps {
  phase: ModificationPhase
}

const phaseMessages: Record<ModificationPhase, string> = {
  idle: '',
  orchestrating: 'おはなしを かんがえているよ...',
  generating_image: 'えを かいているよ...',
  complete: 'できたよ！',
}

export function ModificationLoading({ phase }: ModificationLoadingProps) {
  if (phase === 'idle') return null

  const message = phaseMessages[phase]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--storybook-brown)]/30 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        {/* 魔法エフェクト */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
            <Sparkles className="h-8 w-8 animate-pulse text-primary sm:h-10 sm:w-10" />
          </div>
        </div>

        <p className="font-serif text-sm text-background/90 sm:text-base">
          {message}
        </p>

        {/* プログレスドット */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/60"
              style={{
                animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
