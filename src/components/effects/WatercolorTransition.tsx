'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface WatercolorTransitionProps {
  isActive: boolean
  children: React.ReactNode
}

/**
 * 水彩ディゾルブトランジション
 *
 * 改変時にイラストが切り替わるとき:
 * 1. 既存SVGフィルター（watercolor-dissolve）を活用
 * 2. Framer Motionでopacity + blurアニメーション
 * 3. mix-blend-modeで紙テクスチャとの一体感
 */
export function WatercolorTransition({ isActive, children }: WatercolorTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div
          key="watercolor-active"
          initial={{ opacity: 0, filter: 'blur(12px) url(#watercolor-dissolve)' }}
          animate={{ opacity: 1, filter: 'blur(0px) none' }}
          exit={{ opacity: 0, filter: 'blur(8px) url(#watercolor-dissolve)' }}
          transition={{
            duration: 2.0,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="h-full w-full"
          style={{ mixBlendMode: 'multiply' }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="watercolor-idle"
          initial={{ opacity: 1 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
