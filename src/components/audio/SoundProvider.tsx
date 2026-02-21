'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { soundManager } from '@/lib/audio/sound-manager'

type SoundName = 'page-turn' | 'paper-rustle' | 'watercolor-drip' | 'magic-chime'

interface SoundContextValue {
  play: (name: SoundName) => void
  isMuted: boolean
  toggleMute: () => void
  isInitialized: boolean
  bgmVolume: number
  setBgmVolume: (volume: number) => void
  isBgmMuted: boolean
  toggleBgmMute: () => void
}

const SoundContext = createContext<SoundContextValue>({
  play: () => {},
  isMuted: false,
  toggleMute: () => {},
  isInitialized: false,
  bgmVolume: 0.5,
  setBgmVolume: () => {},
  isBgmMuted: false,
  toggleBgmMute: () => {},
})

export function useSounds() {
  return useContext(SoundContext)
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [bgmVolume, setBgmVolumeState] = useState(0.5)
  const [isBgmMuted, setIsBgmMuted] = useState(false)

  // ユーザー操作で初期化（ブラウザのAutoplay Policy対応）
  useEffect(() => {
    const handleInteraction = () => {
      if (!isInitialized) {
        soundManager.initialize()
        setIsInitialized(true)
      }
    }

    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('touchstart', handleInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, [isInitialized])

  // クリーンアップ
  useEffect(() => {
    return () => {
      soundManager.dispose()
    }
  }, [])

  const play = useCallback((name: SoundName) => {
    soundManager.play(name)
  }, [])

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    soundManager.setMuted(newMuted)
    // 全ミュートの場合はBGMもミュート
    if (newMuted) {
      setIsBgmMuted(true)
    }
  }, [isMuted])

  const setBgmVolume = useCallback((volume: number) => {
    setBgmVolumeState(Math.max(0, Math.min(1, volume)))
  }, [])

  const toggleBgmMute = useCallback(() => {
    setIsBgmMuted((prev) => !prev)
  }, [])

  return (
    <SoundContext.Provider
      value={{
        play,
        isMuted,
        toggleMute,
        isInitialized,
        bgmVolume,
        setBgmVolume,
        isBgmMuted,
        toggleBgmMute,
      }}
    >
      {children}
    </SoundContext.Provider>
  )
}
