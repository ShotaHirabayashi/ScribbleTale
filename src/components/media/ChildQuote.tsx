'use client'

interface ChildQuoteProps {
  utterance: string | null
}

export function ChildQuote({ utterance }: ChildQuoteProps) {
  if (!utterance) return null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative inline-block max-w-xs rounded-2xl bg-[var(--storybook-peach)]/20 px-4 py-2 shadow-sm">
        <p className="font-[var(--font-klee-one)] text-sm text-[var(--storybook-brown)] sm:text-base">
          &ldquo;{utterance}&rdquo;
        </p>
        {/* 吹き出し尻尾 */}
        <div className="absolute -bottom-2 left-6 h-3 w-3 rotate-45 bg-[var(--storybook-peach)]/20" />
      </div>
    </div>
  )
}
