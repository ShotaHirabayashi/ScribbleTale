import { GoogleGenAI } from '@google/genai'
import { getCharacterReaction } from './characters/agent'
import { momotaroCharacters } from './characters/momotaro-chars'
import { akazukinCharacters } from './characters/akazukin-chars'
import { wizardOfOzCharacters } from './characters/wizard-of-oz-chars'
import { buildConsistencyCheckPrompt } from '@/lib/gemini/prompts'
import { CHILD_SAFE_SETTINGS } from '@/lib/gemini/safety'
import type { CharacterAgent, CharacterReaction, CharacterState, OrchestratorResult, StoryPage, BoldnessConfig } from '@/lib/types'

const TEXT_MODEL = 'gemini-3-flash-preview'

const characterMap: Record<string, CharacterAgent[]> = {
  momotaro: momotaroCharacters,
  akazukin: akazukinCharacters,
  'wizard-of-oz': wizardOfOzCharacters,
}

/** キャラクターエージェントを並列呼び出しし、反応を統合 + 整合性チェック */
export async function orchestrate(params: {
  bookId: string
  bookTitle: string
  keyword: string
  childUtterance?: string
  targetPage: StoryPage
  modifiedText: string
  previousPages: { pageNumber: number; currentText: string }[]
  apiKey: string
  characterStates?: CharacterState[]
  boldnessConfig?: BoldnessConfig
}): Promise<OrchestratorResult> {
  const { bookId, bookTitle, keyword, childUtterance, targetPage, modifiedText, previousPages, apiKey, characterStates, boldnessConfig } = params

  const allCharacters = characterMap[bookId] || []
  const pageNumber = targetPage.pageNumber || targetPage.id

  // 該当ページに登場するキャラクターをフィルタ
  const activeCharacters = allCharacters.filter((c) =>
    c.appearsInPages.includes(pageNumber)
  )

  const pageRole = targetPage.pageRole || `ページ${targetPage.id}の物語`
  const fixedElements = targetPage.fixedElements || [pageRole]

  // キャラ状態を引くためのマップ
  const charStateMap = new Map<string, CharacterState>()
  if (characterStates) {
    for (const cs of characterStates) {
      charStateMap.set(cs.characterId, cs)
    }
  }

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
              apiKey,
              charStateMap.get(char.id)
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
      childUtterance,
      apiKey,
      characterStates,
      pageNumber,
      boldnessConfig,
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
    characterStateUpdates: consistencyResult.characterUpdates,
  }
}

/** 整合性チェック */
async function checkConsistency(params: {
  bookTitle: string
  pageRole: string
  fixedElements: string[]
  previousPages: { pageNumber: number; currentText: string }[]
  modifiedText: string
  childUtterance?: string
  apiKey: string
  characterStates?: CharacterState[]
  pageNumber?: number
  boldnessConfig?: BoldnessConfig
}): Promise<{ approved: boolean; correctedText: string; characterUpdates?: CharacterState[] }> {
  const { bookTitle, pageRole, fixedElements, previousPages, modifiedText, childUtterance, apiKey, characterStates, pageNumber, boldnessConfig } = params

  // consistencyMode === 'off' → チェックスキップ
  if (boldnessConfig?.consistencyMode === 'off') {
    return { approved: true, correctedText: modifiedText }
  }

  try {
    const genai = new GoogleGenAI({ apiKey })

    const prompt = buildConsistencyCheckPrompt({
      bookTitle,
      pageRole,
      fixedElements,
      previousPages,
      modifiedText,
      childUtterance,
      characterStates,
      pageNumber,
      boldnessConfig,
    })

    const response = await genai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { safetySettings: CHILD_SAFE_SETTINGS },
    })

    const result = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK'

    // JSON形式のレスポンスをパース
    try {
      // コードブロック (```json ... ```) を除去
      const jsonStr = result.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(jsonStr) as {
        approved: boolean
        correctedText?: string
        characterUpdates?: {
          characterId: string
          currentAppearance: string
          currentPersonality: string
          changeDescription?: string
        }[]
      }

      // キャラクター状態を CharacterState[] に変換
      const characterUpdates: CharacterState[] | undefined = parsed.characterUpdates?.map((cu) => {
        // 既存の状態があればマージ
        const existing = characterStates?.find((cs) => cs.characterId === cu.characterId)
        const newChanges = cu.changeDescription
          ? [
              ...(existing?.changes || []),
              {
                pageNumber: pageNumber || 0,
                description: cu.changeDescription,
                timestamp: Date.now(),
              },
            ]
          : existing?.changes || []

        return {
          characterId: cu.characterId,
          currentAppearance: cu.currentAppearance,
          currentPersonality: cu.currentPersonality,
          relationshipChanges: existing?.relationshipChanges || [],
          changes: newChanges,
        }
      })

      if (parsed.approved) {
        return { approved: true, correctedText: modifiedText, characterUpdates }
      }

      const corrected = (parsed.correctedText || modifiedText).replace(/\\n/g, '\n')
      return { approved: false, correctedText: corrected, characterUpdates }
    } catch {
      // JSON パース失敗 → 旧形式フォールバック
      if (result === 'OK') {
        return { approved: true, correctedText: modifiedText }
      }
      return { approved: false, correctedText: result.replace(/\\n/g, '\n') }
    }
  } catch (error) {
    console.warn('[Orchestrator] Consistency check failed, approving as-is:', error)
    return { approved: true, correctedText: modifiedText }
  }
}
