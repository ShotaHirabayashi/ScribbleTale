import { GoogleGenAI } from '@google/genai'
import { CHILD_SAFE_SETTINGS } from './safety'

const PRIMARY_MODEL = 'gemini-3-pro-image-preview'
const FALLBACK_MODEL = 'gemini-2.5-flash-image'
const PRIMARY_TIMEOUT_MS = 15000
const CIRCUIT_BREAKER_COOLDOWN_MS = 60000

let circuitBreakerTrippedAt: number | null = null

function isCircuitBreakerOpen(): boolean {
  if (!circuitBreakerTrippedAt) return false
  const elapsed = Date.now() - circuitBreakerTrippedAt
  if (elapsed > CIRCUIT_BREAKER_COOLDOWN_MS) {
    circuitBreakerTrippedAt = null
    return false
  }
  return true
}

function tripCircuitBreaker(): void {
  circuitBreakerTrippedAt = Date.now()
  console.warn('[ImageGenerator] Circuit breaker tripped, using fallback model')
}

/** 画像生成（Pro→Flashフォールバック + サーキットブレーカー） */
export async function generateImage(
  prompt: string,
  apiKey: string,
  referenceImageBase64?: string
): Promise<{ imageBase64: string; mimeType: string; model: string }> {
  const genai = new GoogleGenAI({ apiKey })

  // サーキットブレーカーが開いている場合はフォールバックモデルを使用
  if (isCircuitBreakerOpen()) {
    return generateWithModel(genai, FALLBACK_MODEL, prompt, referenceImageBase64)
  }

  // プライマリモデルで試行
  try {
    return await generateWithTimeout(
      generateWithModel(genai, PRIMARY_MODEL, prompt, referenceImageBase64),
      PRIMARY_TIMEOUT_MS
    )
  } catch (error) {
    console.warn('[ImageGenerator] Primary model failed:', error)
    tripCircuitBreaker()

    // フォールバックモデルで再試行
    return generateWithModel(genai, FALLBACK_MODEL, prompt, referenceImageBase64)
  }
}

async function generateWithModel(
  genai: GoogleGenAI,
  modelId: string,
  prompt: string,
  referenceImageBase64?: string
): Promise<{ imageBase64: string; mimeType: string; model: string }> {
  const contents: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = []

  if (referenceImageBase64) {
    contents.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: 'image/jpeg',
      },
    })
  }

  contents.push({ text: prompt })

  const response = await genai.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: contents }],
    config: {
      responseModalities: ['image', 'text'],
      safetySettings: CHILD_SAFE_SETTINGS,
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

  return {
    imageBase64: part.inlineData.data,
    mimeType: part.inlineData.mimeType || 'image/png',
    model: modelId,
  }
}

function generateWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
      timeoutMs
    )
    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}
