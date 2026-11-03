// Logical size of the drawing. The stage is scaled to fit the screen,
// and the download is rendered from this size at 2x.
export const STAGE_W = 800
export const STAGE_H = 720

export const CX = STAGE_W / 2
/** Top surface of the cake stand plate. */
export const PLATE_Y = 600

export const TIER_H = 112
/** Width of a tier by its position from the bottom (0 = bottom). */
export const TIER_WIDTHS = [380, 290, 205]
/** Perspective: how tall the top ellipse is relative to the width. */
export const ELLIPSE = 0.13

/** Bottom edge (center of the bottom ellipse) of a tier. */
export function tierBaseY(index: number): number {
  return PLATE_Y - index * TIER_H
}
