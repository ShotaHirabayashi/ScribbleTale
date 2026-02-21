import { SvgFilters } from "@/components/effects/SvgFilters"
import { PaperTexture } from "@/components/effects/PaperTexture"
import { HeroSection } from "@/components/top/HeroSection"
import { ExperienceSection } from "@/components/top/ExperienceSection"
import { ParentInfoSection } from "@/components/top/ParentInfoSection"
import { BookSelector } from "@/components/book/BookSelector"
import { ScrollToBooksFab } from "@/components/top/ScrollToBooksFab"
import { Footer } from "@/components/top/Footer"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* SVG filter definitions (invisible) */}
      <SvgFilters />

      {/* Global paper texture overlay */}
      <PaperTexture />

      <main>
        {/* Hero section with title and animation */}
        <HeroSection />

        {/* Divider - hand drawn style */}
        <div className="flex items-center justify-center py-2" aria-hidden="true">
          <svg width="200" height="12" viewBox="0 0 200 12" fill="none" className="text-border">
            <path
              d="M0 6C8 6 8 2 16 2s8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4S200 6 200 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Experience - what you can do */}
        <ExperienceSection />

        {/* Divider */}
        <div className="flex items-center justify-center py-2" aria-hidden="true">
          <svg width="200" height="12" viewBox="0 0 200 12" fill="none" className="text-border">
            <path
              d="M0 6C8 6 8 2 16 2s8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4S200 6 200 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Parent information */}
        <ParentInfoSection />

        {/* Divider */}
        <div className="flex items-center justify-center py-2" aria-hidden="true">
          <svg width="200" height="12" viewBox="0 0 200 12" fill="none" className="text-border">
            <path
              d="M0 6C8 6 8 2 16 2s8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4 8-4 16-4 8 4 16 4S200 6 200 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Book selection section - at the bottom */}
        <BookSelector />
      </main>

      {/* Floating button to scroll to book selection */}
      <ScrollToBooksFab />

      {/* Footer */}
      <Footer />
    </div>
  )
}
