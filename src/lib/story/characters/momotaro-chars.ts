import type { CharacterAgent } from '@/lib/types'

export const momotaroCharacters: CharacterAgent[] = [
  {
    id: 'momotaro',
    name: 'ももたろう',
    personality: '勇敢で優しい、リーダー気質',
    behaviorPatterns: ['困っている人を助ける', '仲間を大切にする', '先頭に立って冒険する'],
    reactionStyle: 'やる気満々で前向きに受け入れる',
    appearsInPages: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    relationships: {
      dog: '頼れる仲間',
      monkey: '知恵者の仲間',
      pheasant: '勇敢な偵察役',
      oni: '倒すべき敵',
      grandparents: '育ての親、大切な家族',
    },
  },
  {
    id: 'dog',
    name: 'いぬ',
    personality: '忠実で元気、素直',
    behaviorPatterns: ['ももたろうについていく', '嬉しいことがあると尻尾を振る', '仲間を守る'],
    reactionStyle: '嬉しそうに反応、ももたろうに従う',
    appearsInPages: [7, 8, 9, 10, 11, 12],
    relationships: {
      momotaro: '大好きなリーダー',
      monkey: '仲良しの仲間',
      pheasant: '頼もしい仲間',
    },
  },
  {
    id: 'monkey',
    name: 'さる',
    personality: '賢くて慎重、ツッコミ役',
    behaviorPatterns: ['危険を察知する', '知恵を出す', '心配しつつもついていく'],
    reactionStyle: '心配しつつもついていく、ツッコミを入れる',
    appearsInPages: [8, 9, 10, 11, 12],
    relationships: {
      momotaro: '尊敬するリーダー',
      dog: '元気な仲間',
      pheasant: '空の偵察を頼む仲間',
    },
  },
  {
    id: 'pheasant',
    name: 'きじ',
    personality: '勇敢で誇り高い、偵察役',
    behaviorPatterns: ['空から状況を確認する', '危険を先に見つける', '美しく飛ぶ'],
    reactionStyle: '空から状況を報告する',
    appearsInPages: [8, 9, 10, 11, 12],
    relationships: {
      momotaro: '信頼するリーダー',
      dog: '地上の仲間',
      monkey: '知恵者の仲間',
    },
  },
  {
    id: 'oni',
    name: 'おに',
    personality: '乱暴だが実は寂しがり',
    behaviorPatterns: ['大声で威嚇する', '驚くと慌てる', '本当は友達が欲しい'],
    reactionStyle: '驚いたり怒ったり感情豊か',
    appearsInPages: [10, 11, 12],
    relationships: {
      momotaro: '手強い相手',
    },
  },
  {
    id: 'grandparents',
    name: 'おじいさん・おばあさん',
    personality: '温かく見守る、慈愛深い',
    behaviorPatterns: ['優しく見守る', '心配しながら応援する', 'おいしいご飯を作る'],
    reactionStyle: '優しく応援する',
    appearsInPages: [2, 3, 4, 5, 6, 12],
    relationships: {
      momotaro: '大切な孫のような存在',
    },
  },
]
