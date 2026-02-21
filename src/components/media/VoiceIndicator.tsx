'use client'

import { Mic, MicOff } from 'lucide-react'

interface VoiceIndicatorProps {
  isActive: boolean
  isConnected: boolean
}

export function VoiceIndicator({ isActive, isConnected }: VoiceIndicatorProps) {
  if (!isActive) return null

  return (
    <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 font-serif text-xs shadow-sm backdrop-blur-sm">
      {isConnected ? (
        <>
          <Mic className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span className="text-foreground/80">きいているよ</span>
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-3 w-0.5 rounded-full bg-primary/60"
                style={{
                  animation: `pulse ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <MicOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">せつぞく ちゅう...</span>
        </>
      )}
    </div>
  )
}
