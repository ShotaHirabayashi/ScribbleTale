/**
 * ページごとのBGMプロンプト定義
 * Lyria RealTime に送信する WeightedPrompt と生成パラメータ
 */

import type { WeightedPrompt, LiveMusicGenerationConfig } from '@google/genai'

export interface MusicPromptConfig {
  prompts: WeightedPrompt[]
  generationConfig: LiveMusicGenerationConfig
}

// ── 桃太郎 12ページ分 ──

export const momotaroBgmPrompts: Record<number, MusicPromptConfig> = {
  // P1: タイトルページ
  1: {
    prompts: [{ text: 'gentle music box, fairy tale opening, warm and inviting', weight: 1.0 }],
    generationConfig: { bpm: 72, density: 0.3, brightness: 0.6, temperature: 1.0 },
  },
  // P2: 導入・日常
  2: {
    prompts: [{ text: 'peaceful koto, bamboo flute, rural japan, serene morning', weight: 1.0 }],
    generationConfig: { bpm: 80, density: 0.3, brightness: 0.5, temperature: 1.0 },
  },
  // P3: 桃が流れてくる
  3: {
    prompts: [{ text: 'flowing water sounds, mysterious chimes, wonder and curiosity', weight: 1.0 }],
    generationConfig: { bpm: 88, density: 0.4, brightness: 0.6, temperature: 1.0 },
  },
  // P4: 桃太郎誕生
  4: {
    prompts: [{ text: 'joyful celebration, bright bells, miracle and happiness', weight: 1.0 }],
    generationConfig: { bpm: 100, density: 0.5, brightness: 0.7, temperature: 1.0 },
  },
  // P5: 成長・決意
  5: {
    prompts: [{ text: 'determined march, growing strength, heroic strings', weight: 1.0 }],
    generationConfig: { bpm: 110, density: 0.5, brightness: 0.6, temperature: 1.0 },
  },
  // P6: 旅立ち
  6: {
    prompts: [{ text: 'adventure theme, open road, hopeful journey, taiko drums light', weight: 1.0 }],
    generationConfig: { bpm: 120, density: 0.5, brightness: 0.7, temperature: 1.0 },
  },
  // P7: 仲間との出会い（犬）
  7: {
    prompts: [{ text: 'playful encounter, friendship, cheerful woodwinds', weight: 1.0 }],
    generationConfig: { bpm: 116, density: 0.5, brightness: 0.7, temperature: 1.0 },
  },
  // P8: 仲間との出会い（猿・キジ）
  8: {
    prompts: [{ text: 'team building, camaraderie, energetic folk music', weight: 1.0 }],
    generationConfig: { bpm: 120, density: 0.6, brightness: 0.7, temperature: 1.0 },
  },
  // P9: 鬼ヶ島へ
  9: {
    prompts: [{ text: 'ocean voyage, sailing, building tension, dramatic strings', weight: 1.0 }],
    generationConfig: { bpm: 100, density: 0.5, brightness: 0.4, temperature: 1.0 },
  },
  // P10: 鬼との戦い
  10: {
    prompts: [{ text: 'epic battle, intense taiko drums, heroic brass, clash', weight: 1.0 }],
    generationConfig: { bpm: 140, density: 0.8, brightness: 0.7, temperature: 1.2 },
  },
  // P11: 勝利
  11: {
    prompts: [{ text: 'triumphant victory, fanfare, celebration and relief', weight: 1.0 }],
    generationConfig: { bpm: 120, density: 0.7, brightness: 0.8, temperature: 1.0 },
  },
  // P12: 帰還・めでたしめでたし
  12: {
    prompts: [{ text: 'warm ending, happy strings, peaceful resolution, music box closing', weight: 1.0 }],
    generationConfig: { bpm: 90, density: 0.4, brightness: 0.8, temperature: 1.0 },
  },
}

// ── 赤ずきん 12ページ分 ──

export const akazukinBgmPrompts: Record<number, MusicPromptConfig> = {
  // P1: タイトルページ
  1: {
    prompts: [{ text: 'gentle music box, european fairy tale, whimsical', weight: 1.0 }],
    generationConfig: { bpm: 72, density: 0.3, brightness: 0.6, temperature: 1.0 },
  },
  // P2: 赤ずきんの日常
  2: {
    prompts: [{ text: 'cheerful village life, birds singing, light acoustic guitar', weight: 1.0 }],
    generationConfig: { bpm: 96, density: 0.4, brightness: 0.7, temperature: 1.0 },
  },
  // P3: おばあさんへのお使い
  3: {
    prompts: [{ text: 'happy skipping, basket swinging, innocent adventure', weight: 1.0 }],
    generationConfig: { bpm: 108, density: 0.4, brightness: 0.7, temperature: 1.0 },
  },
  // P4: 森への道
  4: {
    prompts: [{ text: 'enchanted forest, mysterious but beautiful, nature sounds', weight: 1.0 }],
    generationConfig: { bpm: 88, density: 0.4, brightness: 0.5, temperature: 1.0 },
  },
  // P5: 狼との出会い
  5: {
    prompts: [{ text: 'suspicious encounter, sneaky strings, uneasy tension', weight: 1.0 }],
    generationConfig: { bpm: 80, density: 0.4, brightness: 0.3, temperature: 1.0 },
  },
  // P6: 花畑で寄り道
  6: {
    prompts: [{ text: 'flower field, dreamy harp, butterfly dance, carefree', weight: 1.0 }],
    generationConfig: { bpm: 92, density: 0.3, brightness: 0.8, temperature: 1.0 },
  },
  // P7: 狼がおばあさんの家へ
  7: {
    prompts: [{ text: 'dark scheme, tiptoeing villain, menacing but playful', weight: 1.0 }],
    generationConfig: { bpm: 100, density: 0.5, brightness: 0.3, temperature: 1.0 },
  },
  // P8: 赤ずきんがおばあさんの家に到着
  8: {
    prompts: [{ text: 'something is wrong, eerie calm, suspenseful strings', weight: 1.0 }],
    generationConfig: { bpm: 72, density: 0.3, brightness: 0.3, temperature: 1.0 },
  },
  // P9: 「おばあさん おめめが おおきいのね」
  9: {
    prompts: [{ text: 'growing suspense, heartbeat rhythm, discovery', weight: 1.0 }],
    generationConfig: { bpm: 84, density: 0.5, brightness: 0.3, temperature: 1.0 },
  },
  // P10: 狼の正体・危機
  10: {
    prompts: [{ text: 'dramatic reveal, danger, frantic escape, urgent strings', weight: 1.0 }],
    generationConfig: { bpm: 140, density: 0.8, brightness: 0.5, temperature: 1.2 },
  },
  // P11: きこりの救出
  11: {
    prompts: [{ text: 'heroic rescue, brave woodcutter, triumph over evil', weight: 1.0 }],
    generationConfig: { bpm: 130, density: 0.7, brightness: 0.7, temperature: 1.0 },
  },
  // P12: ハッピーエンド
  12: {
    prompts: [{ text: 'warm reunion, lesson learned, gentle closing, music box ending', weight: 1.0 }],
    generationConfig: { bpm: 84, density: 0.3, brightness: 0.8, temperature: 1.0 },
  },
}

/** bookIdからBGMプロンプトマップを取得 */
export function getBgmPrompts(bookId: string): Record<number, MusicPromptConfig> {
  switch (bookId) {
    case 'momotaro':
      return momotaroBgmPrompts
    case 'akazukin':
      return akazukinBgmPrompts
    default:
      return momotaroBgmPrompts
  }
}
