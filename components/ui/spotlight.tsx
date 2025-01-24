'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SpotlightProps {
  className?: string
  size?: number
}

export function Spotlight({
  className,
  size = 800
}: SpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const mouseX = useSpring(0, { damping: 20, stiffness: 300 })
  const mouseY = useSpring(0, { damping: 20, stiffness: 300 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = divRef.current?.getBoundingClientRect()
    if (rect) {
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }, [])

  useEffect(() => {
    mouseX.set(mousePosition.x - size / 2)
    mouseY.set(mousePosition.y - size / 2)
  }, [mousePosition, size, mouseX, mouseY])

  useEffect(() => {
    const div = divRef.current
    if (!div) return

    div.addEventListener('mousemove', handleMouseMove)
    div.addEventListener('mouseenter', () => setIsHovered(true))
    div.addEventListener('mouseleave', () => setIsHovered(false))

    return () => {
      div.removeEventListener('mousemove', handleMouseMove)
      div.removeEventListener('mouseenter', () => setIsHovered(true))
      div.removeEventListener('mouseleave', () => setIsHovered(false))
    }
  }, [handleMouseMove])

  return (
    <div
      ref={divRef}
      className="relative w-full h-full cursor-default"
    >
      <motion.div
        className={cn(
          'pointer-events-none absolute rounded-full bg-gradient-to-r from-neutral-100/50 to-neutral-300/10 blur-3xl transition-opacity duration-500',
          isHovered ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          width: size,
          height: size,
          left: useTransform(mouseX, (x) => `${x}px`),
          top: useTransform(mouseY, (y) => `${y}px`),
        }}
      />
    </div>
  )
} 