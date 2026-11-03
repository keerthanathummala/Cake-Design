import { Group, Line, Shape } from 'react-konva'
import { shade } from '../../lib/color'

/** A piping bag whose tip sits at (x, y), tilted slightly like a hand holds it. */
export default function PipingBag({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <Group x={x} y={y} rotation={-18} listening={false}>
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.moveTo(-6, -14)
          ctx.bezierCurveTo(-34, -70, -46, -110, -38, -140)
          ctx.quadraticCurveTo(0, -158, 38, -140)
          ctx.bezierCurveTo(46, -110, 34, -70, 6, -14)
          ctx.closePath()
          ctx.fillStrokeShape(shape)
        }}
        fillLinearGradientStartPoint={{ x: -40, y: 0 }}
        fillLinearGradientEndPoint={{ x: 40, y: 0 }}
        fillLinearGradientColorStops={[0, 'rgba(255,255,255,0.75)', 0.4, 'rgba(255,255,255,0.95)', 1, 'rgba(220,220,225,0.85)']}
        stroke="rgba(120,120,130,0.5)"
        strokeWidth={1}
      />
      {/* buttercream showing through the bag */}
      <Shape
        opacity={0.75}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.moveTo(-5, -16)
          ctx.bezierCurveTo(-26, -60, -32, -84, -28, -96)
          ctx.quadraticCurveTo(0, -104, 28, -96)
          ctx.bezierCurveTo(32, -84, 26, -60, 5, -16)
          ctx.closePath()
          ctx.fillShape(shape)
        }}
        fill={shade(color, -0.05)}
      />
      {/* metal tip */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath()
          ctx.moveTo(-8, -16)
          ctx.lineTo(8, -16)
          ctx.lineTo(3, 0)
          ctx.lineTo(-3, 0)
          ctx.closePath()
          ctx.fillShape(shape)
        }}
        fillLinearGradientStartPoint={{ x: -8, y: 0 }}
        fillLinearGradientEndPoint={{ x: 8, y: 0 }}
        fillLinearGradientColorStops={[0, '#8d949c', 0.4, '#f1f4f7', 1, '#79808a']}
      />
      <Line points={[-38, -140, 38, -140]} stroke="rgba(120,120,130,0.4)" strokeWidth={1} />
    </Group>
  )
}
