import { useEffect, useRef, useState } from 'react'

/**
 * Runs 0 → 1 over `duration` ms each time `run` changes, and stays at 1 otherwise.
 * Clicking again while it plays (bumping `skip`) jumps to the end.
 */
export function usePipingProgress(run: number, duration: number): number {
  const [p, setP] = useState(1)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      if (run === 0) return
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setP(1)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration))
      setP(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    setP(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, duration])

  return p
}
