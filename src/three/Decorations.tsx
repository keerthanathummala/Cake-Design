import { createPortal, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { fontOf } from '../lib/fonts'
import {
  Box3,
  Euler,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Group,
  type Intersection,
  type Texture,
} from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { useThumbs } from '../lib/thumbs'
import { topperInfo, TOPPERS } from '../lib/toppers'
import { newId, useStore, type Decal, type QueueItem, type Spot, type Topper } from '../store'
import { bridge } from './bridge'
import { cakeMotion, surfaces } from './Cake3D'
import { COAT, tierBoxes } from './layout'
import { messageTexture } from './textures'
import { TopperModel as ModelOf } from './toppers'

const UP = new Vector3(0, 1, 0)
type Hit = { point: Vector3; normal: Vector3; tier: number }

function toHit(h: Intersection | undefined): Hit | null {
  if (!h || !h.face) return null
  const normal = h.face.normal.clone().transformDirection(h.object.matrixWorld)
  return { point: h.point.clone(), normal, tier: h.object.userData.tier ?? 0 }
}

const ray = new Raycaster()
function castOnto(origin: Vector3, dir: Vector3): Hit | null {
  const list = surfaces()
  list.forEach((m) => m.updateWorldMatrix(true, false))
  ray.set(origin, dir.clone().normalize())
  return toHit(ray.intersectObjects(list, false)[0])
}

/** Orientation that stands a model on the surface, spun around the normal. */
function surfaceQuat(normal: [number, number, number], spinDeg: number) {
  const n = new Vector3(...normal).normalize()
  const q = new Quaternion().setFromUnitVectors(UP, n)
  return q.multiply(new Quaternion().setFromAxisAngle(UP, (spinDeg * Math.PI) / 180))
}

/** Projector orientation for a decal: its z faces out of the surface. */
function decalEuler(normal: Vector3, spinDeg: number) {
  const up = Math.abs(normal.y) > 0.7 ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0)
  const m = new Matrix4().lookAt(normal, new Vector3(), up)
  m.multiply(new Matrix4().makeRotationZ((-spinDeg * Math.PI) / 180))
  return new Euler().setFromRotationMatrix(m)
}

// ---------- automatic placement ----------

function spots(where: Spot, count: number, offset: number): Hit[] {
  const s = useStore.getState()
  const boxes = tierBoxes(s.tiers, s.base)
  const top = boxes[boxes.length - 1]
  const bottom = boxes[0]
  const R = top.radius + COAT
  const out: Hit[] = []
  const down = new Vector3(0, -1, 0)
  for (let i = 0; i < count; i++) {
    const k = i + offset
    let hit: Hit | null = null
    if (where === 'center') {
      hit = castOnto(new Vector3((i % 2 ? 1 : -1) * 0.05 * i, 10, 0.04 * i), down)
    } else if (where === 'top') {
      const a = k * 2.399 + 0.6
      const f = 0.2 + 0.5 * Math.sqrt(((k % 9) + 0.5) / 9)
      hit = castOnto(new Vector3(Math.cos(a) * R * f, 10, Math.sin(a) * R * f), down)
    } else if (where === 'ring') {
      const a = (i / count) * Math.PI * 2 + Math.PI / 2
      hit = castOnto(new Vector3(Math.cos(a) * R * 0.74, 10, Math.sin(a) * R * 0.74), down)
    } else if (where === 'ledge' && boxes.length > 1) {
      const ledges = boxes.length - 1
      const b = boxes[i % ledges]
      const above = boxes[b.index + 1]
      const rr = (b.radius + above.radius) / 2 + COAT
      const perLedge = Math.ceil(count / ledges)
      const cam = bridge.camera?.position ?? new Vector3(0, 2, 6)
      const a = Math.atan2(cam.z, cam.x) + (Math.floor(i / ledges) - (perLedge - 1) / 2) * 0.3 + (b.index ? 0.15 : -0.15)
      hit = castOnto(new Vector3(Math.cos(a) * rr, 10, Math.sin(a) * rr), down)
    } else {
      // on the side of the bottom tier: 'front' faces the camera, 'side' spreads around
      const cam = bridge.camera?.position ?? new Vector3(0, 2, 6)
      const base = Math.atan2(cam.z, cam.x)
      const a = where === 'front' ? base + (i - (count - 1) / 2) * 0.32 : base + (i / count) * Math.PI * 2
      const y = bottom.y + bottom.height * 0.5
      hit = castOnto(new Vector3(Math.cos(a) * 5, y, Math.sin(a) * 5), new Vector3(-Math.cos(a), 0, -Math.sin(a)))
    }
    if (!hit && where === 'ledge') hit = spots('top', 1, k)[0] ?? null
    if (hit) out.push(hit)
  }
  return out
}

const arr = (v: Vector3) => [v.x, v.y, v.z] as [number, number, number]

function processQueue(items: QueueItem[], replace: boolean) {
  const s = useStore.getState()
  const toppers: Topper[] = replace ? [] : [...s.toppers]
  let decals: Decal[] = replace ? [] : [...s.decals]
  let selectedId: string | null = null
  for (const it of items) {
    if (it.kind === 'topper') {
      const offset = toppers.filter((t) => t.kind === it.topper).length + toppers.length
      for (const h of spots(it.where, it.count, offset)) {
        const id = newId()
        toppers.push({ id, kind: it.topper, position: arr(h.point), normal: arr(h.normal), scale: it.scale ?? 1, spin: Math.round(Math.random() * 360) })
        selectedId = id
      }
    } else {
      // a second message on top goes beside the first rather than on it
      const msgs = decals.filter((d) => d.isMessage).length
      const h = (it.kind === 'message' && it.where === 'top' && msgs ? spots('top', 1, msgs * 2 + 1)[0] : null) ?? spots(it.where, 1, 0)[0]
      if (!h) continue
      const id = newId()
      if (it.kind === 'message') {
        const boxes = tierBoxes(s.tiers, s.base)
        const size = Math.min(1.5, (boxes[Math.min(h.tier, boxes.length - 1)].radius + COAT) * (it.where === 'top' ? 1.45 : 1.1))
        const m = s.message
        decals.push({
          id,
          src: '',
          tier: h.tier,
          position: arr(h.point),
          normal: arr(h.normal),
          size,
          aspect: 3,
          spin: 0,
          isMessage: true,
          text: it.text ?? m.text,
          font: it.font ?? m.font,
          color: it.color ?? m.color,
        })
      } else {
        decals.push({ id, src: it.src, tier: h.tier, position: arr(h.point), normal: arr(h.normal), size: 0.5, aspect: it.aspect, spin: 0 })
      }
      selectedId = id
    }
  }
  useStore.setState({ toppers, decals, queue: null, selectedId: replace ? null : selectedId })
}

/** Moves decorations back onto the surface after the cake's shape or size changes. */
function resnap() {
  const s = useStore.getState()
  const snap = (p: [number, number, number], n: [number, number, number]): Hit | null => {
    const pos = new Vector3(...p)
    const nor = new Vector3(...n)
    return (
      castOnto(pos.clone().addScaledVector(nor, 0.5), nor.clone().negate()) ??
      castOnto(new Vector3(pos.x, 10, pos.z), new Vector3(0, -1, 0))
    )
  }
  const toppers = s.toppers.map((t) => {
    const h = snap(t.position, t.normal)
    return h ? { ...t, position: arr(h.point), normal: arr(h.normal) } : t
  })
  const decals = s.decals.map((d) => {
    const h = snap(d.position, d.normal)
    return h ? { ...d, position: arr(h.point), normal: arr(h.normal), tier: h.tier } : d
  })
  useStore.setState({ toppers, decals })
}

function usePlacement() {
  const frames = useRef(0)
  const shape = useStore((s) => s.shape)
  const tiers = useStore((s) => s.tiers)
  const base = useStore((s) => s.base)
  const finish = useStore((s) => s.finish)
  const looks = useStore((s) => s.tierStyles.map((t) => t?.finish ?? '').join())
  const snapRun = useStore((s) => s.snapRun)
  const pendingSnap = useRef(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    pendingSnap.current = true
    frames.current = 0
  }, [shape, tiers, base, finish, looks, snapRun])
  useFrame(() => {
    const q = useStore.getState().queue
    if (!q && !pendingSnap.current) return
    if (!cakeMotion.settled || !surfaces().length) return
    // give freshly built tiers a couple of frames to land in the scene
    if (++frames.current < 3) return
    frames.current = 0
    if (pendingSnap.current) {
      pendingSnap.current = false
      resnap()
    }
    if (q) processQueue(q.items, q.replace)
  })
}

// ---------- dragging along the cake ----------

function useSurfaceDrag(id: string, apply: (h: Hit) => void) {
  const { camera, gl } = useThree()
  return (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const st = useStore.getState()
    st.select(id)
    if (st.step !== 'decorate') st.setStep('decorate')
    useStore.setState({ selectedId: id })
    if (bridge.controls) bridge.controls.enabled = false
    st.setDragging(true)
    const ndc = new Vector2()
    const r = new Raycaster()
    const move = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1)
      r.setFromCamera(ndc, camera)
      const h = toHit(r.intersectObjects(surfaces(), false)[0])
      if (h) apply(h)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (bridge.controls) bridge.controls.enabled = true
      useStore.getState().setDragging(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
}

const hover = {
  onPointerOver: () => (document.body.style.cursor = 'grab'),
  onPointerOut: () => (document.body.style.cursor = ''),
}

function SelectionRing({ radius, thin }: { radius: number; thin?: boolean }) {
  return (
    <mesh userData={{ helper: true }} rotation-x={-Math.PI / 2} position-y={0.012} renderOrder={10}>
      <ringGeometry args={[radius, radius * (thin ? 1.025 : 1.1), 64]} />
      <meshBasicMaterial color="#d6456b" transparent opacity={0.9} depthTest={false} toneMapped={false} />
    </mesh>
  )
}

/** Height range of each model in its own units, measured once, for flipping. */
const modelSpan = new Map<string, [number, number]>()

function TopperItem({ t, selected }: { t: Topper; selected: boolean }) {
  const info = topperInfo(t.kind)
  const q = useMemo(() => surfaceQuat(t.normal, t.spin), [t.normal, t.spin])
  const onDown = useSurfaceDrag(t.id, (h) => useStore.getState().updateTopper(t.id, { position: arr(h.point), normal: arr(h.normal) }, 'drag' + t.id))
  const flipRef = useRef<Group>(null)
  const [span, setSpan] = useState(() => modelSpan.get(t.kind) ?? null)
  useLayoutEffect(() => {
    if (span || !flipRef.current) return
    const g = flipRef.current
    g.updateWorldMatrix(true, true)
    const box = new Box3().setFromObject(g).applyMatrix4(g.matrixWorld.clone().invert())
    const v: [number, number] = [box.min.y, box.max.y]
    modelSpan.set(t.kind, v)
    setSpan(v)
  }, [span, t.kind])
  // Upside down: turn over and lift so it still rests on the surface.
  const lift = t.flip && span ? span[0] + span[1] : 0
  return (
    <group position={t.position} quaternion={q} scale={info.size * t.scale} onPointerDown={onDown} {...hover}>
      <group rotation-x={((t.tilt ?? 0) * Math.PI) / 180}>
        <group ref={flipRef} rotation-x={t.flip ? Math.PI : 0} position-y={lift}>
          <ModelOf kind={t.kind} look={t} />
        </group>
      </group>
      {selected && <SelectionRing radius={0.62} />}
    </group>
  )
}

// ---------- decals: uploaded pictures and the message ----------

function useImageTexture(src: string) {
  return useMemo(() => {
    if (!src) return null
    const t = new TextureLoader().load(src)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [src])
}

function useMessageTexture(d: Decal): { tex: Texture; aspect: number } | null {
  const draft = useStore((s) => s.message)
  const on = !!d.isMessage
  const text = d.text ?? draft.text
  const font = d.font ?? draft.font
  const color = d.color ?? draft.color
  const [fontsReady, setReady] = useState(0)
  useEffect(() => {
    if (!on || !document.fonts) return
    const f = fontOf(font)
    document.fonts.load(`${f.weight} 120px "${f.family}"`).then(() => setReady((n) => n + 1), () => {})
  }, [on, font])
  const out = useMemo(() => (on && text.trim() ? messageTexture(text, font, color) : null), [on, text, font, color, fontsReady])
  useEffect(() => () => out?.tex.dispose(), [out])
  return out
}

function DecalItem({ d, selected }: { d: Decal; selected: boolean }) {
  const image = useImageTexture(d.isMessage ? '' : d.src)
  const message = useMessageTexture(d)
  const tex = d.isMessage ? message?.tex : image
  const aspect = d.isMessage ? (message?.aspect ?? 3) : d.aspect
  const mat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: d.isMessage ? 0.35 : 0.5,
        clearcoat: d.isMessage ? 0.5 : 0.1,
      }),
    [d.isMessage],
  )
  useEffect(() => {
    mat.map = tex ?? null
    // a little self-light so printed pictures keep their colors in shadow
    mat.emissiveMap = d.isMessage ? null : (tex ?? null)
    mat.emissive.set(d.isMessage ? '#000000' : '#ffffff')
    mat.emissiveIntensity = 0.3
    mat.needsUpdate = true
  }, [mat, tex, d.isMessage])
  const meshRef = useRef<Mesh>(null)
  const key = useRef('')
  // Rebuild the projected geometry when the decal moves or the cake changes.
  useFrame(() => {
    const target = surfaces().find((m) => m.userData.tier === d.tier) ?? surfaces()[0]
    const mesh = meshRef.current
    if (!target || !mesh || !cakeMotion.settled) return
    const k = [d.position, d.normal, d.size, d.spin, aspect, target.geometry.uuid].join('|')
    if (k === key.current) return
    key.current = k
    target.updateWorldMatrix(true, false)
    const w = d.size
    const h = d.size / aspect
    const n = new Vector3(...d.normal).normalize()
    const g = new DecalGeometry(target, new Vector3(...d.position), decalEuler(n, d.spin), new Vector3(w, h, Math.min(0.5, Math.max(w, h))))
    const old = mesh.geometry as BufferGeometry
    mesh.geometry = g
    old.dispose()
  })
  const onDown = useSurfaceDrag(d.id, (h) =>
    useStore.getState().updateDecal(d.id, { position: arr(h.point), normal: arr(h.normal), tier: h.tier }, 'drag' + d.id),
  )
  const q = useMemo(() => surfaceQuat(d.normal, 0), [d.normal])
  return (
    <group>
      <mesh ref={meshRef} material={mat} onPointerDown={onDown} {...hover} renderOrder={2} />
      {selected && (
        <group position={d.position} quaternion={q}>
          <SelectionRing radius={d.size * 0.6} thin />
        </group>
      )}
    </group>
  )
}

// ---------- thumbnails for the decorate panel ----------

function Thumbs() {
  const { gl, scene, size } = useThree()
  const scenes = useMemo(() => TOPPERS.map(() => new Scene()), [])
  const groups = useRef<(Group | null)[]>([])
  const frames = useRef(0)
  const done = useRef(false)
  const [finished, setFinished] = useState(false)
  useFrame(() => {
    if (done.current || ++frames.current < 4) return
    done.current = true
    const pr = gl.getPixelRatio()
    const S = 112
    const out: Record<string, string> = {}
    const c2 = document.createElement('canvas')
    c2.width = c2.height = 160
    const ctx = c2.getContext('2d')!
    const cam = new PerspectiveCamera(28, 1, 0.01, 50)
    const prevAlpha = gl.getClearAlpha()
    gl.setClearAlpha(0)
    gl.setScissorTest(true)
    gl.setViewport(0, 0, S, S)
    gl.setScissor(0, 0, S, S)
    TOPPERS.forEach((t, i) => {
      const sc = scenes[i]
      const g = groups.current[i]
      if (!g) return
      sc.environment = scene.environment
      sc.background = null
      const box = new Box3().setFromObject(g)
      const center = box.getCenter(new Vector3())
      const dim = box.getSize(new Vector3())
      const r = Math.max(dim.x, dim.y, dim.z) * 0.62
      const dist = r / Math.tan((14 * Math.PI) / 180)
      cam.position.copy(center).add(new Vector3(0, 0.55, 1).normalize().multiplyScalar(dist))
      cam.lookAt(center)
      cam.updateMatrixWorld()
      gl.clear(true, true)
      gl.render(sc, cam)
      ctx.clearRect(0, 0, 160, 160)
      ctx.drawImage(gl.domElement, 0, gl.domElement.height - S * pr, S * pr, S * pr, 0, 0, 160, 160)
      out[t.id] = c2.toDataURL('image/png')
    })
    gl.setScissorTest(false)
    gl.setViewport(0, 0, size.width, size.height)
    gl.setClearAlpha(prevAlpha)
    useThumbs.setState(out)
    setFinished(true)
  })
  if (finished) return null
  return (
    <>
      {TOPPERS.map((t, i) => (
        <Fragment key={t.id}>
          {createPortal(
          <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 4, 3]} intensity={2.2} />
            <directionalLight position={[-3, 1, -2]} intensity={0.6} />
            <group ref={(g) => void (groups.current[i] = g)}>
              <ModelOf kind={t.id} />
            </group>
          </>,
          scenes[i],
          )}
        </Fragment>
      ))}
    </>
  )
}

export default function Decorations() {
  const flavor = useStore((s) => s.flavor)
  const toppers = useStore((s) => s.toppers)
  const decals = useStore((s) => s.decals)
  const selectedId = useStore((s) => s.selectedId)
  const step = useStore((s) => s.step)
  usePlacement()
  const showSel = step === 'decorate'
  return (
    <>
      {flavor &&
        toppers.map((t) => <TopperItem key={t.id} t={t} selected={showSel && selectedId === t.id} />)}
      {flavor && decals.map((d) => <DecalItem key={d.id} d={d} selected={showSel && selectedId === d.id} />)}
      <Thumbs />
    </>
  )
}
