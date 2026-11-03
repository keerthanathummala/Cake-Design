import type { Base } from '../store'

export type TierBox = { index: number; radius: number; y: number; height: number }

/** Frosting thickness over the sponge. */
export const COAT = 0.035
/** Height of the stand's top surface; the cake sits here. */
export const BASE_TOP: Record<Base, number> = { stand: 0.62, board: 0.06, gold: 0.62, bento: 0.05 }

const RADII = [1.05, 0.78, 0.54]

export function tierBoxes(tiers: number, base: Base): TierBox[] {
  if (base === 'bento') return [{ index: 0, radius: 0.62, y: BASE_TOP.bento, height: 0.52 }]
  const out: TierBox[] = []
  let y = BASE_TOP[base]
  for (let i = 0; i < tiers; i++) {
    const height = i === 0 ? 0.66 : 0.6
    out.push({ index: i, radius: RADII[i], y, height })
    y += height + COAT
  }
  return out
}

export function cakeTop(tiers: number, base: Base): number {
  const b = tierBoxes(tiers, base)
  const last = b[b.length - 1]
  return last.y + last.height + COAT
}
