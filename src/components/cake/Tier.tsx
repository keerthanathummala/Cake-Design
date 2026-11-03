import type Konva from 'konva'
import { useEffect, useRef, type ReactNode } from 'react'
import { Ellipse, Group, Shape } from 'react-konva'
import { shade } from '../../lib/color'
import { CX, ELLIPSE, TIER_H, TIER_WIDTHS, tierBaseY } from '../../lib/geometry'
import { bounceOut } from '../../lib/easing'
import { crumbTexture } from '../../lib/texture'

type Props = {
  index: number
  color: string
  filling: string
  /** Drop this tier in from above when it mounts. */
  dropIn: boolean
  children?: ReactNode
}

/** Outline of a cylinder's visible side, used for fill, texture and shading. */
function sidePath(ctx: Konva.Context, rx: number, ry: number, top: number, base: number) {
  ctx.beginPath()
  ctx.moveTo(CX - rx, top)
  ctx.lineTo(CX - rx, base)
  ctx.ellipse(CX, base, rx, ry, 0, Math.PI, 0, true)
  ctx.lineTo(CX + rx, top)
  ctx.ellipse(CX, top, rx, ry, 0, 0, Math.PI, false)
  ctx.closePath()
}

/** One round sponge tier: shaded sides, crumb texture, a filling layer and a top. */
export default function Tier({ index, color, filling, dropIn, children }: Props) {
  const ref = useRef<Konva.Group>(null)
  const w = TIER_WIDTHS[index]
  const rx = w / 2
  const ry = w * ELLIPSE
  const base = tierBaseY(index)
  const top = base - TIER_H
  const mid = top + TIER_H * 0.52

  useEffect(() => {
    const g = ref.current
    if (!dropIn || !g) return
    g.y(-420)
    g.opacity(0)
    g.to({ y: 0, opacity: 1, duration: 0.55, easing: bounceOut })
  }, [dropIn])

  return (
    <Group ref={ref}>
      {/* soft contact shadow where this tier sits */}
      <Ellipse x={CX} y={base + 2} radiusX={rx + 4} radiusY={ry + 3} fill="rgba(40,20,10,0.12)" listening={false} />
      {/* sponge sides */}
      <Shape
        sceneFunc={(ctx, shape) => {
          sidePath(ctx, rx, ry, top, base)
          ctx.fillStrokeShape(shape)
        }}
        fillLinearGradientStartPoint={{ x: CX - rx, y: 0 }}
        fillLinearGradientEndPoint={{ x: CX + rx, y: 0 }}
        fillLinearGradientColorStops={[
          0, shade(color, -0.38),
          0.14, shade(color, -0.12),
          0.38, shade(color, 0.14),
          0.62, color,
          0.88, shade(color, -0.22),
          1, shade(color, -0.45),
        ]}
      />
      {/* filling layer, curved to follow the round side */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.moveTo(CX - rx, mid - 7)
          ctx.ellipse(CX, mid - 7, rx, ry, 0, Math.PI, 0, true)
          ctx.lineTo(CX + rx, mid + 7)
          ctx.ellipse(CX, mid + 7, rx, ry, 0, 0, Math.PI, false)
          ctx.closePath()
          ctx.fillStrokeShape(shape)
        }}
        fillLinearGradientStartPoint={{ x: CX - rx, y: 0 }}
        fillLinearGradientEndPoint={{ x: CX + rx, y: 0 }}
        fillLinearGradientColorStops={[0, shade(filling, -0.3), 0.4, shade(filling, 0.1), 0.7, filling, 1, shade(filling, -0.35)]}
      />
      {/* crumb texture over the sides */}
      <Shape
        listening={false}
        opacity={0.28}
        globalCompositeOperation="overlay"
        fillPatternImage={crumbTexture() as unknown as HTMLImageElement}
        fillPatternRepeat="repeat"
        sceneFunc={(ctx, shape) => {
          sidePath(ctx, rx, ry, top, base)
          ctx.fillShape(shape)
        }}
      />
      {/* top surface */}
      <Ellipse
        x={CX}
        y={top}
        radiusX={rx}
        radiusY={ry}
        fillRadialGradientStartPoint={{ x: -rx * 0.25, y: -ry * 0.3 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={rx}
        fillRadialGradientColorStops={[0, shade(color, 0.22), 0.75, shade(color, 0.05), 1, shade(color, -0.18)]}
      />
      <Ellipse
        x={CX}
        y={top}
        radiusX={rx}
        radiusY={ry}
        listening={false}
        opacity={0.22}
        globalCompositeOperation="overlay"
        fillPatternImage={crumbTexture() as unknown as HTMLImageElement}
      />
      {children}
    </Group>
  )
}
