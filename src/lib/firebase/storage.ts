import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

/** Base64画像をFirebase Storageにアップロードし、ダウンロードURLを返す */
export async function uploadImage(
  path: string,
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<string> {
  const storageRef = ref(storage, path)

  await uploadString(storageRef, base64Data, 'base64', {
    contentType: mimeType,
    cacheControl: 'public, max-age=31536000',
  })

  return getDownloadURL(storageRef)
}

/** ストーリーの画像保存パスを生成 */
export function getStoryImagePath(
  storyId: string,
  pageNumber: number
): string {
  return `stories/${storyId}/page-${pageNumber.toString().padStart(2, '0')}.png`
}
