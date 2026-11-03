import { useEffect, useRef, useState } from 'react'
import { mix } from '../lib/color'

/** Returns a color that eases from its previous value to `target`. */
export function useAnimatedColor(target: string, duration = 400): string {
  const [shown, setShown] = useState(target)
  const fromRef = useRef(target)
  const shownRef = useRef(target)

  useEffect(() => {
    fromRef.current = shownRef.current
    if (fromRef.current === target) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const c = t >= 1 ? target : mix(fromRef.current, target, eased)
      shownRef.current = c
      setShown(c)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return shown
}
