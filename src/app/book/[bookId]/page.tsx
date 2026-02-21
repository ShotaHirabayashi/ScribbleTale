'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const validBookIds = ['momotaro', 'akazukin']

export default function BookEntryPage({ params }: { params: Promise<{ bookId: string }> }) {
  const router = useRouter()

  useEffect(() => {
    params.then(({ bookId }) => {
      if (!validBookIds.includes(bookId)) {
        router.replace('/')
        return
      }

      // Firestoreにセッション作成 → セッションID付きURLにリダイレクト
      import('@/lib/firebase/firestore').then(({ createStorySession }) => {
        createStorySession(bookId).then((sessionId) => {
          router.replace(`/book/${bookId}/${sessionId}`)
        }).catch(() => {
          // Firestore失敗時はランダムID
          const fallbackId = `local-${Date.now()}`
          router.replace(`/book/${bookId}/${fallbackId}`)
        })
      }).catch(() => {
        const fallbackId = `local-${Date.now()}`
        router.replace(`/book/${bookId}/${fallbackId}`)
      })
    })
  }, [params, router])

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--storybook-brown)]">
      <div className="text-center font-serif text-[var(--storybook-cream)]">
        <p className="text-lg">えほんを じゅんびしているよ...</p>
      </div>
    </div>
  )
}
