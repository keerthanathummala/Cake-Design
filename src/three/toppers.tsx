import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LatheGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SplineCurve,
  CircleGeometry,
  SRGBColorSpace,
  SpriteMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
  type Material,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CANDLE_DEFAULT, type TopperKind } from '../lib/toppers'
import { buildStrokes, spiralPath } from './pipeGeometry'
import { candleTexture, crumbGray, leafTexture, orangeSliceTexture, strawberryFlesh, strawberrySkin } from './textures'

/*
 * Each model is about one unit across, rests on y = 0 and has +y pointing
 * away from the cake surface. Geometry and materials are built once and shared.
 */

const once = <T,>(f: () => T) => {
  let v: T | undefined
  return () => (v ??= f())
}

function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

// ---------- strawberries ----------

const BERRY_W = 0.39
const berryProfile = once(() => {
  const f = [
    [0, 0], [0.08, 0.3], [0.2, 0.56], [0.38, 0.79], [0.56, 0.94], [0.72, 1], [0.86, 0.92], [0.96, 0.69], [1, 0.31],
  ]
  const curve = new SplineCurve(f.map(([v, w]) => new Vector2(Math.max(0.002, w * BERRY_W), v)))
  const pts = curve.getPoints(40)
  pts.push(new Vector2(0.001, 0.995))
  return pts
})

const berryMats = once(() => {
  const skin = strawberrySkin()
  return {
    skin: new MeshPhysicalMaterial({
      map: skin.map,
      bumpMap: skin.bump,
      bumpScale: 1.4,
      roughness: 0.3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.25,
      sheen: 0.4,
      sheenColor: new Color('#ff9a9a'),
    }),
    flesh: new MeshPhysicalMaterial({ map: strawberryFlesh(), roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, side: DoubleSide }),
  }
})

const halfBerry = once(() => {
  const pts = berryProfile()
  const body = new LatheGeometry(pts, 28, 0, Math.PI)
  // Flat cut face in the x = 0 plane, facing -x.
  // right edge from tip to top, then back down the left edge, with no repeated points
  const edge = pts.slice(0, -1)
  const outline = [...edge.map((p) => new Vector2(p.x, p.y)), ...[...edge].reverse().slice(0, -1).map((p) => new Vector2(-p.x, p.y))]
  const face = new ShapeGeometry(new Shape(outline))
  const pos = face.attributes.position
  const uv = face.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * BERRY_W), pos.getY(i))
  face.rotateY(-Math.PI / 2)
  return { body, face }
})

function StrawberryHalf() {
  const g = halfBerry()
  const m = berryMats()
  // Lying on its back with the cut face toward +y (outward from the cake).
  return (
    <group position={[-0.5, BERRY_W * 0.78, 0]} rotation-z={-Math.PI / 2}>
      <mesh geometry={g.body} material={m.skin} castShadow />
      <mesh geometry={g.face} material={m.flesh} position-x={-0.001} />
    </group>
  )
}

function leafShapeGeometry(len: number, width: number, serrate: number, bend: number, seed = 1) {
  const r = rng(seed)
  const right: Vector2[] = []
  const N = 24
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const saw = serrate * (i % 2 ? 1 : -0.4) * (0.6 + r() * 0.4)
    right.push(new Vector2(width * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.02)), 0.8) * (1 + saw), len * t))
  }
  const pts = [...right, ...[...right].reverse().slice(1).map((p) => new Vector2(-p.x, p.y))]
  const geo = new ShapeGeometry(new Shape(pts), 2)
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    uv.setXY(i, 0.5 + x / width, y / len)
    // cupped across, bent along its length
    pos.setZ(i, Math.pow((2 * x) / width, 2) * width * 0.15 - bend * Math.pow(y / len, 2) * len)
  }
  geo.computeVertexNormals()
  return geo
}

const calyx = once(() => {
  const parts: BufferGeometry[] = []
  for (let k = 0; k < 7; k++) {
    const leaf = leafShapeGeometry(0.34 + (k % 2) * 0.06, 0.12, 0.05, -0.12, k + 3)
    leaf.rotateX(-Math.PI / 2 + 0.25)
    leaf.rotateY((k / 7) * Math.PI * 2)
    parts.push(leaf)
  }
  const stem = new CylinderGeometry(0.02, 0.03, 0.14, 8)
  stem.translate(0, -0.02, 0)
  parts.push(stem)
  return mergeGeometries(parts.map((p) => p.toNonIndexed()), false)
})

const greenLeaf = once(() => {
  const t = leafTexture('#3f7d2c')
  return new MeshPhysicalMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.2, roughness: 0.5, side: DoubleSide, sheen: 0.3 })
})

function Strawberry() {
  const m = berryMats()
  const body = useMemo(() => new LatheGeometry(berryProfile(), 32), [])
  // Standing tip-up with the green hull spread on the frosting.
  return (
    <group>
      <mesh geometry={body} material={m.skin} rotation-x={Math.PI} position-y={1.0} castShadow />
      <mesh geometry={calyx()} material={greenLeaf()} position-y={0.03} castShadow />
    </group>
  )
}

// ---------- other fruit ----------

const blueberry = once(() => {
  const body = new SphereGeometry(0.5, 40, 28)
  body.scale(1, 0.82, 1)
  const crown: BufferGeometry[] = []
  for (let k = 0; k < 5; k++) {
    const c = new CapsuleGeometry(0.03, 0.08, 3, 6)
    c.rotateZ(0.9)
    c.translate(0.08, 0.02, 0)
    c.rotateY((k / 5) * Math.PI * 2)
    crown.push(c)
  }
  return {
    body,
    crown: mergeGeometries(crown, false),
    mat: new MeshPhysicalMaterial({ color: '#2b375e', roughness: 0.62, sheen: 1, sheenColor: new Color('#a9b8dc'), sheenRoughness: 0.75 }),
    crownMat: new MeshPhysicalMaterial({ color: '#1d2036', roughness: 0.8 }),
  }
})

function Blueberry() {
  const b = blueberry()
  return (
    <group position-y={0.38}>
      <mesh geometry={b.body} material={b.mat} castShadow />
      <mesh geometry={b.crown} material={b.crownMat} position-y={0.39} />
    </group>
  )
}

const raspberry = once(() => {
  const r = rng(11)
  const parts: BufferGeometry[] = []
  const rows = 8
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1)
    const y = 0.06 + t * 0.78
    const rad = 0.06 + 0.36 * Math.sqrt(1 - Math.pow(t, 2.4))
    const n = Math.max(1, Math.round((2 * Math.PI * rad) / 0.16))
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + i * 0.4 + r() * 0.1
      const s = new SphereGeometry(0.095 + r() * 0.012, 12, 10)
      s.translate(Math.cos(a) * rad, y, Math.sin(a) * rad)
      parts.push(s)
    }
  }
  return {
    geo: mergeGeometries(parts, false),
    mat: new MeshPhysicalMaterial({ color: '#a8102c', roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.8, sheenColor: new Color('#ff6f8b') }),
  }
})

function Raspberry() {
  const r = raspberry()
  return <mesh geometry={r.geo} material={r.mat} castShadow />
}

const cherry = once(() => {
  const body = new SphereGeometry(0.45, 40, 30)
  const p = body.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const d = Math.hypot(x, z)
    if (y > 0) p.setY(i, y - 0.16 * Math.exp(-Math.pow(d / 0.13, 2)))
  }
  body.computeVertexNormals()
  const curve = new CatmullRomCurve3([new Vector3(0, 0.3, 0), new Vector3(0.04, 0.62, 0.02), new Vector3(0.16, 0.95, 0), new Vector3(0.32, 1.18, -0.02)])
  return {
    body,
    stem: new TubeGeometry(curve, 24, 0.022, 8),
    mat: new MeshPhysicalMaterial({ color: '#6a0716', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    stemMat: new MeshPhysicalMaterial({ color: '#6b5a24', roughness: 0.7 }),
  }
})

function Cherry() {
  const c = cherry()
  return (
    <group position-y={0.42}>
      <mesh geometry={c.body} material={c.mat} castShadow />
      <mesh geometry={c.stem} material={c.stemMat} castShadow />
    </group>
  )
}

const orange = once(() => {
  const geo = new CylinderGeometry(0.5, 0.5, 0.05, 48)
  const face = new MeshPhysicalMaterial({ map: orangeSliceTexture(), roughness: 0.3, clearcoat: 0.6, sheen: 0.4, sheenColor: new Color('#ffcf8a') })
  const rind = new MeshPhysicalMaterial({ color: '#b84a10', roughness: 0.6 })
  return { geo, mats: [rind, face, face] as Material[] }
})

function Orange() {
  const o = orange()
  // leaning on its edge, as it would be pressed into frosting
  return <mesh geometry={o.geo} material={o.mats} position-y={0.38} rotation-x={1.15} castShadow />
}


/** Thin lengthwise slice of strawberry: flesh on both faces, skin round the edge. */
const berrySlice = once(() => {
  const pts = berryProfile().slice(0, -1)
  const outline = [...pts.map((p) => new Vector2(p.x, p.y)), ...[...pts].reverse().slice(0, -1).map((p) => new Vector2(-p.x * 0.92, p.y))]
  const g = new ExtrudeGeometry(new Shape(outline), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 4 })
  const pos = g.attributes.position
  const uv = g.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * BERRY_W), pos.getY(i))
  return g
})

function StrawberrySlice() {
  const m = berryMats()
  // groups: 0 = faces (flesh), 1 = edge (skin); lying flat, tip pointing +x
  return (
    <group position={[-0.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      <mesh geometry={berrySlice()} material={[m.flesh, m.skin]} castShadow />
    </group>
  )
}

const cherryHalf = once(() => {
  const body = new SphereGeometry(0.45, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2)
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128)
  g.addColorStop(0, '#d23a4f')
  g.addColorStop(0.7, '#9c0f24')
  g.addColorStop(0.95, '#5e0614')
  g.addColorStop(1, '#3d030c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  // the stone's hollow
  ctx.fillStyle = '#e8c9a0'
  ctx.beginPath()
  ctx.ellipse(128, 128, 30, 38, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(80,20,10,0.5)'
  ctx.beginPath()
  ctx.ellipse(132, 132, 22, 30, 0, 0, Math.PI * 2)
  ctx.fill()
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  const face = new CircleGeometry(0.45, 40)
  face.rotateX(-Math.PI / 2)
  return {
    body,
    face,
    faceMat: new MeshPhysicalMaterial({ map: tex, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
  }
})

function CherryHalf() {
  const c = cherry()
  const h = cherryHalf()
  // dome down, glossy cut face up
  return (
    <group position-y={0.42} rotation-x={Math.PI}>
      <mesh geometry={h.body} material={c.mat} castShadow />
      <mesh geometry={h.face} material={h.faceMat} rotation-x={Math.PI} />
    </group>
  )
}

const orangeHalf = once(() => {
  const geo = new CylinderGeometry(0.5, 0.5, 0.05, 48, 1, false, 0, Math.PI)
  const cut = new PlaneGeometry(1, 0.05)
  cut.rotateY(Math.PI / 2)
  return { geo, cut }
})

function OrangeHalf() {
  const o = orange()
  const h = orangeHalf()
  return (
    <group position-y={0.03}>
      <mesh geometry={h.geo} material={o.mats} castShadow />
      <mesh geometry={h.cut} material={o.mats[1]} />
    </group>
  )
}

// ---------- flowers ----------

function petalGeometry(width: number, height: number, cup: number, curl: number) {
  const g = new PlaneGeometry(1, 1, 8, 10)
  g.translate(0, 0.5, 0)
  const p = g.attributes.position
  const colors: number[] = []
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i)
    const v = p.getY(i)
    const w = Math.pow(Math.sin(Math.PI * (0.12 + 0.86 * v)), 0.7) * (1 - 0.1 * v)
    const x = u * w * width
    const y = v * height
    const z = cup * Math.pow(u * 2, 2) * width * 0.35 - curl * Math.pow(v, 3) * height * 0.45
    p.setXYZ(i, x, y, z)
    const shadeV = 0.78 + 0.22 * v
    colors.push(shadeV, shadeV, shadeV)
  }
  g.setAttribute('color', new Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

const roseGeometry = once(() => {
  const parts: BufferGeometry[] = []
  const N = 24
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1)
    // tight cupped petals in the middle, opening and curling back toward the outside
    const petal = petalGeometry(0.26 + 0.36 * k, 0.34 + 0.16 * k, 1.5 - 0.7 * k, 0.05 + 0.55 * k * k)
    petal.rotateX(-(0.06 + 0.95 * Math.pow(k, 1.8)))
    petal.translate(0, 0.02 * (1 - k), -(0.03 + 0.24 * k))
    petal.rotateY(i * 2.399)
    parts.push(petal.toNonIndexed())
  }
  // sepals peeking out underneath
  return mergeGeometries(parts, false)
})

const roseMat = (color: string) =>
  new MeshPhysicalMaterial({
    color,
    vertexColors: true,
    roughness: 0.5,
    side: DoubleSide,
    sheen: 0.8,
    sheenColor: new Color('#ffffff'),
    sheenRoughness: 0.45,
    emissive: new Color(color),
    emissiveIntensity: 0.12,
  })
const pinkRose = once(() => roseMat('#f7bccb'))
const whiteRose = once(() => roseMat('#fbf5ec'))

function Rose({ white }: { white?: boolean }) {
  return (
    <group position-y={0.02}>
      <mesh geometry={roseGeometry()} material={white ? whiteRose() : pinkRose()} castShadow />
      <mesh geometry={leafShapeGeometry(0.42, 0.22, 0.06, 0.05, 7)} material={greenLeaf()} rotation={[-Math.PI / 2 + 0.15, 0.6, 0]} position={[0.08, 0.02, 0.05]} />
    </group>
  )
}

const babysBreath = once(() => {
  const r = rng(29)
  const stems: BufferGeometry[] = []
  const buds: BufferGeometry[] = []
  for (let s = 0; s < 6; s++) {
    const a = (s / 6) * Math.PI * 2 + r()
    const tip = new Vector3(Math.cos(a) * (0.2 + r() * 0.25), 0.5 + r() * 0.35, Math.sin(a) * (0.2 + r() * 0.25))
    const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), tip.clone().multiplyScalar(0.5).setY(tip.y * 0.45), tip])
    stems.push(new TubeGeometry(curve, 10, 0.012, 5))
    for (let b = 0; b < 9; b++) {
      const at = tip.clone().add(new Vector3((r() - 0.5) * 0.22, (r() - 0.3) * 0.16, (r() - 0.5) * 0.22))
      const bud = new IcosahedronGeometry(0.035 + r() * 0.02, 1)
      bud.translate(at.x, at.y, at.z)
      buds.push(bud)
    }
  }
  return {
    stems: mergeGeometries(stems, false),
    buds: mergeGeometries(buds, false),
    stemMat: new MeshPhysicalMaterial({ color: '#7c9461', roughness: 0.7 }),
    budMat: new MeshPhysicalMaterial({ color: '#fbfaf5', roughness: 0.8, sheen: 1, sheenColor: new Color('#ffffff') }),
  }
})

function BabysBreath() {
  const b = babysBreath()
  return (
    <group>
      <mesh geometry={b.stems} material={b.stemMat} />
      <mesh geometry={b.buds} material={b.budMat} castShadow />
    </group>
  )
}

const mint = once(() => {
  const t = leafTexture('#4e9a3c')
  const mat = new MeshPhysicalMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 2, roughness: 0.38, clearcoat: 0.3, side: DoubleSide })
  const leaves = [0, 1, 2].map((k) => {
    const g = leafShapeGeometry(0.62 - k * 0.12, 0.38 - k * 0.06, 0.07, 0.12, k + 20)
    g.rotateX(-Math.PI / 2 + 0.35 + k * 0.15)
    g.rotateY(k === 0 ? 0 : k === 1 ? 2.2 : -2.2)
    g.translate(0, 0.04 + k * 0.03, 0)
    return g
  })
  return { geo: mergeGeometries(leaves, false), mat }
})

function Mint() {
  const m = mint()
  return <mesh geometry={m.geo} material={m.mat} castShadow />
}

// ---------- sweets ----------

const macaronGeo = once(() => {
  const shell = new LatheGeometry(
    [
      [0.001, 0], [0.45, 0], [0.5, 0.04], [0.49, 0.12], [0.42, 0.2], [0.26, 0.26], [0.001, 0.28],
    ].map(([x, y]) => new Vector2(x, y)),
    48,
  )
  const foot = new CylinderGeometry(0.5, 0.47, 0.07, 48, 1, true)
  const filling = new CylinderGeometry(0.44, 0.44, 0.13, 48)
  return { shell, foot, filling }
})

const macaronMats = (shell: string, filling: string) => ({
  shell: new MeshPhysicalMaterial({ color: shell, roughness: 0.55, bumpMap: crumbGray(), bumpScale: 0.25, sheen: 0.3 }),
  foot: new MeshPhysicalMaterial({ color: shell, roughness: 0.95, bumpMap: crumbGray(), bumpScale: 4 }),
  filling: new MeshPhysicalMaterial({ color: filling, roughness: 0.45, bumpMap: crumbGray(), bumpScale: 0.8 }),
})
const pinkMacaron = once(() => macaronMats('#f2b2c2', '#fbf0e2'))
const pistachioMacaron = once(() => macaronMats('#c6d9a6', '#f6efd9'))

function Macaron({ pistachio }: { pistachio?: boolean }) {
  const g = macaronGeo()
  const m = pistachio ? pistachioMacaron() : pinkMacaron()
  // standing on its edge, leaning back a little
  return (
    <group position-y={0.5} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
      <mesh geometry={g.shell} material={m.shell} position-y={0.135} castShadow />
      <mesh geometry={g.foot} material={m.foot} position-y={0.1} />
      <mesh geometry={g.filling} material={m.filling} />
      <mesh geometry={g.foot} material={m.foot} position-y={-0.1} />
      <mesh geometry={g.shell} material={m.shell} position-y={-0.135} rotation-x={Math.PI} castShadow />
    </group>
  )
}

const meringue = once(() => {
  const built = buildStrokes([
    { path: spiralPath(new Vector3(0, 0, 0), 0.34, 2.3, 0.78, 70), radius: (t) => 0.06 + 0.2 * (1 - t), star: 8, twist: 0 },
  ])
  return { geo: built.geometry, mat: new MeshPhysicalMaterial({ color: '#fcf6ec', roughness: 0.85, sheen: 0.6, sheenColor: new Color('#fff') }) }
})

function Meringue() {
  const m = meringue()
  return <mesh geometry={m.geo} material={m.mat} position-y={0.12} castShadow />
}

const truffle = once(() => {
  const g = new SphereGeometry(0.45, 32, 24)
  const p = g.attributes.position
  const r = rng(5)
  for (let i = 0; i < p.count; i++) {
    const k = 1 + (r() - 0.5) * 0.04
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.92, p.getZ(i) * k)
  }
  g.computeVertexNormals()
  return { g, mat: new MeshPhysicalMaterial({ color: '#4a2a1c', roughness: 0.95, bumpMap: crumbGray(), bumpScale: 5 }) }
})

function Truffle() {
  const t = truffle()
  return <mesh geometry={t.g} material={t.mat} position-y={0.4} castShadow />
}

const shard = once(() => {
  const r = rng(17)
  const pts: Vector2[] = []
  const n = 9
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rad = 0.3 + r() * 0.25
    pts.push(new Vector2(Math.cos(a) * rad * 0.8, Math.sin(a) * rad * 1.3 + 0.42))
  }
  const g = new ExtrudeGeometry(new Shape(pts), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 })
  g.translate(0, -0.12, -0.025)
  return { g, mat: new MeshPhysicalMaterial({ color: '#3a1c10', roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.2 }) }
})

function Shard() {
  const s = shard()
  return <mesh geometry={s.g} material={s.mat} rotation-z={0.18} castShadow />
}

// ---------- party ----------

const flameTexture = once(() => {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,220,140,0.9)')
  g.addColorStop(0.3, 'rgba(255,170,60,0.35)')
  g.addColorStop(1, 'rgba(255,140,40,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
})

const candle = once(() => ({
  body: new CylinderGeometry(0.07, 0.07, 1.1, 24),
  wick: new CylinderGeometry(0.012, 0.012, 0.1, 6),
  wickMat: new MeshPhysicalMaterial({ color: '#222', roughness: 1 }),
  flame: new SphereGeometry(1, 16, 12),
  outer: new MeshBasicMaterial({ color: '#ffb340', transparent: true, opacity: 0.9, toneMapped: false }),
  inner: new MeshBasicMaterial({ color: '#fff4cf', toneMapped: false }),
  glow: new SpriteMaterial({ map: flameTexture(), transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }),
}))

/** A thin candle that wiggles up and down like a piped squiggle. */
const squiggle = once(() => {
  const pts: Vector3[] = []
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    pts.push(new Vector3(Math.sin(t * Math.PI * 9) * 0.07, t * 1.05, Math.cos(t * Math.PI * 9) * 0.025))
  }
  const tube = new TubeGeometry(new CatmullRomCurve3(pts), 160, 0.04, 12)
  // tube uvs run along the length on u; swap so stripes wrap around it
  const uv = tube.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * 3)
  const cap = new SphereGeometry(0.04, 12, 8)
  cap.translate(pts[80].x, pts[80].y, pts[80].z)
  return { tube, cap, top: pts[80] }
})

const candleMats = new Map<string, MeshPhysicalMaterial>()
function candleMat(a: string, b: string, pattern: string) {
  const key = `${a}-${b}-${pattern}`
  let m = candleMats.get(key)
  if (!m) {
    m = new MeshPhysicalMaterial({ map: candleTexture(a, b, pattern), roughness: 0.38, clearcoat: 0.35, metalness: pattern === 'glitter' ? 0.3 : 0 })
    candleMats.set(key, m)
  }
  return m
}

export type CandleLook = { color?: string; color2?: string; pattern?: string }

function Flame({ y, x = 0, z = 0 }: { y: number; x?: number; z?: number }) {
  const c = candle()
  const flame = useRef<Group>(null)
  useFrame(({ clock }) => {
    const f = flame.current
    if (!f) return
    const t = clock.elapsedTime + x * 10
    const s = 1 + Math.sin(t * 17) * 0.06 + Math.sin(t * 29) * 0.04
    f.scale.set(1 / s, s, 1 / s)
    f.rotation.z = Math.sin(t * 7) * 0.06
  })
  return (
    <group position={[x, y, z]}>
      <mesh geometry={c.wick} material={c.wickMat} position-y={-0.04} />
      <group ref={flame}>
        <mesh geometry={c.flame} material={c.outer} position-y={0.1} scale={[0.065, 0.15, 0.065]} />
        <mesh geometry={c.flame} material={c.inner} position-y={0.07} scale={[0.035, 0.08, 0.035]} />
        <sprite material={c.glow} position-y={0.1} scale={0.6} />
      </group>
    </group>
  )
}

function Candle({ look }: { look: CandleLook }) {
  const c = candle()
  const m = candleMat(look.color ?? CANDLE_DEFAULT.color, look.color2 ?? CANDLE_DEFAULT.color2, look.pattern ?? CANDLE_DEFAULT.pattern)
  return (
    <group>
      <mesh geometry={c.body} material={m} position-y={0.5} castShadow />
      <Flame y={1.13} />
    </group>
  )
}

function SquigglyCandle({ look }: { look: CandleLook }) {
  const g = squiggle()
  const m = candleMat(look.color ?? '#bfe3f2', look.color2 ?? '#ffffff', look.pattern ?? 'stripes')
  return (
    <group>
      <mesh geometry={g.tube} material={m} castShadow />
      <mesh geometry={g.cap} material={m} />
      <Flame y={g.top.y + 0.08} x={g.top.x} z={g.top.z} />
    </group>
  )
}

const goldLeaf = once(() => {
  const g = new IcosahedronGeometry(0.5, 3)
  const p = g.attributes.position
  const r = rng(41)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    p.setXYZ(i, x * (1 + (r() - 0.5) * 0.25), 0.04 + p.getY(i) * 0.1 + (r() - 0.5) * 0.06, z * 0.75 * (1 + (r() - 0.5) * 0.25))
  }
  const flat = g.toNonIndexed()
  flat.computeVertexNormals()
  return { g: flat, mat: new MeshPhysicalMaterial({ color: '#e0b84f', metalness: 1, roughness: 0.25, flatShading: true }) }
})

function GoldLeaf() {
  const g = goldLeaf()
  return <mesh geometry={g.g} material={g.mat} castShadow />
}

const pearls = once(() => {
  const r = rng(3)
  const parts: BufferGeometry[] = []
  for (let i = 0; i < 6; i++) {
    const rad = 0.12 + r() * 0.1
    const s = new SphereGeometry(rad, 24, 16)
    const a = i * 2.4
    const d = i === 0 ? 0 : 0.22 + r() * 0.12
    s.translate(Math.cos(a) * d, rad, Math.sin(a) * d)
    parts.push(s)
  }
  return {
    g: mergeGeometries(parts, false),
    mat: new MeshPhysicalMaterial({ color: '#f5f0e6', metalness: 0.3, roughness: 0.15, clearcoat: 1, iridescence: 0.8, iridescenceIOR: 1.6 }),
  }
})

function Pearls() {
  const p = pearls()
  return <mesh geometry={p.g} material={p.mat} castShadow />
}

const SPRINKLE_COLORS = ['#f06e9a', '#ffd34d', '#5fc0e6', '#8fd17e', '#b48af2', '#ffffff']
const sprinkles = once(() => {
  const r = rng(9)
  return SPRINKLE_COLORS.map((color, ci) => {
    const parts: BufferGeometry[] = []
    for (let i = 0; i < 12; i++) {
      const c = new CapsuleGeometry(0.022, 0.1, 3, 6)
      c.rotateZ(Math.PI / 2)
      c.rotateY(r() * Math.PI * 2)
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * 0.5
      c.translate(Math.cos(a) * d, 0.02 + ci * 0.002, Math.sin(a) * d)
      parts.push(c)
    }
    return { g: mergeGeometries(parts, false), mat: new MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.6 }) }
  })
})

function Sprinkles() {
  return (
    <group>
      {sprinkles().map((s, i) => (
        <mesh key={i} geometry={s.g} material={s.mat} />
      ))}
    </group>
  )
}

export function TopperModel({ kind, look = {} }: { kind: TopperKind | string; look?: CandleLook }) {
  switch (kind) {
    case 'strawberry-slice':
      return <StrawberrySlice />
    case 'cherry-half':
      return <CherryHalf />
    case 'orange-half':
      return <OrangeHalf />
    case 'candle-squiggle':
      return <SquigglyCandle look={look} />
    case 'strawberry-half':
      return <StrawberryHalf />
    case 'strawberry':
      return <Strawberry />
    case 'blueberry':
      return <Blueberry />
    case 'raspberry':
      return <Raspberry />
    case 'cherry':
      return <Cherry />
    case 'orange':
      return <Orange />
    case 'rose':
      return <Rose />
    case 'rose-white':
      return <Rose white />
    case 'babysbreath':
      return <BabysBreath />
    case 'mint':
      return <Mint />
    case 'macaron':
      return <Macaron />
    case 'macaron-pistachio':
      return <Macaron pistachio />
    case 'meringue':
      return <Meringue />
    case 'truffle':
      return <Truffle />
    case 'shard':
      return <Shard />
    case 'candle':
      return <Candle look={look} />
    case 'goldleaf':
      return <GoldLeaf />
    case 'pearls':
      return <Pearls />
    case 'sprinkles':
      return <Sprinkles />
    default:
      return null
  }
}
