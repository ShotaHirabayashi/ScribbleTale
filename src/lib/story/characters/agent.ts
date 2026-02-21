import { GoogleGenAI } from '@google/genai'
import { buildCharacterReactionPrompt } from '@/lib/gemini/prompts'
import { CHILD_SAFE_SETTINGS } from '@/lib/gemini/safety'
import type { CharacterAgent, CharacterReaction, CharacterState } from '@/lib/types'

const TEXT_MODEL = 'gemini-3-flash-preview'

/** キャラクターの反応を生成 */
export async function getCharacterReaction(
  agent: CharacterAgent,
  keyword: string,
  sceneContext: string,
  bookTitle: string,
  apiKey: string,
  characterState?: CharacterState
): Promise<CharacterReaction> {
  const genai = new GoogleGenAI({ apiKey })

  const prompt = buildCharacterReactionPrompt({
    bookTitle,
    characterName: agent.name,
    personality: agent.personality,
    reactionStyle: agent.reactionStyle,
    keyword,
    sceneContext,
    characterState,
  })

  const response = await genai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { safetySettings: CHILD_SAFE_SETTINGS },
  })

  const reactionText = response.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return {
    characterId: agent.id,
    reaction: reactionText.trim(),
    emotionalState: inferEmotionalState(reactionText, keyword),
    narrativeImpact: `${agent.name}が「${keyword}」に反応した`,
  }
}

/** テキストから感情状態を推論（簡易版） */
function inferEmotionalState(
  text: string,
  _keyword: string
): CharacterReaction['emotionalState'] {
  if (text.includes('！') || text.includes('わーい') || text.includes('やった')) return 'excited'
  if (text.includes('？') || text.includes('えっ') || text.includes('びっくり')) return 'surprised'
  if (text.includes('こわい') || text.includes('だいじょうぶ') || text.includes('きをつけ')) return 'worried'
  if (text.includes('うれしい') || text.includes('たのしい') || text.includes('すてき')) return 'happy'
  return 'happy'
}
