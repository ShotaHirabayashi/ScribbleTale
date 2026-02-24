import type { ModificationBoldness, BoldnessConfig } from '@/lib/types'

/** 改変レベルごとの設定マッピング */
export const BOLDNESS_CONFIGS: Record<ModificationBoldness, BoldnessConfig> = {
  gentle: {
    enforcePageRole: true,
    fixedElementsMode: 'strict',
    consistencyMode: 'strict',
    maxModifications: 2,
    promptGuidance: '元の物語の構造を大切にしながら、子どもの発言を優しく取り入れてください。',
  },
  normal: {
    enforcePageRole: true,
    fixedElementsMode: 'loose',
    consistencyMode: 'strict',
    maxModifications: 3,
    promptGuidance: '子どもの発言を反映しつつ、物語の流れを自然に保ってください。',
  },
  bold: {
    enforcePageRole: false,
    fixedElementsMode: 'ignore',
    consistencyMode: 'relaxed',
    maxModifications: 4,
    promptGuidance: '子どもの発言を最優先にして、大胆に物語を書き換えてください。元の話と全く違う展開でもOKです。ただしキャラクターの名前は維持してください。',
  },
  wild: {
    enforcePageRole: false,
    fixedElementsMode: 'ignore',
    consistencyMode: 'off',
    maxModifications: 5,
    promptGuidance: '子どもの想像力を全力で受け止めて、完全に新しい物語を作ってください。元の話に縛られる必要はありません。',
  },
}

/** レベルから設定を取得 */
export function getBoldnessConfig(boldness: ModificationBoldness): BoldnessConfig {
  return BOLDNESS_CONFIGS[boldness]
}
