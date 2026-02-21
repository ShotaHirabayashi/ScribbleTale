/**
 * 絵本ベース画像の一括生成スクリプト
 * 3:4 縦長 + 2K解像度 で全ページの画像を再生成する
 *
 * Usage: node scripts/generate-base-images.mjs
 */

import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

// .env.local から GEMINI_API_KEY を読み込む
const envPath = path.join(PROJECT_ROOT, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const apiKeyMatch = envContent.match(/^GEMINI_API_KEY=(.+)$/m)
if (!apiKeyMatch) {
  console.error('GEMINI_API_KEY not found in .env.local')
  process.exit(1)
}
const API_KEY = apiKeyMatch[1].trim()

const genai = new GoogleGenAI({ apiKey: API_KEY })

const BASE_ART_STYLE = `Japanese picture book illustration, soft watercolor and colored pencil,
muted pastel tones, wide white margins, gentle hand-drawn lines,
natural paper texture, minimal detail, consistent character design,
portrait orientation (3:4 aspect ratio), vertical composition`

const MODEL = 'gemini-2.5-flash-image'

// ももたろう 全12ページ
const momotaroPages = [
  { page: '01', prompt: `${BASE_ART_STYLE}\n\nTitle page illustration: A large beautiful peach floating down a gentle river, cherry blossom petals dancing in the air. Peaceful Japanese countryside scenery. The title "ももたろう" should be suggested by the composition.` },
  { page: '02', prompt: `${BASE_ART_STYLE}\n\nAn old grandfather heading to the mountains with a bundle of sticks, and an old grandmother doing laundry by a clear river. Peaceful Japanese countryside with a thatched-roof cottage, green hills, and warm sunlight.` },
  { page: '03', prompt: `${BASE_ART_STYLE}\n\nAn old grandmother at the riverside, amazed as an enormous peach floats toward her down the stream. The peach glows with a warm light. Splashing water, green riverbanks.` },
  { page: '04', prompt: `${BASE_ART_STYLE}\n\nInside a cozy Japanese cottage, an old couple looks astonished and joyful as a healthy baby boy emerges from a giant split-open peach on the wooden floor. Warm indoor lighting.` },
  { page: '05', prompt: `${BASE_ART_STYLE}\n\nA strong, kind-faced young boy (Momotaro) in traditional Japanese clothes stands heroically, looking toward the horizon with determination. Mountains and clouds behind him.` },
  { page: '06', prompt: `${BASE_ART_STYLE}\n\nMomotaro departing on his journey, carrying a pouch of kibidango (millet dumplings) at his waist. The old grandfather and grandmother wave goodbye at the gate of their home. A path stretches ahead into the distance.` },
  { page: '07', prompt: `${BASE_ART_STYLE}\n\nMomotaro meeting a friendly dog on a forest path. Momotaro offers a kibidango dumpling to the happy dog. Dappled sunlight through trees.` },
  { page: '08', prompt: `${BASE_ART_STYLE}\n\nMomotaro walking cheerfully with his three animal companions: a dog, a monkey, and a pheasant. They walk along a scenic path together as a team. Bright and adventurous mood.` },
  { page: '09', prompt: `${BASE_ART_STYLE}\n\nMomotaro and his animal friends sailing on a small boat across the ocean. In the distance, a dark and mysterious island (Onigashima) is visible. Dramatic sky with clouds.` },
  { page: '10', prompt: `${BASE_ART_STYLE}\n\nMomotaro and his companions standing before the massive gate of Onigashima (demon island). Colorful oni (demons) peek from behind the gate looking surprised. Stone walls and fortress-like setting.` },
  { page: '11', prompt: `${BASE_ART_STYLE}\n\nAn exciting but child-friendly battle scene: Momotaro bravely leads while the dog, monkey, and pheasant each fight alongside him. The oni look comically defeated and are surrendering. Dynamic but gentle composition.` },
  { page: '12', prompt: `${BASE_ART_STYLE}\n\nA heartwarming finale: Momotaro returns home carrying treasure, greeted joyfully by the old grandfather, grandmother, and his animal friends. Everyone celebrates together. Golden warm light, flowers blooming.` },
]

// あかずきん 全12ページ
const akazukinPages = [
  { page: '01', prompt: `${BASE_ART_STYLE}\n\nTitle page illustration: A cute little girl wearing a bright red hood and cape, standing in front of a charming flower-covered cottage. Flowers surround her, butterflies in the air. The title "あかずきん" should be suggested by the composition.` },
  { page: '02', prompt: `${BASE_ART_STYLE}\n\nA little girl in a red hood (Little Red Riding Hood) and her kind mother standing together in front of their cozy cottage surrounded by colorful flowers and a garden.` },
  { page: '03', prompt: `${BASE_ART_STYLE}\n\nA mother handing a basket of treats and cakes to Little Red Riding Hood at their doorway. The mother looks caring, the girl looks excited. Warm domestic scene.` },
  { page: '04', prompt: `${BASE_ART_STYLE}\n\nLittle Red Riding Hood walking happily along a sunlit path through a beautiful forest. Wildflowers bloom along the path, birds sing in the trees. Dappled green light.` },
  { page: '05', prompt: `${BASE_ART_STYLE}\n\nLittle Red Riding Hood meeting a big wolf in the forest. The wolf has a sly but not scary expression, trying to appear friendly. They face each other on the forest path.` },
  { page: '06', prompt: `${BASE_ART_STYLE}\n\nLittle Red Riding Hood happily picking beautiful wildflowers in a forest meadow, distracted from her path. Colorful flowers everywhere, butterflies, dreamy atmosphere.` },
  { page: '07', prompt: `${BASE_ART_STYLE}\n\nThe wolf running quickly through the forest on a shortcut path, heading toward grandmother's house. Trees blur with speed. The wolf looks mischievous.` },
  { page: '08', prompt: `${BASE_ART_STYLE}\n\nThe wolf wearing grandmother's nightgown and cap, lying in grandmother's bed, trying to look innocent but failing comically. Cozy bedroom with patchwork quilt.` },
  { page: '09', prompt: `${BASE_ART_STYLE}\n\nLittle Red Riding Hood arriving at grandmother's cottage, knocking on the wooden door. She carries her basket of treats. The cottage looks cozy but something feels slightly off.` },
  { page: '10', prompt: `${BASE_ART_STYLE}\n\nLittle Red Riding Hood standing by grandmother's bed, looking curiously at the disguised wolf. "What big eyes you have!" The wolf in bed tries to maintain the disguise. Indoor bedroom scene.` },
  { page: '11', prompt: `${BASE_ART_STYLE}\n\nA strong, brave woodcutter/hunter arriving just in time, chasing the wolf away. The grandmother is safe and relieved. Little Red Riding Hood looks grateful. Action scene but gentle.` },
  { page: '12', prompt: `${BASE_ART_STYLE}\n\nA warm happy ending: Little Red Riding Hood, grandmother, and the kind woodcutter sitting together having tea and cakes. Everyone smiling, cozy interior, flowers on the table.` },
]

const RATE_LIMIT_DELAY_MS = 12000 // 12秒間隔（API制限対策）

async function generateSingleImage(prompt, outputPath) {
  const response = await genai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['image', 'text'],
      imageConfig: {
        aspectRatio: '3:4',
        imageSize: '2K',
      },
    },
  })

  const part = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data
  )

  if (!part?.inlineData?.data) {
    throw new Error('No image generated')
  }

  const buffer = Buffer.from(part.inlineData.data, 'base64')
  fs.writeFileSync(outputPath, buffer)
  return buffer.length
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const outputDir = path.join(PROJECT_ROOT, 'public', 'images')

  // ディレクトリ確認
  for (const dir of ['momotaro', 'akazukin']) {
    const dirPath = path.join(outputDir, dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  const allTasks = [
    ...momotaroPages.map((p) => ({
      ...p,
      story: 'momotaro',
      outputPath: path.join(outputDir, 'momotaro', `page-${p.page}.jpg`),
    })),
    ...akazukinPages.map((p) => ({
      ...p,
      story: 'akazukin',
      outputPath: path.join(outputDir, 'akazukin', `page-${p.page}.jpg`),
    })),
  ]

  console.log(`\n🎨 絵本ベース画像の一括生成を開始します`)
  console.log(`   モデル: ${MODEL}`)
  console.log(`   比率: 3:4 (縦長)`)
  console.log(`   解像度: 2K`)
  console.log(`   合計: ${allTasks.length}枚\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < allTasks.length; i++) {
    const task = allTasks[i]
    const label = `[${i + 1}/${allTasks.length}] ${task.story}/page-${task.page}`

    try {
      console.log(`⏳ ${label} 生成中...`)
      const size = await generateSingleImage(task.prompt, task.outputPath)
      const sizeKB = Math.round(size / 1024)
      console.log(`✅ ${label} → ${sizeKB} KB`)
      successCount++
    } catch (error) {
      console.error(`❌ ${label} 失敗: ${error.message}`)
      failCount++

      // リトライ1回
      try {
        console.log(`🔄 ${label} リトライ中...`)
        await sleep(RATE_LIMIT_DELAY_MS)
        const size = await generateSingleImage(task.prompt, task.outputPath)
        const sizeKB = Math.round(size / 1024)
        console.log(`✅ ${label} リトライ成功 → ${sizeKB} KB`)
        successCount++
        failCount--
      } catch (retryError) {
        console.error(`❌ ${label} リトライも失敗: ${retryError.message}`)
      }
    }

    // レートリミット対策
    if (i < allTasks.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS)
    }
  }

  console.log(`\n🎉 完了! 成功: ${successCount}枚, 失敗: ${failCount}枚`)
  console.log(`   出力先: ${outputDir}/`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
