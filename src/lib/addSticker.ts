import { loadImage } from '../hooks/useImage'
import { useStore } from '../store'
import { CX, PLATE_Y, TIER_H } from './geometry'

export const DRAG_MIME = 'application/x-cake-sticker'

/** Add a sticker at a point on the stage (defaults to the front of the cake). */
export async function addStickerAt(src: string, at?: { x: number; y: number }) {
  const img = await loadImage(src)
  const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1
  const base = 96
  const width = ratio >= 1 ? base * Math.min(ratio, 2) : base * ratio
  const height = width / ratio
  const tiers = useStore.getState().tiers
  const p = at ?? { x: CX, y: PLATE_Y - TIER_H * (tiers - 0.45) }
  useStore.getState().addSticker({ src, x: p.x, y: p.y, width, height, rotation: 0, scale: 1 })
  useStore.getState().setStep('stickers')
}
