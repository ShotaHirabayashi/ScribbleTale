'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const validBookIds = ['momotaro', 'akazukin', 'wizard-of-oz']

export default function BookEntryPage({ params }: { params: Promise<{ bookId: string }> }) {
  const router = useRouter()
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

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
