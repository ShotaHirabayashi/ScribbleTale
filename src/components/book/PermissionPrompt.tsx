'use client'

import { Mic, Camera, AlertCircle } from 'lucide-react'

interface PermissionPromptProps {
  type: 'microphone' | 'camera'
  onRetry: () => void
  onSkip: () => void
}

const icons = {
  microphone: Mic,
  camera: Camera,
}

const messages = {
  microphone: {
    title: 'マイクを つかうよ',
    description: 'おはなしを きくために マイクが ひつようだよ',
    denied: 'マイクが つかえないよ。ブラウザの せっていを かくにんしてね。',
  },
  camera: {
    title: 'カメラを つかうよ',
    description: 'らくがきを みるために カメラが ひつようだよ',
    denied: 'カメラが つかえないよ。ブラウザの せっていを かくにんしてね。',
  },
}

export function PermissionPrompt({ type, onRetry, onSkip }: PermissionPromptProps) {
  const Icon = icons[type]
  const msg = messages[type]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--storybook-brown)]/20 backdrop-blur-[2px]">
      <div className="mx-4 max-w-xs rounded-2xl bg-background/95 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>

        <h3 className="mb-2 text-center font-serif text-base font-bold text-foreground">
          {msg.title}
        </h3>

        <p className="mb-4 text-center font-serif text-sm text-muted-foreground">
          {msg.description}
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="rounded-full bg-primary px-4 py-2 font-serif text-sm font-bold text-primary-foreground transition-all hover:scale-105 active:scale-95"
          >
            つかう
          </button>
          <button
            onClick={onSkip}
            className="font-serif text-xs text-muted-foreground underline decoration-dotted underline-offset-4"
          >
            つかわない
          </button>
        </div>
      </div>
    </div>
  )
}

/** API失敗時のフォールバックUI */
export function ApiErrorFallback({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-destructive/10 p-4">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-center font-serif text-sm text-destructive">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-primary px-4 py-1.5 font-serif text-xs text-primary-foreground"
        >
          もういちど
        </button>
      )}
    </div>
  )
}
