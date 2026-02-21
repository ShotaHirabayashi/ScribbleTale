'use client'

import { useState } from 'react'
import { X, Share2, Loader2 } from 'lucide-react'
import { ShareButtons } from './ShareButtons'
import { QRCodeShare } from './QRCodeShare'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  bookTitle: string
  shareUrl: string | null
  onGenerateShareUrl: () => Promise<string>
}

export function ShareModal({
  isOpen,
  onClose,
  bookTitle,
  shareUrl: initialShareUrl,
  onGenerateShareUrl,
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState(initialShareUrl)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const url = await onGenerateShareUrl()
      setShareUrl(url)
    } catch (error) {
      console.error('[ShareModal] Failed to generate share URL:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const fullUrl = shareUrl
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${shareUrl}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg font-bold text-foreground">
              えほんを シェアする
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-muted"
            aria-label="とじる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 font-serif text-sm text-muted-foreground">
          「{bookTitle}」を みんなに みせよう！
        </p>

        {fullUrl ? (
          <div className="flex flex-col items-center gap-6">
            <QRCodeShare url={fullUrl} />
            <ShareButtons
              title={bookTitle}
              shareUrl={fullUrl}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-serif text-sm font-bold text-primary-foreground transition-all hover:scale-105 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  つくっているよ...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  シェアURLを つくる
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
