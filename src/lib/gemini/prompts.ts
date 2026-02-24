/** 絵本イラストの画風を統一するためのベースプロンプト */
export const BASE_ART_STYLE_PROMPT = `Japanese picture book illustration, soft watercolor and colored pencil,
muted pastel tones, wide white margins, gentle hand-drawn lines,
natural paper texture, minimal detail, consistent character design,
portrait orientation (3:4 aspect ratio), vertical composition.
CRITICAL: Do NOT include any text, letters, words, titles, numbers, or characters in the image. The illustration must be purely visual with NO text of any kind.`

import type { CharacterState, BoldnessConfig } from '@/lib/types'

/** キャラクター状態をプロンプト用テキストに変換 */
export function buildCharacterStatesSection(characterStates: CharacterState[]): string {
  if (characterStates.length === 0) return ''

  const lines = characterStates.map((cs) => {
    const parts = [`- ${cs.characterId}: 見た目=${cs.currentAppearance}, 性格=${cs.currentPersonality}`]
    if (cs.relationshipChanges.length > 0) {
      parts.push(`  関係の変化: ${cs.relationshipChanges.join(', ')}`)
    }
    if (cs.changes.length > 0) {
      const recent = cs.changes.slice(-3) // 直近3件
      parts.push(`  最近の変化: ${recent.map((c) => `ページ${c.pageNumber}で${c.description}`).join(' → ')}`)
    }
    return parts.join('\n')
  })

  return `\n## キャラクターの現在の状態\n${lines.join('\n')}\n`
}

/** 画像生成プロンプトを構築する */
export function buildImagePrompt(
  sceneDescription: string,
  keyword?: string
): string {
  const parts = [BASE_ART_STYLE_PROMPT, sceneDescription]

  if (keyword) {
    parts.push(
      `The scene incorporates the theme of "${keyword}" naturally into the illustration style and setting.`
    )
  }

  return parts.join('\n\n')
}

/** 改変テキスト生成プロンプト */
export function buildModificationPrompt(params: {
  bookTitle: string
  pageRole: string
  originalText: string
  keyword: string
  childUtterance?: string
  fixedElements: string[]
  previousPages: { pageNumber: number; currentText: string }[]
  characterStates?: CharacterState[]
  boldnessConfig?: BoldnessConfig
  remixPrompt?: string
}): string {
  const { bookTitle, pageRole, originalText, keyword, childUtterance, fixedElements, previousPages, characterStates, boldnessConfig, remixPrompt } = params

  const prevContext = previousPages
    .map((p) => `ページ${p.pageNumber}: ${p.currentText}`)
    .join('\n')

  const utteranceSection = childUtterance && childUtterance !== keyword
    ? `\n## 子どもの発言\n「${childUtterance}」\n`
    : ''

  const charSection = characterStates ? buildCharacterStatesSection(characterStates) : ''

  // boldnessConfig に応じてルールを動的生成
  const rules: string[] = []
  if (boldnessConfig?.enforcePageRole) {
    rules.push(`このページの役割「${pageRole}」は必ず守ってください（固定要素）`)
  } else if (boldnessConfig) {
    rules.push(`このページの元の役割は「${pageRole}」ですが、子どもの発言に合わせて自由に変えてもかまいません`)
  } else {
    rules.push(`このページの役割「${pageRole}」は必ず守ってください（固定要素）`)
  }

  if (!boldnessConfig || boldnessConfig.fixedElementsMode === 'strict') {
    rules.push(`固定要素: ${fixedElements.join(', ')}`)
  } else if (boldnessConfig.fixedElementsMode === 'loose') {
    rules.push(`固定要素（できるだけ守ってください）: ${fixedElements.join(', ')}`)
  }
  // 'ignore' の場合は fixedElements のルールを追加しない

  rules.push('子どもの発言の意図をできるだけ反映して物語を書き換えてください')
  rules.push('ひらがな中心で、3〜6歳の子どもに伝わる文章にしてください')
  rules.push('文章は4〜6行程度にしてください')

  if (!boldnessConfig || boldnessConfig.consistencyMode !== 'off') {
    rules.push('これまでの物語の流れと矛盾しないようにしてください')
  } else {
    rules.push('これまでの物語と大きく矛盾しなければ、新しい展開も歓迎です')
  }

  rules.push('キャラクターの現在の状態（見た目・性格の変化）を必ず反映してください')

  const rulesSection = rules.map((r, i) => `${i + 1}. ${r}`).join('\n')

  const guidanceSection = boldnessConfig?.promptGuidance
    ? `\n## 改変の方針\n${boldnessConfig.promptGuidance}\n`
    : ''

  const remixSection = remixPrompt
    ? `\n## この物語のカスタマイズ設定\n「${remixPrompt}」\n`
    : ''

  return `あなたは子供向け絵本「${bookTitle}」の物語を書き換える作家です。
${remixSection}${guidanceSection}
## ルール
${rulesSection}

## これまでの物語
${prevContext || 'なし（最初のページ）'}
${charSection}
## 元のテキスト
${originalText}
${utteranceSection}
## 指示
子どもが「${keyword}」と言いました。${childUtterance && childUtterance !== keyword ? `具体的には「${childUtterance}」という意図です。この意図をできるだけ忠実に反映して、` : ''}このページの物語テキストを書き換えてください。
改行は\\nで区切ってください。
テキストのみ出力してください。説明や注釈は不要です。`
}

/** キャラクター反応生成プロンプト */
export function buildCharacterReactionPrompt(params: {
  bookTitle: string
  characterName: string
  personality: string
  reactionStyle: string
  keyword: string
  sceneContext: string
  characterState?: CharacterState
}): string {
  const { bookTitle, characterName, personality, reactionStyle, keyword, sceneContext, characterState } = params

  const stateSection = characterState
    ? `\n現在の見た目: ${characterState.currentAppearance}\n現在の性格: ${characterState.currentPersonality}${characterState.changes.length > 0 ? `\nこれまでの変化: ${characterState.changes.map((c) => `ページ${c.pageNumber}で${c.description}`).join(' → ')}` : ''}\n`
    : ''

  return `あなたは絵本「${bookTitle}」の「${characterName}」です。

性格: ${personality}
反応スタイル: ${reactionStyle}
${stateSection}
いま、子どもが「${keyword}」と言いました。
場面: ${sceneContext}

${characterName}はどう反応しますか？

ひらがな中心で、3歳〜6歳の子どもに伝わる短い一言（1〜2文）で答えてください。
セリフのみ出力してください。`
}

/** 落書き認識プロンプト */
export const DRAWING_RECOGNITION_PROMPT = `この画像に描かれている落書き/絵を認識してください。
子どもが描いた簡単な絵だと想定してください。

以下のJSON形式で回答してください:
{
  "keyword": "認識した物の名前（ひらがな）",
  "confidence": 0.0-1.0,
  "description": "絵の簡単な説明"
}

JSONのみ出力してください。`

/** 波及再生成プロンプト（キーワードなし・文脈のみ） */
export function buildContextRegenerationPrompt(params: {
  bookTitle: string
  pageRole: string
  originalText: string
  fixedElements: string[]
  previousPages: { pageNumber: number; currentText: string }[]
  characterStates?: CharacterState[]
  boldnessConfig?: BoldnessConfig
  remixPrompt?: string
}): string {
  const { bookTitle, pageRole, originalText, fixedElements, previousPages, characterStates, boldnessConfig, remixPrompt } = params

  const prevContext = previousPages
    .map((p) => `ページ${p.pageNumber}: ${p.currentText}`)
    .join('\n')

  const charSection = characterStates ? buildCharacterStatesSection(characterStates) : ''

  // boldnessConfig に応じてルールを動的生成
  const rules: string[] = []
  if (boldnessConfig?.enforcePageRole === false) {
    rules.push(`このページの元の役割は「${pageRole}」ですが、前のページの流れに合わせて自由に変えてもかまいません`)
  } else {
    rules.push(`このページの役割「${pageRole}」は必ず守ってください（固定要素）`)
  }

  if (!boldnessConfig || boldnessConfig.fixedElementsMode === 'strict') {
    rules.push(`固定要素: ${fixedElements.join(', ')}`)
  } else if (boldnessConfig.fixedElementsMode === 'loose') {
    rules.push(`固定要素（できるだけ守ってください）: ${fixedElements.join(', ')}`)
  }

  rules.push('これまでの物語の流れ（改変含む）を踏まえて、このページを自然に書き換えてください')
  rules.push('ひらがな中心で、3〜6歳の子どもに伝わる文章にしてください')
  rules.push('文章は4〜6行程度にしてください')
  rules.push('これまでの物語の流れと矛盾しないようにしてください')
  rules.push('キャラクターの現在の状態（見た目・性格の変化）を必ず反映してください')

  const rulesSection = rules.map((r, i) => `${i + 1}. ${r}`).join('\n')

  const remixSection = remixPrompt
    ? `\n## この物語のカスタマイズ設定\n「${remixPrompt}」\n`
    : ''

  return `あなたは子供向け絵本「${bookTitle}」の物語を書き換える作家です。
${remixSection}
## ルール
${rulesSection}

## これまでの物語
${prevContext || 'なし（最初のページ）'}
${charSection}
## 元のテキスト
${originalText}

## 指示
上記のルールに従い、これまでの物語の流れを踏まえて、このページの物語テキストを自然に書き換えてください。
改行は\\nで区切ってください。
テキストのみ出力してください。説明や注釈は不要です。`
}

/** 整合性チェックプロンプト */
export function buildConsistencyCheckPrompt(params: {
  bookTitle: string
  pageRole: string
  fixedElements: string[]
  previousPages: { pageNumber: number; currentText: string }[]
  modifiedText: string
  childUtterance?: string
  characterStates?: CharacterState[]
  pageNumber?: number
  boldnessConfig?: BoldnessConfig
}): string {
  const { bookTitle, pageRole, fixedElements, previousPages, modifiedText, childUtterance, characterStates, pageNumber, boldnessConfig } = params

  const prevContext = previousPages
    .map((p) => `ページ${p.pageNumber}: ${p.currentText}`)
    .join('\n')

  const utteranceNote = childUtterance
    ? `\n\n## 子どもの発言（この意図は必ず尊重すること）\n「${childUtterance}」`
    : ''

  const charSection = characterStates ? buildCharacterStatesSection(characterStates) : ''

  // relaxed モードでは確認項目を絞る
  const isRelaxed = boldnessConfig?.consistencyMode === 'relaxed'

  const fixedElementsSection = (!boldnessConfig || boldnessConfig.fixedElementsMode === 'strict')
    ? `## このページの固定要素（必ず守るべき）\n${fixedElements.join(', ')}`
    : boldnessConfig.fixedElementsMode === 'loose'
    ? `## このページの固定要素（参考程度）\n${fixedElements.join(', ')}`
    : '## 固定要素\nなし（自由に変更可能）'

  const checkItems = isRelaxed
    ? `## 確認項目
1. 物語として成立しているか（文章が子ども向けとして適切か）
2. 有害な内容が含まれていないか`
    : `## 確認項目
1. 固定要素が守られているか
2. これまでの物語と矛盾していないか
3. キャラクターの行動に整合性があるか
4. 子どもの発言の意図が反映されているか
5. キャラクターの見た目や性格に変化があったか`

  return `あなたは子供向け絵本「${bookTitle}」の物語の整合性を確認する編集者です。

${fixedElementsSection}

## このページの役割
${pageRole}

## これまでの物語
${prevContext || 'なし（最初のページ）'}
${charSection}${utteranceNote}

## 改変後テキスト
${modifiedText}

${checkItems}

重要: 子どもの発言の意図（例: 登場人物の変更など）は最優先で尊重してください。

以下のJSON形式で出力してください:
{
  "approved": true または false,
  "correctedText": "（問題がある場合のみ修正版テキスト。OKなら空文字）",
  "characterUpdates": [
    {
      "characterId": "キャラクターID",
      "currentAppearance": "現在の見た目の説明",
      "currentPersonality": "現在の性格の説明",
      "changeDescription": "このページでの変化の説明（変化がなければ空文字）"
    }
  ]
}

注意:
- characterUpdatesには改変後テキストに登場する全キャラクターの現在状態を含めてください
- changeDescriptionはこのページ（ページ${pageNumber || '?'}）での変化のみ記述してください
- 変化がないキャラは changeDescription を空文字にしてください
- JSONのみ出力してください。説明や注釈は不要です。`
}

/** 表紙画像生成プロンプト */
export function buildCoverImagePrompt(params: {
  title: string
  storyId: string
  storySummary: string
}): string {
  const { title, storyId, storySummary } = params

  return `${BASE_ART_STYLE_PROMPT}

Create a beautiful picture book COVER illustration for a children's story.

Title: "${title}"
Story ID: ${storyId}
Story summary: ${storySummary}

COVER COMPOSITION REQUIREMENTS:
- Design as a book cover: the main subject should be centered and prominent
- Leave empty space at the top ~20% for the title text overlay
- Leave empty space at the bottom ~10% for the author name
- Use a warm, inviting composition that captures the story's essence
- Include the main character(s) in a iconic, memorable pose
- Background should be simple but atmospheric, suggesting the story's world
- Colors should be vibrant yet soft, appealing to young children
- The overall mood should feel magical and welcoming
- Portrait orientation (3:4 aspect ratio), vertical composition
- CRITICAL: Do NOT include any text, letters, words, titles, numbers, or characters in the image. No text of any kind. The title and author name will be overlaid separately.`
}

/** Story Remix プロンプト: 全ページのテキストをリミックス */
export function buildStoryRemixPrompt(params: {
  bookTitle: string
  remixPrompt: string
  pages: { pageNumber: number; pageRole?: string; text: string }[]
}): string {
  const { bookTitle, remixPrompt, pages } = params

  const pagesSection = pages
    .map((p) => `ページ${p.pageNumber}${p.pageRole ? `（${p.pageRole}）` : ''}: ${p.text}`)
    .join('\n')

  return `あなたは子供向け絵本「${bookTitle}」を新しい設定で書き直す作家です。

## ユーザーの設定指示
「${remixPrompt}」

## 元のストーリー構成
${pagesSection}

## ルール
1. 元の物語の「起承転結の流れ」は緩く参考にしてください（完全に変えてもOK）
2. ユーザーの設定指示を最大限に反映してください
3. ひらがな中心で、3〜6歳の子どもに伝わる文章にしてください
4. 各ページ4〜6行程度にしてください
5. キャラクター名は元の物語のものを使ってください（性格や関係性は自由に変更OK）
6. 最初のページはタイトルページです。タイトルと短い紹介文を書いてください

## 出力形式
以下のJSON配列で全ページのテキストを出力してください:
[
  {"pageNumber": 1, "text": "..."},
  {"pageNumber": 2, "text": "..."}
]
JSONのみ出力してください。説明や注釈は不要です。`
}

/** 画像編集プロンプト（改変時） */
export function buildImageEditPrompt(params: {
  originalDescription: string
  keyword: string
  modifiedText: string
}): string {
  const { originalDescription, keyword, modifiedText } = params

  return `${BASE_ART_STYLE_PROMPT}

Modify this illustration to match the following scene:
"${modifiedText}"

Key change: incorporate "${keyword}" into the scene naturally.
Original scene was: "${originalDescription}"

Maintain the same art style, color palette, and character proportions.
Keep the soft, gentle aesthetic suitable for a children's picture book.
Use portrait orientation (3:4 aspect ratio) with vertical composition.`
}
