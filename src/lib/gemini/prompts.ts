/** 絵本イラストの画風を統一するためのベースプロンプト */
export const BASE_ART_STYLE_PROMPT = `Japanese picture book illustration, soft watercolor and colored pencil,
muted pastel tones, wide white margins, gentle hand-drawn lines,
natural paper texture, minimal detail, consistent character design,
portrait orientation (3:4 aspect ratio), vertical composition`

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
  fixedElements: string[]
  previousPages: { pageNumber: number; currentText: string }[]
}): string {
  const { bookTitle, pageRole, originalText, keyword, fixedElements, previousPages } = params

  const prevContext = previousPages
    .map((p) => `ページ${p.pageNumber}: ${p.currentText}`)
    .join('\n')

  return `あなたは子供向け絵本「${bookTitle}」の物語を書き換える作家です。

## ルール
1. このページの役割「${pageRole}」は必ず守ってください（固定要素）
2. 固定要素: ${fixedElements.join(', ')}
3. 子どものキーワード「${keyword}」を物語に自然に組み込んでください
4. ひらがな中心で、3〜6歳の子どもに伝わる文章にしてください
5. 文章は4〜6行程度にしてください
6. これまでの物語の流れと矛盾しないようにしてください

## これまでの物語
${prevContext || 'なし（最初のページ）'}

## 元のテキスト
${originalText}

## 指示
上記のルールに従い、キーワード「${keyword}」を使って、このページの物語テキストを書き換えてください。
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
}): string {
  const { bookTitle, characterName, personality, reactionStyle, keyword, sceneContext } = params

  return `あなたは絵本「${bookTitle}」の「${characterName}」です。

性格: ${personality}
反応スタイル: ${reactionStyle}

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
}): string {
  const { bookTitle, pageRole, originalText, fixedElements, previousPages } = params

  const prevContext = previousPages
    .map((p) => `ページ${p.pageNumber}: ${p.currentText}`)
    .join('\n')

  return `あなたは子供向け絵本「${bookTitle}」の物語を書き換える作家です。

## ルール
1. このページの役割「${pageRole}」は必ず守ってください（固定要素）
2. 固定要素: ${fixedElements.join(', ')}
3. これまでの物語の流れ（改変含む）を踏まえて、このページを自然に書き換えてください
4. ひらがな中心で、3〜6歳の子どもに伝わる文章にしてください
5. 文章は4〜6行程度にしてください
6. これまでの物語の流れと矛盾しないようにしてください

## これまでの物語
${prevContext || 'なし（最初のページ）'}

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
}): string {
  const { bookTitle, pageRole, fixedElements, previousPages, modifiedText } = params

  const prevContext = previousPages
    .map((p) => `ページ${p.pageNumber}: ${p.currentText}`)
    .join('\n')

  return `あなたは子供向け絵本「${bookTitle}」の物語の整合性を確認する編集者です。

## このページの固定要素（必ず守るべき）
${fixedElements.join(', ')}

## このページの役割
${pageRole}

## これまでの物語
${prevContext || 'なし（最初のページ）'}

## 改変後テキスト
${modifiedText}

## 確認項目
1. 固定要素が守られているか
2. これまでの物語と矛盾していないか
3. キャラクターの行動に整合性があるか

整合性に問題がない場合: 「OK」のみ出力
問題がある場合: 修正版テキストのみ出力（説明不要）`
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
