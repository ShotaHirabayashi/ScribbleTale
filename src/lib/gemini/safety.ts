import { HarmCategory, HarmBlockThreshold } from '@google/genai'
import type { SafetySetting } from '@google/genai'

/**
 * 子ども向けアプリ用の Safety Settings
 *
 * BLOCK_LOW_AND_ABOVE: 最も厳格なフィルタリング
 * 不適切なコンテンツが生成されるリスクを最小化する
 */
export const CHILD_SAFE_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
]
