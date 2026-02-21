'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeShareProps {
  url: string
  size?: number
}

export function QRCodeShare({ url, size = 128 }: QRCodeShareProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-lg bg-white p-3 shadow-sm">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          bgColor="#ffffff"
          fgColor="#3d2b1f"
        />
      </div>
      <p className="font-serif text-xs text-muted-foreground">
        QRコードで かんたんシェア
      </p>
    </div>
  )
}
