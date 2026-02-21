import Link from 'next/link'
import { Home } from 'lucide-react'

export default function SharedStoryNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--storybook-cream)] p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 rounded-2xl bg-background/80 p-8 shadow-lg backdrop-blur-sm">
          <h1 className="mb-2 font-serif text-2xl font-bold text-[var(--storybook-brown)]">
            えほんが みつからないよ
          </h1>
          <p className="mb-4 font-serif text-sm text-muted-foreground">
            この えほんは まだ つくられていないか、
            <br />
            リンクが まちがっているかもしれません
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-serif text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-105"
        >
          <Home className="h-4 w-4" />
          トップページへ
        </Link>
      </div>
    </div>
  )
}
