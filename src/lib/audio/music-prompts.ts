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

// ── オズのまほうつかい 12ページ分 ──

export const wizardOfOzBgmPrompts: Record<number, MusicPromptConfig> = {
  // P1: タイトルページ
  1: {
    prompts: [{ text: 'magical music box, enchanted fairy tale, sparkling wonder', weight: 1.0 }],
    generationConfig: { bpm: 76, density: 0.3, brightness: 0.6, temperature: 1.0 },
  },
  // P2: ドロシーとトトの日常
  2: {
    prompts: [{ text: 'simple country life, prairie wind, gentle banjo, warm sunshine', weight: 1.0 }],
    generationConfig: { bpm: 84, density: 0.3, brightness: 0.6, temperature: 1.0 },
  },
  // P3: 竜巻でオズの国へ
  3: {
    prompts: [{ text: 'dramatic tornado, swirling winds, intense strings, chaos', weight: 1.0 }],
    generationConfig: { bpm: 140, density: 0.7, brightness: 0.4, temperature: 1.2 },
  },
  // P4: マンチキンの国・良い魔女
  4: {
    prompts: [{ text: 'magical wonderland, sparkling chimes, colorful fantasy, gentle harp', weight: 1.0 }],
    generationConfig: { bpm: 100, density: 0.4, brightness: 0.8, temperature: 1.0 },
  },
  // P5: 黄色いレンガの道
  5: {
    prompts: [{ text: 'hopeful journey, yellow brick road, skipping rhythm, bright adventure', weight: 1.0 }],
    generationConfig: { bpm: 112, density: 0.5, brightness: 0.7, temperature: 1.0 },
  },
  // P6: かかしとの出会い
  6: {
    prompts: [{ text: 'playful scarecrow dance, clumsy woodwinds, whimsical comedy', weight: 1.0 }],
    generationConfig: { bpm: 108, density: 0.5, brightness: 0.7, temperature: 1.0 },
  },
  // P7: ブリキのきこりとの出会い
  7: {
    prompts: [{ text: 'metallic tinkling, heartfelt melody, gentle tears, warm strings', weight: 1.0 }],
    generationConfig: { bpm: 92, density: 0.4, brightness: 0.6, temperature: 1.0 },
  },
  // P8: おくびょうライオンとの出会い
  8: {
    prompts: [{ text: 'comical lion, timid strings, nervous but endearing, soft brass', weight: 1.0 }],
    generationConfig: { bpm: 96, density: 0.4, brightness: 0.5, temperature: 1.0 },
  },
  // P9: エメラルドの都に到着
  9: {
    prompts: [{ text: 'emerald city grandeur, shimmering crystals, majestic arrival, green sparkle', weight: 1.0 }],
    generationConfig: { bpm: 104, density: 0.6, brightness: 0.8, temperature: 1.0 },
  },
  // P10: 魔法使いとの対面・試練
  10: {
    prompts: [{ text: 'mysterious wizard, dramatic organ, imposing presence, deep mystery', weight: 1.0 }],
    generationConfig: { bpm: 88, density: 0.5, brightness: 0.4, temperature: 1.0 },
  },
  // P11: 悪い魔女との対決と勝利
  11: {
    prompts: [{ text: 'wicked witch battle, heroic courage, intense clash, triumphant brass', weight: 1.0 }],
    generationConfig: { bpm: 136, density: 0.8, brightness: 0.6, temperature: 1.2 },
  },
  // P12: ハッピーエンド・帰還
  12: {
    prompts: [{ text: 'there is no place like home, silver shoes clicking, warm reunion, music box closing', weight: 1.0 }],
    generationConfig: { bpm: 88, density: 0.4, brightness: 0.8, temperature: 1.0 },
  },
}

/** bookIdからBGMプロンプトマップを取得 */
export function getBgmPrompts(bookId: string): Record<number, MusicPromptConfig> {
  switch (bookId) {
    case 'momotaro':
      return momotaroBgmPrompts
    case 'akazukin':
      return akazukinBgmPrompts
    case 'wizard-of-oz':
      return wizardOfOzBgmPrompts
    default:
      return momotaroBgmPrompts
  }
}

// ── 雰囲気マッピング定義 ──

interface MoodMapping {
  keywords: string[]
  promptText: string
  bpm: number
  density: number
  brightness: number
}

const MOOD_MAPPINGS: MoodMapping[] = [
  {
    keywords: ['なかよし', '友達', 'ともだち', '仲良し', '握手', '一緒', 'いっしょ', '仲間', 'なかま', '助け合', 'たすけあ'],
    promptText: 'warm friendship, gentle harmony, peaceful togetherness, soft strings',
    bpm: 88,
    density: 0.4,
    brightness: 0.7,
  },
  {
    keywords: ['たべもの', '食べ物', 'ごはん', 'おかし', 'お菓子', 'ケーキ', 'りんご', 'きびだんご', 'パン', 'クッキー', 'おべんとう'],
    promptText: 'playful cooking, sweet melody, cheerful kitchen, bouncy rhythm',
    bpm: 108,
    density: 0.5,
    brightness: 0.8,
  },
  {
    keywords: ['冒険', 'ぼうけん', '飛ぶ', 'とぶ', '空', 'そら', '旅', 'たび', '走る', 'はしる', 'ロケット', '探検', 'たんけん'],
    promptText: 'soaring adventure, wind instruments, exciting journey, dynamic brass',
    bpm: 130,
    density: 0.6,
    brightness: 0.7,
  },
  {
    keywords: ['こわい', '怖い', 'おばけ', 'ゆうれい', '暗い', 'くらい', '不思議', 'ふしぎ', 'まほう', '魔法', 'ひみつ'],
    promptText: 'mysterious atmosphere, curious exploration, enchanted sounds, whimsical chimes',
    bpm: 76,
    density: 0.3,
    brightness: 0.3,
  },
  {
    keywords: ['うれしい', '嬉しい', 'たのしい', '楽しい', 'わらう', '笑う', 'にこにこ', 'パーティ', 'おまつり', '祭り'],
    promptText: 'joyful celebration, happy melody, festive energy, bright bells',
    bpm: 120,
    density: 0.6,
    brightness: 0.8,
  },
  {
    keywords: ['かなしい', '悲しい', 'なく', '泣く', 'さみしい', '寂しい', 'わかれ', '別れ', 'さよなら'],
    promptText: 'gentle melancholy, tender piano, bittersweet emotion, soft rain',
    bpm: 68,
    density: 0.3,
    brightness: 0.4,
  },
  {
    keywords: ['つよい', '強い', 'たたかう', '戦う', 'まもる', '守る', 'ヒーロー', 'ゆうき', '勇気', 'パンチ', 'キック'],
    promptText: 'heroic battle, powerful drums, courageous brass, epic energy',
    bpm: 140,
    density: 0.7,
    brightness: 0.6,
  },
  {
    keywords: ['ねる', '寝る', 'おやすみ', 'ゆめ', '夢', 'ほし', '星', 'つき', '月', 'よる', '夜'],
    promptText: 'dreamy lullaby, gentle stars, peaceful night, soft music box',
    bpm: 64,
    density: 0.2,
    brightness: 0.5,
  },
  {
    keywords: ['うみ', '海', 'さかな', '魚', 'みず', '水', 'およぐ', '泳ぐ', 'ふね', '船', 'にじ', '虹'],
    promptText: 'ocean waves, flowing water, aquatic melody, serene harp',
    bpm: 84,
    density: 0.4,
    brightness: 0.6,
  },
  {
    keywords: ['どうぶつ', '動物', 'いぬ', '犬', 'ねこ', '猫', 'うさぎ', 'くま', 'とり', '鳥', 'きつね'],
    promptText: 'playful animals, nature sounds, cheerful woodwinds, forest frolic',
    bpm: 100,
    density: 0.5,
    brightness: 0.7,
  },
]

/** 改変テキストからBGMプロンプトを動的生成 */
export function buildDynamicBgmPrompt(params: {
  keyword: string
  modifiedText: string
  baseConfig: MusicPromptConfig
}): MusicPromptConfig {
  const { keyword, modifiedText, baseConfig } = params
  const combinedText = `${keyword} ${modifiedText}`

  // キーワードマッチで雰囲気を判定
  let bestMatch: MoodMapping | null = null
  let bestScore = 0

  for (const mood of MOOD_MAPPINGS) {
    let score = 0
    for (const kw of mood.keywords) {
      if (combinedText.includes(kw)) {
        score++
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = mood
    }
  }

  if (bestMatch) {
    console.log('[music-prompts] Dynamic BGM mood detected:', bestMatch.promptText, 'score:', bestScore)
    return {
      prompts: [{ text: bestMatch.promptText, weight: 1.0 }],
      generationConfig: {
        ...baseConfig.generationConfig,
        bpm: bestMatch.bpm,
        density: bestMatch.density,
        brightness: bestMatch.brightness,
      },
    }
  }

  // マッチなし → キーワードを英語的に組み込んだデフォルトプロンプト
  console.log('[music-prompts] Dynamic BGM fallback, keyword:', keyword)
  return {
    prompts: [{ text: `gentle fairy tale, ${keyword}, whimsical melody, soft orchestral`, weight: 1.0 }],
    generationConfig: baseConfig.generationConfig,
  }
}
