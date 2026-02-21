import type { SavedBook } from "@/lib/types"

const STORAGE_KEY = "scribble-tale-books"

export const demoBooks: SavedBook[] = [
  {
    id: "demo-1",
    storyId: "momotaro",
    title: "そらとぶ ももたろう",
    authorName: "ゆうきちゃん",
    coverImage: "/images/momotaro-cover.jpg",
    bgColor: "#f8e8d0",
    frameStyle: "stars",
    createdAt: "2026-02-15T10:30:00Z",
  },
  {
    id: "demo-2",
    storyId: "akazukin",
    title: "あかずきんと にじいろ オオカミ",
    authorName: "はなちゃん",
    coverImage: "/images/akazukin-cover.jpg",
    bgColor: "#e8d5d5",
    frameStyle: "flowers",
    createdAt: "2026-02-18T14:00:00Z",
  },
  {
    id: "demo-3",
    storyId: "momotaro",
    title: "うみの ももたろう",
    authorName: "そらくん",
    coverImage: "/images/momotaro-cover.jpg",
    bgColor: "#d5e0e8",
    frameStyle: "ribbon",
    createdAt: "2026-02-19T09:15:00Z",
  },
]

export function getSavedBooks(): SavedBook[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveBook(book: SavedBook): void {
  if (typeof window === "undefined") return
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const books: SavedBook[] = stored ? JSON.parse(stored) : []
    books.unshift(book)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  } catch {
    // silent fail
  }
}

export function getSavedBookById(id: string): SavedBook | undefined {
  const userBooks = getSavedBooks()
  return userBooks.find((b) => b.id === id) ?? demoBooks.find((b) => b.id === id)
}
