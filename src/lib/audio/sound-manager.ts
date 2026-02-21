import { Howl } from 'howler'

type SoundName = 'page-turn' | 'paper-rustle' | 'watercolor-drip' | 'magic-chime'

interface SoundConfig {
  src: string
  volume: number
  rate?: number
}

const SOUND_CONFIGS: Record<SoundName, SoundConfig> = {
  'page-turn': { src: '/sounds/page-turn.mp3', volume: 0.3 },
  'paper-rustle': { src: '/sounds/paper-rustle.mp3', volume: 0.2 },
  'watercolor-drip': { src: '/sounds/watercolor-drip.mp3', volume: 0.4 },
  'magic-chime': { src: '/sounds/magic-chime.mp3', volume: 0.5 },
}

class SoundManager {
  private sounds: Map<SoundName, Howl> = new Map()
  private isMuted = false
  private isInitialized = false

  /** 初期化（ユーザー操作後に呼ぶ） */
  initialize(): void {
    if (this.isInitialized) return

    for (const [name, config] of Object.entries(SOUND_CONFIGS)) {
      const sound = new Howl({
        src: [config.src],
        volume: config.volume,
        rate: config.rate || 1,
        preload: true,
      })
      this.sounds.set(name as SoundName, sound)
    }

    this.isInitialized = true
  }

  play(name: SoundName): void {
    if (this.isMuted || !this.isInitialized) return

    const sound = this.sounds.get(name)
    if (sound) {
      sound.play()
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted
    Howler.mute(muted)
  }

  isMutedState(): boolean {
    return this.isMuted
  }

  dispose(): void {
    for (const sound of this.sounds.values()) {
      sound.unload()
    }
    this.sounds.clear()
    this.isInitialized = false
  }
}

// シングルトン
export const soundManager = new SoundManager()
