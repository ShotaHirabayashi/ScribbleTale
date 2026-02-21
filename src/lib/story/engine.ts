import { GoogleGenAI } from '@google/genai'
import { buildModificationPrompt, buildContextRegenerationPrompt } from '@/lib/gemini/prompts'
import { CHILD_SAFE_SETTINGS } from '@/lib/gemini/safety'
import type { StoryPage, Modification } from '@/lib/types'

const TEXT_MODEL = 'gemini-2.5-flash-preview-05-20'

/**
 * 改変エンジン
 *
 * 20%固定 / 80%自由ルール:
 * - 固定: ページの物語上の役割（pageRole）
 * - 自由: それ以外の全て（舞台・キャラの見た目・出来事の詳細等）
 *
 * 子どものキーワードを受け取り、「現在のページ」を改変する。
 */
export async function modifyCurrentPage(params: {
  bookTitle: string
  keyword: string
  currentPageIndex: number
  pages: StoryPage[]
  trigger: 'voice' | 'drawing'
  apiKey: string
}): Promise<{
  modifiedText: string
  modification: Modification
  targetPageIndex: number
}> {
  const { bookTitle, keyword, currentPageIndex, pages, trigger, apiKey } = params

  // 現在のページを改変対象とする
  const targetPageIndex = currentPageIndex

  const targetPage = pages[targetPageIndex]
  const pageRole = targetPage.pageRole || `ページ${targetPage.id}の物語`
  const fixedElements = targetPage.fixedElements || [pageRole]
  const originalText = targetPage.originalText || targetPage.text

  // これまでのページの文脈を収集（自分自身を含まない）
  const previousPages = pages
    .slice(0, targetPageIndex)
    .map((p) => ({
      pageNumber: p.pageNumber || p.id,
      currentText: p.currentText || p.text,
    }))

  const genai = new GoogleGenAI({ apiKey })

  const prompt = buildModificationPrompt({
    bookTitle,
    pageRole,
    originalText,
    keyword,
    fixedElements,
    previousPages,
  })

  const response = await genai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { safetySettings: CHILD_SAFE_SETTINGS },
  })

  const modifiedText = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || originalText

  const modification: Modification = {
    timestamp: Date.now(),
    pageNumber: targetPage.pageNumber || targetPage.id,
    targetPageNumber: targetPage.pageNumber || targetPage.id,
    trigger,
    input: keyword,
    beforeText: originalText,
    afterText: modifiedText,
  }

  return {
    modifiedText,
    modification,
    targetPageIndex,
  }
}

/**
 * 波及再生成 - 前ページの改変を反映して文脈に基づきページテキストを再生成
 */
export async function regeneratePageInContext(params: {
  bookTitle: string
  currentPageIndex: number
  pages: StoryPage[]
  apiKey: string
}): Promise<{ modifiedText: string; targetPageIndex: number }> {
  const { bookTitle, currentPageIndex, pages, apiKey } = params

  const targetPage = pages[currentPageIndex]
  const pageRole = targetPage.pageRole || `ページ${targetPage.id}の物語`
  const fixedElements = targetPage.fixedElements || [pageRole]
  const originalText = targetPage.originalText || targetPage.text

  const previousPages = pages
    .slice(0, currentPageIndex)
    .map((p) => ({
      pageNumber: p.pageNumber || p.id,
      currentText: p.currentText || p.text,
    }))

  const genai = new GoogleGenAI({ apiKey })

  const prompt = buildContextRegenerationPrompt({
    bookTitle,
    pageRole,
    originalText,
    fixedElements,
    previousPages,
  })

  const response = await genai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { safetySettings: CHILD_SAFE_SETTINGS },
  })

  const modifiedText = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || originalText

  return {
    modifiedText,
    targetPageIndex: currentPageIndex,
  }
}
