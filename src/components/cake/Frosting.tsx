import { Ellipse, Group, Shape } from 'react-konva'
import { shade } from '../../lib/color'
import { dollops, dripLengths, tierBox, type Dollop } from '../../lib/frosting'
import { CX } from '../../lib/geometry'
import type { FrostingStyle } from '../../store'

type Props = {
  index: number
  style: FrostingStyle | null
  color: string
  /** 0..1, how much of this tier has been piped. */
  progress: number
  isTop: boolean
}

/**
 * Buttercream on one tier: a glossy coat with drips down the front, then either
 * a swirl of piped dollops or a ring of twisted rosettes.
 */
export default function Frosting({ index, style, color, progress, isTop }: Props) {
  if (!style || progress <= 0) return null
  const { rx, ry, top, base } = tierBox(index)
  const coat = Math.min(1, progress / 0.25)
  const pipe = Math.max(0, (progress - 0.2) / 0.8)
  const points = dollops(index, style, isTop)
  const shown = points.slice(0, Math.ceil(points.length * pipe))
  const segs = Math.round(rx / 13)
  const drips = dripLengths(index, segs)
  const R = rx + 3
  const Ry = ry + 3

  // Rosettes nearer the back are drawn first so front ones overlap them.
  const ordered = style === 'twist' || !isTop ? [...shown].sort((a, b) => a.y - b.y) : shown

  return (
    <Group listening={false}>
      {/* coat + drips */}
      <Shape
        opacity={coat}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.moveTo(CX - R, top)
          for (let j = 0; j < segs; j++) {
            const a0 = Math.PI - (j / segs) * Math.PI
            const a1 = Math.PI - ((j + 1) / segs) * Math.PI
            const x0 = CX + Math.cos(a0) * R
            const y0 = top + Math.sin(a0) * Ry + 6
            const x1 = CX + Math.cos(a1) * R
            const y1 = top + Math.sin(a1) * Ry + 6
            const L = drips[j] * coat
            if (j === 0) ctx.lineTo(x0, y0)
            if (L > 0) ctx.bezierCurveTo(x0, y0 + L * 1.3, x1, y1 + L * 1.3, x1, y1)
            else ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 4, x1, y1)
          }
          ctx.lineTo(CX + R, top)
          ctx.ellipse(CX, top, R, Ry, 0, 0, Math.PI, true)
          ctx.closePath()
          ctx.fillShape(shape)
        }}
        fillLinearGradientStartPoint={{ x: CX - R, y: 0 }}
        fillLinearGradientEndPoint={{ x: CX + R, y: 0 }}
        fillLinearGradientColorStops={[0, shade(color, -0.2), 0.3, shade(color, 0.12), 0.55, color, 1, shade(color, -0.25)]}
      />
      {/* glossy top */}
      <Ellipse
        x={CX}
        y={top}
        radiusX={R}
        radiusY={Ry}
        opacity={coat}
        fillRadialGradientStartPoint={{ x: -R * 0.3, y: -Ry * 0.4 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={R}
        fillRadialGradientColorStops={[0, shade(color, 0.4), 0.6, shade(color, 0.08), 1, shade(color, -0.12)]}
      />
      {ordered.map((d, i) =>
        style === 'swirl' ? <SwirlDollop key={i} d={d} color={color} /> : <Rosette key={i} d={d} color={color} seed={i} />,
      )}
      {/* twist: a beaded border around the base */}
      {style === 'twist' && pipe >= 1 && <BeadBorder rx={rx} ry={ry} y={base - 4} color={color} />}
    </Group>
  )
}

function SwirlDollop({ d, color }: { d: Dollop; color: string }) {
  return (
    <Ellipse
      x={d.x}
      y={d.y}
      radiusX={d.r * 1.25}
      radiusY={d.r * 0.85}
      fillRadialGradientStartPoint={{ x: -d.r * 0.4, y: -d.r * 0.4 }}
      fillRadialGradientEndPoint={{ x: 0, y: 0 }}
      fillRadialGradientStartRadius={0}
      fillRadialGradientEndRadius={d.r * 1.3}
      fillRadialGradientColorStops={[0, shade(color, 0.5), 0.45, shade(color, 0.1), 1, shade(color, -0.28)]}
      shadowColor="rgba(0,0,0,0.25)"
      shadowBlur={3}
      shadowOffsetY={2}
    />
  )
}

function Rosette({ d, color, seed }: { d: Dollop; color: string; seed: number }) {
  const turn = (seed % 3) * 0.7
  const spiral = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath()
    for (let t = 0; t <= 1.001; t += 0.04) {
      const a = turn + t * Math.PI * 3.6
      const r = d.r * (1 - t * 0.85)
      const x = d.x + Math.cos(a) * r
      const y = d.y + Math.sin(a) * r * 0.62 - t * 8
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  return (
    <Group>
      <Shape
        sceneFunc={(ctx, shape) => {
          spiral(ctx._context)
          ctx.strokeShape(shape)
        }}
        stroke={shade(color, -0.22)}
        strokeWidth={10}
        lineCap="round"
        lineJoin="round"
        shadowColor="rgba(0,0,0,0.25)"
        shadowBlur={3}
        shadowOffsetY={2}
      />
      <Shape
        sceneFunc={(ctx, shape) => {
          spiral(ctx._context)
          ctx.strokeShape(shape)
        }}
        stroke={shade(color, 0.08)}
        strokeWidth={6}
        lineCap="round"
        lineJoin="round"
      />
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx._context.save()
          ctx._context.translate(-1.5, -2)
          spiral(ctx._context)
          ctx._context.restore()
          ctx.strokeShape(shape)
        }}
        stroke={shade(color, 0.55)}
        strokeWidth={2}
        lineCap="round"
        opacity={0.8}
      />
    </Group>
  )
}

function BeadBorder({ rx, ry, y, color }: { rx: number; ry: number; y: number; color: string }) {
  const n = Math.round(rx / 7)
  return (
    <Group>
      {Array.from({ length: n + 1 }, (_, i) => {
        const a = Math.PI - (i / n) * Math.PI
        return (
          <Ellipse
            key={i}
            x={CX + Math.cos(a) * (rx + 2)}
            y={y + Math.sin(a) * (ry + 2)}
            radiusX={7}
            radiusY={6}
            fillRadialGradientStartPoint={{ x: -2, y: -2 }}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndRadius={8}
            fillRadialGradientColorStops={[0, shade(color, 0.5), 0.5, color, 1, shade(color, -0.3)]}
          />
        )
      })}
    </Group>
  )
}
