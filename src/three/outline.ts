import { Vector2 } from 'three'
import type { CakeShape } from '../store'

/** Points evenly spaced around a cake's footprint, with outward normals. */
export type Outline = {
  points: Vector2[]
  normals: Vector2[]
  /** Cumulative distance along the outline at each point (last = perimeter). */
  dist: number[]
  perimeter: number
}

const SAMPLES = 192

/** A dense polyline of the shape at "radius" 1, counter-clockwise in x/z. */
function rawShape(shape: CakeShape): Vector2[] {
  const pts: Vector2[] = []
  const N = 1200
  if (shape === 'round') {
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2
      pts.push(new Vector2(Math.cos(t), Math.sin(t)))
    }
  } else if (shape === 'square') {
    // A superellipse reads as a square cake with softly rounded corners.
    const n = 9
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      pts.push(new Vector2(Math.sign(c) * Math.abs(c) ** (2 / n) * 0.9, Math.sign(s) * Math.abs(s) ** (2 / n) * 0.9))
    }
  } else if (shape === 'heart') {
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2
      const x = 16 * Math.sin(t) ** 3
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      // Point of the heart faces the front (+z), lobes at the back.
      pts.push(new Vector2(x / 16.5, -(y + 2.5) / 15.5))
    }
  } else {
    // Hexagon with lightly rounded corners.
    const corner = 0.08
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2 + Math.PI / 6
      const seg = Math.PI / 3
      const local = ((t % seg) + seg) % seg - seg / 2
      let r = Math.cos(seg / 2) / Math.cos(local)
      const edge = Math.abs(local) / (seg / 2)
      if (edge > 1 - corner) r -= ((edge - (1 - corner)) / corner) ** 2 * 0.035
      pts.push(new Vector2(Math.cos(t) * r * 1.02, Math.sin(t) * r * 1.02))
    }
  }
  // Make sure the winding is counter-clockwise.
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    area += a.x * b.y - b.x * a.y
  }
  return area < 0 ? pts.reverse() : pts
}

const cache = new Map<CakeShape, Outline>()

export function outlineOf(shape: CakeShape): Outline {
  const hit = cache.get(shape)
  if (hit) return hit
  const raw = rawShape(shape)
  const cum = [0]
  for (let i = 1; i <= raw.length; i++) cum.push(cum[i - 1] + raw[i % raw.length].distanceTo(raw[i - 1]))
  const total = cum[cum.length - 1]
  const points: Vector2[] = []
  let j = 0
  for (let k = 0; k < SAMPLES; k++) {
    const target = (k / SAMPLES) * total
    while (cum[j + 1] < target) j++
    const f = (target - cum[j]) / (cum[j + 1] - cum[j] || 1)
    points.push(raw[j].clone().lerp(raw[(j + 1) % raw.length], f))
  }
  const normals = points.map((_, k) => {
    const a = points[(k - 1 + SAMPLES) % SAMPLES]
    const b = points[(k + 1) % SAMPLES]
    const t = b.clone().sub(a).normalize()
    // Counter-clockwise winding: outward normal is the tangent turned clockwise.
    return new Vector2(t.y, -t.x)
  })
  const dist = [0]
  for (let k = 1; k <= SAMPLES; k++) dist.push(dist[k - 1] + points[k % SAMPLES].distanceTo(points[k - 1]))
  const o = { points, normals, dist, perimeter: dist[SAMPLES] }
  cache.set(shape, o)
  return o
}

/** A copy of the outline scaled to `radius` and pushed out (or in) by `offset`. */
export function ring(o: Outline, radius: number, offset = 0): Vector2[] {
  return o.points.map((p, k) => p.clone().multiplyScalar(radius).addScaledVector(o.normals[k], offset))
}
