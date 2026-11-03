import type { FrostingStyle } from '../store'
import { CX, ELLIPSE, TIER_H, TIER_WIDTHS, tierBaseY } from './geometry'

export type Dollop = { x: number; y: number; r: number }

export function tierBox(index: number) {
  const w = TIER_WIDTHS[index]
  const rx = w / 2
  const ry = w * ELLIPSE
  const base = tierBaseY(index)
  return { rx, ry, base, top: base - TIER_H }
}

/**
 * Where the piping bag puts each dollop of buttercream, in the order it pipes them.
 * Swirl: a spiral from the rim to the center of the top (a rim border on lower tiers).
 * Twist: a ring of rosettes around the top edge.
 */
export function dollops(index: number, style: FrostingStyle, isTop = true): Dollop[] {
  const { rx, ry, top } = tierBox(index)
  const k = ry / rx
  const out: Dollop[] = []
  if (style === 'swirl' && !isTop) {
    // A lower tier's center is hidden under the next tier, so pipe a
    // swirled border around its exposed rim instead of a full spiral.
    const r = rx * 0.9
    const n = Math.round((Math.PI * 2 * rx) / 22)
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 0.5 + (i / n) * Math.PI * 2
      out.push({ x: CX + Math.cos(a) * r, y: top + Math.sin(a) * r * k - 3, r: 9 })
    }
  } else if (style === 'swirl') {
    const turns = 2.6 + index * -0.3
    const n = Math.round(rx * 0.42)
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const a = Math.PI * 0.6 + t * turns * Math.PI * 2
      const r = (1 - t * 0.92) * rx * 0.84
      out.push({ x: CX + Math.cos(a) * r, y: top + Math.sin(a) * r * k - 3, r: 11 - t * 3 })
    }
  } else {
    const r = rx * 0.86
    const n = Math.max(8, Math.round((Math.PI * 2 * rx) / 46))
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 0.75 + (i / n) * Math.PI * 2
      out.push({ x: CX + Math.cos(a) * r, y: top + Math.sin(a) * r * k - 6, r: 15 })
    }
  }
  return out
}

/** Seeded drip lengths so every tier has the same, natural-looking drips. */
export function dripLengths(index: number, count: number): number[] {
  let seed = 11 + index * 31
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: count }, (_, i) => (i % 2 === 0 || rand() > 0.6 ? 10 + rand() * 34 : 0))
}

/** Each tier takes a slice of the whole piping animation, bottom tier first. */
export function tierProgress(progress: number, index: number, tiers: number): number {
  const slice = 1 / tiers
  return Math.max(0, Math.min(1, (progress - index * slice) / slice))
}
