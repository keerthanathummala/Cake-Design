import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'

/** One stroke of piped icing: a path, its thickness along the way, and its tip. */
export type Stroke = {
  path: Vector3[]
  /** Thickness at t (0..1 along the path). */
  radius: (t: number) => number
  /** Star tip points (0 = round tip). */
  star: number
  /** Turns of twist over the whole stroke (rope and rosettes). */
  twist: number
  /** Flatten the cross-section sideways (ruffles). */
  flat?: number
  /** Ripple the edge (ruffles), in waves along the stroke. */
  ripple?: number
}

export type PipeBuild = { geometry: BufferGeometry; /** index count at the end of each stroke */ ends: number[]; starts: Vector3[] }

const SECTION = 16

/**
 * Builds many piped strokes into one geometry, in piping order, so the piping
 * animation can reveal it by growing the draw range.
 */
export function buildStrokes(strokes: Stroke[]): PipeBuild {
  const pos: number[] = []
  const idx: number[] = []
  const ends: number[] = []
  const starts: Vector3[] = []
  const up = new Vector3(0, 1, 0)
  for (const s of strokes) {
    const n = s.path.length
    if (n < 2) continue
    starts.push(s.path[0].clone())
    const baseVert = pos.length / 3
    let normal = new Vector3()
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const p = s.path[i]
      const tan = s.path[Math.min(n - 1, i + 1)].clone().sub(s.path[Math.max(0, i - 1)]).normalize()
      if (i === 0) {
        normal = Math.abs(tan.dot(up)) > 0.9 ? new Vector3(1, 0, 0) : up.clone()
        normal.sub(tan.clone().multiplyScalar(normal.dot(tan))).normalize()
      } else {
        // parallel transport keeps the frame from flipping
        normal.sub(tan.clone().multiplyScalar(normal.dot(tan))).normalize()
      }
      const bin = tan.clone().cross(normal).normalize()
      const r = s.radius(t)
      const tw = t * s.twist * Math.PI * 2
      for (let j = 0; j < SECTION; j++) {
        const a = (j / SECTION) * Math.PI * 2
        let rr = r
        if (s.star) rr *= 0.78 + 0.22 * Math.cos(s.star * (a + tw))
        if (s.ripple) rr *= 1 + 0.25 * Math.sin(a * 2) * Math.sin(t * s.ripple * Math.PI * 2)
        const fx = Math.cos(a) * rr * (s.flat ?? 1)
        const fy = Math.sin(a) * rr
        pos.push(p.x + normal.x * fy + bin.x * fx, p.y + normal.y * fy + bin.y * fx, p.z + normal.z * fy + bin.z * fx)
      }
    }
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < SECTION; j++) {
        const a = baseVert + i * SECTION + j
        const b = baseVert + i * SECTION + ((j + 1) % SECTION)
        const c = a + SECTION
        const d = b + SECTION
        idx.push(a, c, b, b, c, d)
      }
    }
    ends.push(idx.length)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geometry.setIndex(idx)
  geometry.computeVertexNormals()
  return { geometry, ends, starts }
}

/** A conical spiral, like a rosette piped from the outside in. */
export function spiralPath(center: Vector3, radius: number, turns: number, rise: number, steps = 48): Vector3[] {
  const out: Vector3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * Math.PI * 2
    const r = radius * (1 - t * 0.85)
    out.push(new Vector3(center.x + Math.cos(a) * r, center.y + t * rise, center.z + Math.sin(a) * r))
  }
  return out
}
