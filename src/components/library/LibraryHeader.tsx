import Link from "next/link"
import { Home, BookOpen } from "lucide-react"

export function LibraryHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 py-1.5 font-serif text-sm text-foreground transition-colors hover:bg-secondary"
        aria-label="トップへ もどる"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">トップへ</span>
      </Link>

      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="font-serif text-lg font-bold text-foreground md:text-xl">
          みんなの ほんだな
        </h1>
      </div>

      {/* Spacer for centering */}
      <div className="w-16 sm:w-20" />
    </header>
  )
}
