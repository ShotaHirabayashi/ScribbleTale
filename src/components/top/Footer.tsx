export function Footer() {
  return (
    <footer className="relative border-t border-border bg-card/50 px-4 py-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
            <path d="M10 2c1 .5 2 2 2 5" />
          </svg>
          <span className="font-serif text-lg font-bold text-foreground">ScribbleTale</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Powered by bayashi
        </p>
        <p className="text-xs text-muted-foreground/60">
          {'こどもの そうぞうりょくで、えほんは むげんに ひろがる'}
        </p>
      </div>
    </footer>
  )
}
