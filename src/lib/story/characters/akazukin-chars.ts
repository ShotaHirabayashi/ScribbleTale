import type { CharacterAgent } from '@/lib/types'

export const akazukinCharacters: CharacterAgent[] = [
  {
    id: 'akazukin',
    name: 'あかずきん',
    personality: '明るく好奇心旺盛、少しおっちょこちょい',
    behaviorPatterns: ['新しいものに目をキラキラさせる', '寄り道をする', '優しい心で人を信じる'],
    reactionStyle: '新しいものにワクワクして反応する',
    appearsInPages: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
    relationships: {
      wolf: '最初は知らない人、後で怖い存在',
      grandmother: '大好きなおばあさん',
      hunter: '助けてくれるヒーロー',
      mother: '大好きなおかあさん',
    },
  },
  {
    id: 'wolf',
    name: 'オオカミ',
    personality: 'ずる賢いが憎めない、ちょっとドジ',
    behaviorPatterns: ['にこにこ近づく', 'こっそり先回りする', '変装するが見破られる'],
    reactionStyle: '企みながらも動揺する、ずる賢く話す',
    appearsInPages: [5, 6, 7, 8, 10, 11],
    relationships: {
      akazukin: 'だましたい相手',
      grandmother: '変装する対象',
    },
  },
  {
    id: 'grandmother',
    name: 'おばあさん',
    personality: '優しくておおらか、のんびり屋',
    behaviorPatterns: ['穏やかに受け入れる', 'お菓子を出す', '孫を可愛がる'],
    reactionStyle: '穏やかに受け入れる',
    appearsInPages: [7, 8, 11, 12],
    relationships: {
      akazukin: '大切な孫',
      wolf: '怖い侵入者',
      hunter: '頼りになる近所の人',
    },
  },
  {
    id: 'hunter',
    name: 'りょうしさん',
    personality: '頼もしく正義感が強い、力持ち',
    behaviorPatterns: ['危険を察知して駆けつける', '力強く助ける', '優しく教え諭す'],
    reactionStyle: '力強く助けに来る',
    appearsInPages: [11, 12],
    relationships: {
      akazukin: '守るべき子ども',
      grandmother: '助けるべき人',
      wolf: '追い払うべき相手',
    },
  },
]
