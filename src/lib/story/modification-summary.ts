import type { Modification } from '@/lib/types'

const BOOK_TITLES: Record<string, string> = {
  momotaro: 'ももたろう',
  akazukin: 'あかずきん',
}

/** Modification配列からOGP表示用ハイライトを生成（最大maxCount件） */
export function generateModificationHighlights(
  modifications: Modification[],
  maxCount = 3
): string[] {
  if (!modifications || modifications.length === 0) return []

  // ページ番号ごとにグルーピングし、最初の改変のinputを使う
  const byPage = new Map<number, Modification>()
  for (const mod of modifications) {
    if (!byPage.has(mod.targetPageNumber)) {
      byPage.set(mod.targetPageNumber, mod)
    }
  }

  // ページ番号順でソートし、maxCount件まで取得
  const sorted = [...byPage.entries()]
    .sort(([a], [b]) => a - b)
    .slice(0, maxCount)

  return sorted.map(([, mod]) => {
    // inputを30文字以内に切り詰め
    const text = mod.input.length > 30
      ? mod.input.slice(0, 28) + '…'
      : mod.input
    return text
  })
}

/** generateMetadata用のdescription文生成 */
export function generateOGDescription(
  bookId: string,
  modifications: Modification[]
): string {
  const title = BOOK_TITLES[bookId] ?? bookId

  if (!modifications || modifications.length === 0) {
    return `世界にひとつだけの『${title}』- AIと子どもが一緒につくった絵本`
  }

  const highlights = generateModificationHighlights(modifications, 2)
  const summary = highlights.join('、')
  return `${summary} …こどもの声で変わった『${title}』を読んでみよう`
}
