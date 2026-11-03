import { Ellipse, Group, Rect } from 'react-konva'
import { CX, PLATE_Y } from '../../lib/geometry'

const PLATE_RX = 250
const PLATE_RY = 36

/** A white porcelain cake stand with soft shading and a floor shadow. */
export default function Stand() {
  return (
    <Group listening={false}>
      {/* floor shadow */}
      <Ellipse x={CX} y={PLATE_Y + 104} radiusX={150} radiusY={16} fill="rgba(40,20,10,0.18)" />
      {/* base foot */}
      <Ellipse
        x={CX}
        y={PLATE_Y + 98}
        radiusX={110}
        radiusY={18}
        fillLinearGradientStartPoint={{ x: -110, y: 0 }}
        fillLinearGradientEndPoint={{ x: 110, y: 0 }}
        fillLinearGradientColorStops={[0, '#cfc6bf', 0.35, '#ffffff', 0.7, '#ece6e1', 1, '#b9afa8']}
      />
      {/* stem */}
      <Rect
        x={CX - 22}
        y={PLATE_Y + 26}
        width={44}
        height={72}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 44, y: 0 }}
        fillLinearGradientColorStops={[0, '#c8bfb8', 0.35, '#ffffff', 0.75, '#e6dfda', 1, '#b3a9a2']}
      />
      {/* plate rim (side) */}
      <Ellipse
        x={CX}
        y={PLATE_Y + 12}
        radiusX={PLATE_RX}
        radiusY={PLATE_RY}
        fillLinearGradientStartPoint={{ x: -PLATE_RX, y: 0 }}
        fillLinearGradientEndPoint={{ x: PLATE_RX, y: 0 }}
        fillLinearGradientColorStops={[0, '#c4bab3', 0.3, '#f7f3f0', 0.6, '#ffffff', 1, '#b8aea7']}
      />
      {/* plate top */}
      <Ellipse
        x={CX}
        y={PLATE_Y}
        radiusX={PLATE_RX}
        radiusY={PLATE_RY}
        fillRadialGradientStartPoint={{ x: -60, y: -10 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={PLATE_RX}
        fillRadialGradientColorStops={[0, '#ffffff', 0.7, '#f4efeb', 1, '#ddd3cc']}
        stroke="rgba(120,100,90,0.25)"
        strokeWidth={1}
      />
    </Group>
  )
}
