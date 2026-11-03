import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three'
import type { Outline } from './outline'

type Options = {
  radius: number
  height: number
  /** Rounding of the top edge (frosting); 0 for a sharp sponge edge. */
  bevel: number
  /** World units per texture repeat for side walls. */
  texScale: number
  /** If true, wall v runs 0..1 over the height instead of world units. */
  normalizedV?: boolean
}

/**
 * A tier's side walls, rounded top edge and top, as one geometry with two
 * groups: 0 = sides (and bevel), 1 = top. Normals are set by hand so there is
 * no shading seam where the outline wraps around.
 */
export function tierGeometry(o: Outline, opt: Options): BufferGeometry {
  const { radius, height, bevel, texScale } = opt
  const N = o.points.length
  const base = o.points.map((p) => p.clone().multiplyScalar(radius))
  const perim = o.perimeter * radius
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []

  // Rings from bottom up: wall bottom, wall top, then the bevel steps.
  const BEV = bevel > 0 ? 7 : 0
  const rings: { inset: number; y: number; ny: number; nh: number }[] = [
    { inset: 0, y: 0, ny: 0, nh: 1 },
    { inset: 0, y: height - bevel, ny: 0, nh: 1 },
  ]
  for (let j = 1; j <= BEV; j++) {
    const a = (j / BEV) * (Math.PI / 2)
    rings.push({ inset: bevel * (1 - Math.cos(a)), y: height - bevel + bevel * Math.sin(a), ny: Math.sin(a), nh: Math.cos(a) })
  }

  let vAcc = 0
  rings.forEach((r, ri) => {
    if (ri > 0) {
      const prev = rings[ri - 1]
      vAcc += Math.hypot(r.y - prev.y, r.inset - prev.inset)
    }
    for (let k = 0; k <= N; k++) {
      const kk = k % N
      const p = base[kk].clone().addScaledVector(o.normals[kk], -r.inset)
      const n = o.normals[kk]
      pos.push(p.x, r.y, p.y)
      nor.push(n.x * r.nh, r.ny, n.y * r.nh)
      const u = ((o.dist[k] / o.perimeter) * perim) / texScale
      uv.push(u, opt.normalizedV ? Math.min(1, r.y / height) : vAcc / texScale)
    }
  })
  const row = N + 1
  for (let ri = 0; ri < rings.length - 1; ri++) {
    for (let k = 0; k < N; k++) {
      const a = ri * row + k
      const b = a + 1
      const c = a + row
      const d = c + 1
      idx.push(a, d, b, a, c, d)
    }
  }
  const sideCount = idx.length

  // Top: triangulate the innermost ring.
  const top = rings[rings.length - 1]
  const capRing: Vector2[] = base.map((p, k) => p.clone().addScaledVector(o.normals[k], -top.inset))
  const start = pos.length / 3
  capRing.forEach((p) => {
    pos.push(p.x, height, p.y)
    nor.push(0, 1, 0)
    uv.push(p.x / texScale + 0.5, p.y / texScale + 0.5)
  })
  ShapeUtils.triangulateShape(capRing, []).forEach(([a, b, c]) => idx.push(start + a, start + c, start + b))

  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.addGroup(0, sideCount, 0)
  g.addGroup(sideCount, idx.length - sideCount, 1)
  return g
}
