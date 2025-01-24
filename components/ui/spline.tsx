'use client'
import Spline from '@splinetool/react-spline'

interface SplineSceneProps {
  scene: string
  className?: string
  options?: {
    autostart?: boolean
    animations?: boolean
  }
}

export function SplineScene({
  scene,
  className,
  options = {}
}: SplineSceneProps) {
  return (
    <div className={className}>
      <Spline 
        scene={scene}
        className="w-full h-full"
        {...Object.fromEntries(
          Object.entries(options).map(([key, value]) => [key, String(value)])
        )}
      />
    </div>
  )
} 