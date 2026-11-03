import { Group, Shape } from 'react-konva'
import { CX, ELLIPSE, TIER_H, TIER_WIDTHS, tierBaseY } from '../../lib/geometry'

/** Dashed outlines on the empty stand that preview the chosen cake height. */
export default function TierOutlines({ tiers }: { tiers: number }) {
  return (
    <Group listening={false}>
      {Array.from({ length: tiers }, (_, i) => {
        const rx = TIER_WIDTHS[i] / 2
        const ry = TIER_WIDTHS[i] * ELLIPSE
        const base = tierBaseY(i)
        const top = base - TIER_H
        return (
          <Shape
            key={i}
            stroke="rgba(150,110,95,0.55)"
            strokeWidth={2}
            dash={[8, 7]}
            sceneFunc={(ctx, shape) => {
              ctx.beginPath()
              ctx.ellipse(CX, top, rx, ry, 0, 0, Math.PI * 2)
              ctx.moveTo(CX - rx, top)
              ctx.lineTo(CX - rx, base)
              ctx.ellipse(CX, base, rx, ry, 0, Math.PI, 0, true)
              ctx.lineTo(CX + rx, top)
              ctx.strokeShape(shape)
            }}
          />
        )
      })}
    </Group>
  )
}
