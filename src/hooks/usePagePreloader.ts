'use client'

import { useEffect, useRef } from 'react'

/**
 * 現在ページ前後の画像をプリロードし、ページめくり時のちらつきを防止する
 */
export function usePagePreloader(
  pages: { illustration: string }[],
  currentPage: number,
  range: number = 2
): void {
  const preloadedUrls = useRef(new Set<string>())

  useEffect(() => {
    for (let i = currentPage - range; i <= currentPage + range; i++) {
      if (i >= 0 && i < pages.length) {
        const url = pages[i].illustration
        if (url && !preloadedUrls.current.has(url)) {
          preloadedUrls.current.add(url)
          const img = new Image()
          img.src = url
        }
      }
    }
  }, [currentPage, pages, range])
}
