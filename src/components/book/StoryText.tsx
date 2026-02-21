'use client'

import { useEffect, useRef, useState } from 'react'

interface StoryTextProps {
  text: string
  isActive: boolean
  className?: string
  onComplete?: () => void
}

export function StoryText({ text, isActive, className = '', onComplete }: StoryTextProps) {
  const [visibleChars, setVisibleChars] = useState(0)
  const onCompleteCalledRef = useRef(false)

  useEffect(() => {
    if (!isActive) {
      setVisibleChars(0)
      onCompleteCalledRef.current = false
      return
    }

    setVisibleChars(0)
    onCompleteCalledRef.current = false
    const chars = text.length
    let current = 0

    const timer = setInterval(() => {
      current += 1
      setVisibleChars(current)
      if (current >= chars) {
        clearInterval(timer)
        if (!onCompleteCalledRef.current) {
          onCompleteCalledRef.current = true
          onComplete?.()
        }
      }
    }, 50)

    return () => clearInterval(timer)
  }, [isActive, text, onComplete])

  const lines = text.split('\n')
  let charCount = 0

  return (
    <div className={`font-serif leading-loose ${className}`}>
      {lines.map((line, lineIndex) => {
        if (line === '') {
          charCount += 1
          return <br key={lineIndex} />
        }

        const lineChars = line.split('').map((char, charIndex) => {
          const globalIndex = charCount + charIndex
          const isVisible = globalIndex < visibleChars
          return (
            <span
              key={charIndex}
              className="inline-block transition-opacity duration-200"
              style={{ opacity: isVisible ? 1 : 0 }}
            >
              {char}
            </span>
          )
        })

        charCount += line.length + 1

        return (
          <p key={lineIndex} className="mb-2">
            {lineChars}
          </p>
        )
      })}
    </div>
  )
}
