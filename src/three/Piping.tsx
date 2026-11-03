import { Outlines } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { BufferGeometry, CapsuleGeometry, Color, SphereGeometry, MeshPhysicalMaterial, MeshToonMaterial, Vector2, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { usePipingProgress } from '../hooks/usePipingProgress'
import { useStore, type Piping as PipingKind } from '../store'
import { COAT, type TierBox } from './layout'
import { toonGradient } from './materials'
import { ring, type Outline } from './outline'
import { buildStrokes, spiralPath, type Stroke } from './pipeGeometry'
import { buttercreamBump } from './textures'
import { tierGeometry } from './tierGeometry'

/** Points spaced roughly `step` apart around a ring at height y. */
function around(pts: Vector2[], y: number, step: number, phase = 0): Vector3[] {
  const cum = [0]
  for (let i = 1; i <= pts.length; i++) cum.push(cum[i - 1] + pts[i % pts.length].distanceTo(pts[i - 1]))
  const total = cum[cum.length - 1]
  const n = Math.max(6, Math.round(total / step))
  const out: Vector3[] = []
  let j = 0
  for (let k = 0; k < n; k++) {
    const target = ((k + phase) / n) * total
    while (cum[j + 1] < target) j++
    const f = (target - cum[j]) / (cum[j + 1] - cum[j] || 1)
    const p = pts[j].clone().lerp(pts[(j + 1) % pts.length], f)
    out.push(new Vector3(p.x, y, p.y))
  }
  return out
}

/** The ring as a closed 3D path (for ropes). */
function loop(pts: Vector2[], y: number, step: number): Vector3[] {
  const a = around(pts, y, step)
  return [...a, a[0].clone()]
}

/** Shell border: overlapping teardrop shells, each piped toward the next. */
function shells(pts: Vector2[], y: number, size: number): Stroke[] {
  const c = around(pts, y, size * 1.5)
  return c.map((p, i) => {
    const q = c[(i + 1) % c.length]
    const path = Array.from({ length: 10 }, (_, k) => {
      const t = k / 9
      return p.clone().lerp(q, t * 0.95).setY(y + Math.sin(t * Math.PI) * size * 0.25)
    })
    return { path, radius: (t) => size * (0.25 + 0.75 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.62)) * (1 - t * 0.7), star: 8, twist: 0.15 }
  })
}

function rope(pts: Vector2[], y: number, size: number): Stroke[] {
  const path = loop(pts, y, size * 0.25)
  const turns = path.length / 7
  return [{ path, radius: (t) => size * (0.82 + 0.18 * Math.abs(Math.sin(t * turns * Math.PI))), star: 6, twist: turns }]
}

function rosettes(pts: Vector2[], y: number, size: number): Stroke[] {
  return around(pts, y, size * 2.1).map((c) => ({ path: spiralPath(c, size * 0.9, 1.6, size * 0.9, 40), radius: () => size * 0.42, star: 7, twist: 0 }))
}

/** Lambeth-style swags draped along the side, with a ruffle edge. */
function swags(pts: Vector2[], yTop: number, drop: number, size: number): Stroke[] {
  const anchors = around(pts, yTop, size * 9)
  return anchors.map((a, i) => {
    const b = anchors[(i + 1) % anchors.length]
    const path = Array.from({ length: 30 }, (_, k) => {
      const t = k / 29
      const p = a.clone().lerp(b, t)
      // push outward a touch at the middle so it hangs off the side
      const out = new Vector3(p.x, 0, p.z).normalize().multiplyScalar(Math.sin(t * Math.PI) * size * 0.4)
      return p.add(out).setY(yTop - Math.sin(t * Math.PI) * drop)
    })
    return { path, radius: () => size * 0.5, star: 0, twist: 0, flat: 1.8, ripple: 7 }
  })
}

function beadStrokes(pts: Vector2[], y: number, size: number): Stroke[] {
  return around(pts, y, size * 2).map((c) => {
    const path = Array.from({ length: 10 }, (_, k) => c.clone().setY(y - size + (k / 9) * size * 2))
    return { path, radius: (t) => size * Math.sqrt(Math.max(0, Math.sin(t * Math.PI))), star: 0, twist: 0 }
  })
}

function strokesFor(kind: PipingKind, o: Outline, box: TierBox, isTop: boolean): Stroke[] {
  const r = box.radius + COAT
  const topY = box.height + COAT
  const topRing = ring(o, r, -0.07)
  const footRing = ring(o, r, 0.012)
  const s = 0.058
  switch (kind) {
    case 'shell':
      return [...shells(topRing, topY + 0.005, s), ...shells(footRing, s * 0.55, s * 1.1)]
    case 'twist':
      return [...rope(topRing, topY + 0.01, s * 0.62), ...rope(footRing, s * 0.6, s * 0.7)]
    case 'beads':
      return [...beadStrokes(topRing, topY + 0.01, s * 0.55), ...beadStrokes(footRing, s * 0.6, s * 0.6)]
    case 'swirl': {
      const top = rosettes(ring(o, r, -0.1), topY - 0.005, s * 1.2)
      if (isTop) top.push({ path: spiralPath(new Vector3(0, topY - 0.005, 0), s * 2.2, 2.4, s * 2.2, 70), radius: () => s * 0.5, star: 7, twist: 0 })
      return [...top, ...shells(footRing, s * 0.55, s * 1.1)]
    }
    case 'ruffle':
      return [
        ...shells(topRing, topY + 0.005, s * 0.9),
        ...swags(ring(o, r, 0.01), topY - 0.06, box.height * 0.3, s * 0.7),
        ...beadStrokes(ring(o, r, 0.02), topY - 0.06, s * 0.35).filter((_, i) => i % 4 === 0),
        ...shells(footRing, s * 0.55, s * 1.1),
      ]
    default:
      return []
  }
}

function PipingBag({ position, color }: { position: Vector3; color: string }) {
  return (
    <group position={position} rotation-z={-0.35}>
      <mesh position-y={0.3}>
        <coneGeometry args={[0.13, 0.5, 24, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.6} roughness={0.25} thickness={0.05} transparent opacity={0.7} side={2} />
      </mesh>
      <mesh position-y={0.27} scale={[0.85, 0.75, 0.85]}>
        <coneGeometry args={[0.13, 0.5, 24]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position-y={0.035}>
        <cylinderGeometry args={[0.025, 0.012, 0.07, 8]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  )
}

/** Piped borders and decorations on one tier, plus an optional ganache drip. */
export default function Piping({ o, box, isTop }: { o: Outline; box: TierBox; isTop: boolean }) {
  const kind = useStore((s) => s.piping)
  const color = useStore((s) => s.pipingColor)
  const comic = useStore((s) => s.finish === 'comic')
  const tiers = useStore((s) => s.tiers)
  const run = useStore((s) => s.pipingRun)
  const progress = usePipingProgress(run, 1400 * tiers)

  const built = useMemo(() => buildStrokes(strokesFor(kind, o, box, isTop)), [kind, o, box, isTop])
  const mat = useMemo(
    () =>
      comic
        ? new MeshToonMaterial({ color, gradientMap: toonGradient() })
        : new MeshPhysicalMaterial({ color, roughness: 0.5, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new Color('#fff'), bumpMap: buttercreamBump(0.5), bumpScale: 0.3 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [comic],
  )
  const goal = useMemo(() => new Color(color), [color])
  useFrame((_, dt) => mat.color.lerp(goal, Math.min(1, dt * 10)))

  // Each tier pipes in its own slice of the animation, bottom tier first.
  const slice = 1 / tiers
  const local = Math.max(0, Math.min(1, (progress - box.index * slice) / slice))
  const total = built.geometry.index?.count ?? 0
  const shown = Math.floor((total * local) / 3) * 3
  built.geometry.setDrawRange(0, shown)
  let bag: Vector3 | null = null
  if (local > 0 && local < 1 && built.ends.length) {
    const k = built.ends.findIndex((e) => e >= shown)
    bag = (built.starts[Math.max(0, k)] ?? built.starts[0]).clone().add(new Vector3(0, 0.04, 0))
  }

  if (kind === 'none') return <Drip o={o} box={box} />
  return (
    <group>
      <mesh geometry={built.geometry} material={mat} castShadow>
        {comic && <Outlines thickness={0.008} color="#111" />}
      </mesh>
      {bag && <PipingBag position={bag} color={color} />}
      <Drip o={o} box={box} />
    </group>
  )
}

/** Glossy ganache poured over the top edge, with drips down the sides. */
function Drip({ o, box }: { o: Outline; box: TierBox }) {
  const on = useStore((s) => s.drip)
  const color = useStore((s) => s.dripColor)
  const parts = useMemo(() => {
    if (!on) return null
    const r = box.radius + COAT
    const top = box.height + COAT
    const pts = around(ring(o, r, 0.008), top, 0.095)
    let seed = 5 + box.index * 17
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    // Uneven drips: mostly short, a few long ones, each ending in a heavier bead.
    const parts: BufferGeometry[] = []
    pts.forEach((p, i) => {
      const jitter = (rnd() - 0.5) * 0.4
      const q = pts[(i + 1) % pts.length]
      const at = p.clone().lerp(q, 0.5 + jitter * 0.5)
      const long = rnd() < 0.22
      const len = long ? 0.18 + rnd() * 0.2 : 0.03 + Math.pow(rnd(), 1.5) * 0.12
      const rad = 0.022 + rnd() * 0.012
      const g = new CapsuleGeometry(rad, len, 4, 10)
      g.translate(at.x, top - len / 2 - 0.012, at.z)
      parts.push(g)
      const bead = new SphereGeometry(rad * 1.12, 12, 8)
      bead.scale(1, 1.15, 1)
      bead.translate(at.x, top - len - 0.012 - rad * 0.2, at.z)
      parts.push(bead)
    })
    const drips = mergeGeometries(parts, false)
    const pour = tierGeometry(o, { radius: r + 0.008, height: 0.02, bevel: 0.01, texScale: 1 })
    return { drips, pour, top }
  }, [on, o, box])
  const mat = useMemo(() => new MeshPhysicalMaterial({ roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08 }), [])
  const goal = useMemo(() => new Color(color), [color])
  useFrame((_, dt) => mat.color.lerp(goal, Math.min(1, dt * 10)))
  if (!parts) return null
  return (
    <group>
      <mesh geometry={parts.drips} material={mat} castShadow />
      <mesh geometry={parts.pour} material={[mat, mat]} position-y={parts.top - 0.012} castShadow />
    </group>
  )
}
