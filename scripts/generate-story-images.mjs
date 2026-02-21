#!/usr/bin/env node

/**
 * 全ページ画像生成スクリプト
 * Gemini 3 Pro Image で桃太郎12枚 + あかずきん12枚 = 合計24枚を生成
 *
 * Usage: node scripts/generate-story-images.mjs
 */

import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

// --- 設定 ---
const MODEL = 'gemini-3-pro-image-preview'
const DELAY_MS = 5000
const MAX_RETRIES = 3

// .env.local から API Key を読み込む
function loadApiKey() {
  const envPath = path.join(PROJECT_ROOT, '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local が見つかりません')
  }
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const match = envContent.match(/^GEMINI_API_KEY=(.+)$/m)
  if (!match) {
    throw new Error('GEMINI_API_KEY が .env.local に設定されていません')
  }
  return match[1].trim()
}

const BASE_ART_STYLE_PROMPT = `Japanese picture book illustration, soft watercolor and colored pencil style, warm and gentle colors, child-friendly, high quality, detailed, beautiful lighting, studio ghibli inspired warmth.`

const MOMOTARO_CHARACTER_DESC = `A young Japanese boy wearing a headband and traditional outfit.`
const AKAZUKIN_CHARACTER_DESC = `A young girl wearing a red hood/cap and a simple dress.`

const NO_TEXT_INSTRUCTION = `Do not include any text, letters, words, numbers, or characters in the image. The image should be purely visual with no writing whatsoever.`

// --- ページデータ ---
const momotaroPages = [
  { num: 1, alt: '大きな桃が川をゆっくり流れている、桜の花びらが舞う美しい風景' },
  { num: 2, alt: 'おじいさんが山へしばかりに行き、おばあさんが川で洗濯をしている穏やかな田舎の風景' },
  { num: 3, alt: 'おばあさんが川で大きな桃が流れてくるのを驚いて見つける' },
  { num: 4, alt: 'おじいさんとおばあさんが桃から生まれた元気な赤ちゃんを見て驚き喜んでいる' },
  { num: 5, alt: 'たくましく成長したももたろうが力強いポーズを取っている' },
  { num: 6, alt: 'ももたろうがきびだんごの包みを腰につけ、手を振って出発する。おじいさんとおばあさんが門で見送っている' },
  { num: 7, alt: '道の途中でももたろうがいぬにきびだんごをあげている' },
  { num: 8, alt: 'ももたろう、いぬ、さる、きじの4人が楽しそうに道を歩いている' },
  { num: 9, alt: 'ももたろうと動物の仲間たちが船に乗って海を渡り、遠くに鬼ヶ島が見える' },
  { num: 10, alt: 'ももたろうたちが鬼ヶ島の大きな門の前に立ち、中から鬼たちがこちらを見ている' },
  { num: 11, alt: 'ももたろうと仲間たちが鬼たちと勇敢に戦い、鬼たちが降参している' },
  { num: 12, alt: 'ももたろうが宝物を持って帰り、おじいさんとおばあさんと動物の仲間たちがみんなで喜んでいる' },
]

const akazukinPages = [
  { num: 1, alt: '赤いずきんをかぶった女の子が花に囲まれた小さな家の前に立っている' },
  { num: 2, alt: 'あかずきんがお母さんと一緒に花でいっぱいの家の前に立っている' },
  { num: 3, alt: 'お母さんがあかずきんにお菓子の入ったかごを渡している' },
  { num: 4, alt: 'あかずきんが花が咲く森の小道を楽しそうに歩いている' },
  { num: 5, alt: '森の中であかずきんが大きなオオカミと向かい合って話している' },
  { num: 6, alt: 'あかずきんが森の中できれいな花を楽しそうに摘んでいる' },
  { num: 7, alt: 'オオカミが森の近道を走っておばあさんの家に向かっている' },
  { num: 8, alt: 'オオカミがおばあさんの服を着てベッドに寝ている' },
  { num: 9, alt: 'あかずきんがおばあさんの家のドアをノックしている' },
  { num: 10, alt: 'あかずきんがベッドのそばで変装したオオカミを不思議そうに見ている' },
  { num: 11, alt: 'たくましい猟師さんが現れてオオカミを追い払い、おばあさんを助けている' },
  { num: 12, alt: 'あかずきん、おばあさん、猟師さんが一緒にお茶とお菓子を楽しんでいる' },
]

// --- 生成関数 ---
async function generateSingleImage(genai, prompt, outputPath, retryCount = 0) {
  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['image', 'text'],
      },
    })

    const part = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    )

    if (!part?.inlineData?.data) {
      throw new Error('No image data in response')
    }

    const buffer = Buffer.from(part.inlineData.data, 'base64')
    fs.writeFileSync(outputPath, buffer)
    return true
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`  Retry ${retryCount + 1}/${MAX_RETRIES}: ${error.message}`)
      await sleep(DELAY_MS * 2)
      return generateSingleImage(genai, prompt, outputPath, retryCount + 1)
    }
    throw error
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- メイン ---
async function main() {
  const apiKey = loadApiKey()
  const genai = new GoogleGenAI({ apiKey })

  console.log('=== ストーリー画像生成 開始 ===')
  console.log(`Model: ${MODEL}`)
  console.log(`Total: 24 images (momotaro: 12, akazukin: 12)\n`)

  // 桃太郎
  console.log('--- ももたろう ---')
  const momotaroDir = path.join(PROJECT_ROOT, 'public/images/momotaro')
  fs.mkdirSync(momotaroDir, { recursive: true })

  for (const page of momotaroPages) {
    const fileName = `page-${String(page.num).padStart(2, '0')}.jpg`
    const outputPath = path.join(momotaroDir, fileName)

    // 既に存在する場合はスキップ
    if (fs.existsSync(outputPath)) {
      console.log(`  [SKIP] ${fileName} (already exists)`)
      continue
    }

    const prompt = `${BASE_ART_STYLE_PROMPT}\n\nScene: ${page.alt}\n\nCharacter description: ${MOMOTARO_CHARACTER_DESC}\n\n${NO_TEXT_INSTRUCTION}`

    console.log(`  [GEN] ${fileName} ...`)
    try {
      await generateSingleImage(genai, prompt, outputPath)
      console.log(`  [OK]  ${fileName}`)
    } catch (error) {
      console.error(`  [FAIL] ${fileName}: ${error.message}`)
    }

    await sleep(DELAY_MS)
  }

  // あかずきん
  console.log('\n--- あかずきん ---')
  const akazukinDir = path.join(PROJECT_ROOT, 'public/images/akazukin')
  fs.mkdirSync(akazukinDir, { recursive: true })

  for (const page of akazukinPages) {
    const fileName = `page-${String(page.num).padStart(2, '0')}.jpg`
    const outputPath = path.join(akazukinDir, fileName)

    // 既に存在する場合はスキップ
    if (fs.existsSync(outputPath)) {
      console.log(`  [SKIP] ${fileName} (already exists)`)
      continue
    }

    const prompt = `${BASE_ART_STYLE_PROMPT}\n\nScene: ${page.alt}\n\nCharacter description: ${AKAZUKIN_CHARACTER_DESC}\n\n${NO_TEXT_INSTRUCTION}`

    console.log(`  [GEN] ${fileName} ...`)
    try {
      await generateSingleImage(genai, prompt, outputPath)
      console.log(`  [OK]  ${fileName}`)
    } catch (error) {
      console.error(`  [FAIL] ${fileName}: ${error.message}`)
    }

    await sleep(DELAY_MS)
  }

  console.log('\n=== 画像生成 完了 ===')

  // 結果サマリー
  const momotaroFiles = fs.readdirSync(momotaroDir).filter(f => f.endsWith('.jpg'))
  const akazukinFiles = fs.readdirSync(akazukinDir).filter(f => f.endsWith('.jpg'))
  console.log(`ももたろう: ${momotaroFiles.length}/12 枚`)
  console.log(`あかずきん: ${akazukinFiles.length}/12 枚`)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
