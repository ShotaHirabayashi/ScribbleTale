import { GoogleGenAI } from '@google/genai'
import { getCharacterReaction } from './characters/agent'
import { momotaroCharacters } from './characters/momotaro-chars'
import { akazukinCharacters } from './characters/akazukin-chars'
import { buildConsistencyCheckPrompt } from '@/lib/gemini/prompts'
import { CHILD_SAFE_SETTINGS } from '@/lib/gemini/safety'
import type { CharacterAgent, CharacterReaction, OrchestratorResult, StoryPage } from '@/lib/types'

const TEXT_MODEL = 'gemini-2.5-flash-preview-05-20'

const characterMap: Record<string, CharacterAgent[]> = {
  momotaro: momotaroCharacters,
  akazukin: akazukinCharacters,
}

/** キャラクターエージェントを並列呼び出しし、反応を統合 + 整合性チェック */
export async function orchestrate(params: {
  bookId: string
  bookTitle: string
  keyword: string
  targetPage: StoryPage
  modifiedText: string
  previousPages: { pageNumber: number; currentText: string }[]
  apiKey: string
}): Promise<OrchestratorResult> {
  const { bookId, bookTitle, keyword, targetPage, modifiedText, previousPages, apiKey } = params

  const allCharacters = characterMap[bookId] || []
  const pageNumber = targetPage.pageNumber || targetPage.id

  // 該当ページに登場するキャラクターをフィルタ
  const activeCharacters = allCharacters.filter((c) =>
    c.appearsInPages.includes(pageNumber)
  )

  const pageRole = targetPage.pageRole || `ページ${targetPage.id}の物語`
  const fixedElements = targetPage.fixedElements || [pageRole]

  // キャラクター反応取得と整合性チェックを並列実行
  const [reactions, consistencyResult] = await Promise.all([
    // キャラクター反応
    activeCharacters.length > 0
      ? Promise.all(
          activeCharacters.map((char) =>
            getCharacterReaction(
              char,
              keyword,
              modifiedText,
              bookTitle,
              apiKey
            ).catch((error) => {
              console.warn(`[Orchestrator] Character ${char.id} reaction failed:`, error)
              return {
                characterId: char.id,
                reaction: '',
                emotionalState: 'happy' as const,
                narrativeImpact: '',
              } satisfies CharacterReaction
            })
          )
        )
      : Promise.resolve([] as CharacterReaction[]),

    // 整合性チェック
    checkConsistency({
      bookTitle,
      pageRole,
      fixedElements,
      previousPages,
      modifiedText,
      apiKey,
    }),
  ])

  // 有効な反応のみフィルタ
  const validReactions = reactions.filter((r) => r.reaction.length > 0)

  // 画像プロンプトへの追加指示を構築
  const emotionalDescriptions = validReactions
    .map((r) => {
      const char = activeCharacters.find((c) => c.id === r.characterId)
      return `${char?.name || r.characterId} looks ${r.emotionalState}`
    })
    .join(', ')

  const imagePromptAdditions = [
    `Scene incorporates "${keyword}" theme`,
    emotionalDescriptions ? `Characters: ${emotionalDescriptions}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  // 整合性チェック結果に基づきテキストを決定
  const finalText = consistencyResult.approved ? modifiedText : consistencyResult.correctedText

  return {
    approved: consistencyResult.approved,
    modifiedText: finalText,
    characterReactions: validReactions,
    imagePromptAdditions,
  }
}

/** 整合性チェック */
async function checkConsistency(params: {
  bookTitle: string
  pageRole: string
  fixedElements: string[]
  previousPages: { pageNumber: number; currentText: string }[]
  modifiedText: string
  apiKey: string
}): Promise<{ approved: boolean; correctedText: string }> {
  const { bookTitle, pageRole, fixedElements, previousPages, modifiedText, apiKey } = params

  try {
    const genai = new GoogleGenAI({ apiKey })

    const prompt = buildConsistencyCheckPrompt({
      bookTitle,
      pageRole,
      fixedElements,
      previousPages,
      modifiedText,
    })

    const response = await genai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { safetySettings: CHILD_SAFE_SETTINGS },
    })

    const result = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK'

    if (result === 'OK') {
      return { approved: true, correctedText: modifiedText }
    }

    // 修正版テキストが返された
    return { approved: false, correctedText: result }
  } catch (error) {
    console.warn('[Orchestrator] Consistency check failed, approving as-is:', error)
    return { approved: true, correctedText: modifiedText }
  }
}
