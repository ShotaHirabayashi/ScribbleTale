"use client"

import { useState, useCallback } from "react"
import { Link2, Check } from "lucide-react"

interface ShareButtonsProps {
  title: string
  shareUrl?: string
}

export function ShareButtons({ title, shareUrl: externalUrl }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = externalUrl || (typeof window !== "undefined" ? window.location.href : "")
  const shareText = `えほん「${title}」を よんでみてね！ #ScribbleTale`

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [shareUrl])

  const handleXShare = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [shareText, shareUrl])

  const handleLineShare = useCallback(() => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [shareText, shareUrl])

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-serif text-sm text-muted-foreground">おともだちに シェアしよう</p>

      <div className="flex items-center gap-3">
        {/* X (Twitter) */}
        <button
          onClick={handleXShare}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-all hover:scale-110 hover:shadow-lg active:scale-95"
          aria-label="Xでシェア"
          title="Xでシェアする"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>

        {/* LINE */}
        <button
          onClick={handleLineShare}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#06C755] text-white shadow-md transition-all hover:scale-110 hover:shadow-lg active:scale-95"
          aria-label="LINEでシェア"
          title="LINEでシェアする"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 01-.63-.629V8.108a.63.63 0 01.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 01-.63.629.626.626 0 01-.51-.263l-2.42-3.297v2.93a.63.63 0 01-1.26 0V8.108a.63.63 0 01.63-.63c.2 0 .385.096.51.263l2.42 3.297V8.108a.63.63 0 011.26 0v4.771zm-5.741 0a.63.63 0 01-1.26 0V8.108a.63.63 0 011.26 0v4.771zm-2.527.629H4.856a.63.63 0 01-.63-.629V8.108a.63.63 0 011.26 0v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
        </button>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all hover:scale-110 hover:shadow-lg active:scale-95 ${
            copied
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-foreground"
          }`}
          aria-label="リンクをコピー"
          title="リンクをコピーする"
        >
          {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
        </button>
      </div>

      {copied && (
        <p className="animate-in fade-in font-serif text-xs text-accent">
          コピーしました
        </p>
      )}
    </div>
  )
}
