import { Outlines } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, MeshPhysicalMaterial, MeshToonMaterial, type Group, type Material, type Mesh } from 'three'
import { FLAVORS, spongeColorOf, tierStyleOf, useStore } from '../store'
import { COAT, tierBoxes, type TierBox } from './layout'
import { frostingMaterials, MAPPED, NORMALIZED_V, SPRINKLES, toonGradient } from './materials'
import { outlineOf, type Outline } from './outline'
import Piping from './Piping'
import { crumbGray, faultTextures } from './textures'
import { tierGeometry } from './tierGeometry'

/** Shared registry of frosting meshes, so decorations can be placed on them. */
export const cakeMeshes: { current: Mesh[] } = { current: [] }
/** Bare sponge meshes, used as the surface when the cake is naked. */
export const spongeMeshes: { current: Mesh[] } = { current: [] }
/** False while the cake is dropping onto the stand. */
export const cakeMotion = { settled: true }

/** The meshes decorations stick to. */
export function surfaces(): Mesh[] {
  const coats = cakeMeshes.current.filter((m) => m.parent)
  const coated = new Set(coats.map((m) => m.userData.tier))
  // a naked tier has no coat, so its sponge is the surface
  return [...coats, ...spongeMeshes.current.filter((m) => m.parent && !coated.has(m.userData.tier))]
}

function useRegister(list: { current: Mesh[] }, ref: { current: Mesh | null }, tier: number, dep: unknown) {
  useEffect(() => {
    const m = ref.current
    if (!m) return
    m.userData.tier = tier
    list.current = [...list.current.filter((x) => x.userData.tier !== tier), m]
    return () => {
      list.current = list.current.filter((x) => x !== m)
    }
  }, [list, ref, tier, dep])
}

function useLerpColor(mat: { color: Color } | null, target: string, speed = 10) {
  const goal = useMemo(() => new Color(target), [target])
  useFrame((_, dt) => {
    if (mat) mat.color.lerp(goal, Math.min(1, dt * speed))
  })
}

function Sponge({ o, box, color, filling, comic }: { o: Outline; box: TierBox; color: string; filling: string; comic: boolean }) {
  const geo = useMemo(() => tierGeometry(o, { radius: box.radius, height: box.height, bevel: 0.012, texScale: 0.5 }), [o, box.radius, box.height])
  const mat = useMemo(
    () =>
      comic
        ? new MeshToonMaterial({ color, gradientMap: toonGradient() })
        : new MeshPhysicalMaterial({ color, map: crumbGray(), bumpMap: crumbGray(), bumpScale: 2.5, roughness: 0.92 }),
    // color is eased by useLerpColor; only rebuild when the look changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [comic],
  )
  useLerpColor(mat, color)
  // Two filling layers, slightly proud of the sponge so they read clearly.
  const fillGeo = useMemo(
    () => tierGeometry(o, { radius: box.radius + 0.003, height: 0.055, bevel: 0, texScale: 0.5 }),
    [o, box.radius],
  )
  const fillMat = useMemo(
    () => (comic ? new MeshToonMaterial({ color: filling, gradientMap: toonGradient() }) : new MeshPhysicalMaterial({ color: filling, roughness: 0.45, bumpMap: crumbGray(), bumpScale: 0.6 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [comic],
  )
  useLerpColor(fillMat, filling)
  const ref = useRef<Mesh>(null)
  useRegister(spongeMeshes, ref, box.index, geo)
  return (
    <group>
      <mesh ref={ref} geometry={geo} material={[mat, mat]} castShadow receiveShadow>
        {comic && <Outlines thickness={0.012} color="#111" />}
      </mesh>
      {[0.33, 0.66].map((f) => (
        <mesh key={f} geometry={fillGeo} material={[fillMat, fillMat]} position-y={box.height * f - 0.027} />
      ))}
    </group>
  )
}

function Coat({ o, box, tierIndex }: { o: Outline; box: TierBox; tierIndex: number }) {
  const finish = useStore((s) => tierStyleOf(s, tierIndex).finish)
  const frosting = useStore((s) => tierStyleOf(s, tierIndex).frostingColor)
  const accent = useStore((s) => tierStyleOf(s, tierIndex).accentColor)
  const piping = useStore((s) => tierStyleOf(s, tierIndex).pipingColor)
  const normalizedV = NORMALIZED_V.includes(finish)
  const geo = useMemo(
    () =>
      tierGeometry(o, {
        radius: box.radius + COAT,
        height: box.height + COAT,
        bevel: finish === 'fondant' || finish === 'comic' ? 0.05 : 0.07,
        texScale: normalizedV ? box.height : finish === 'marble' || finish === 'pressed' ? 1.6 : 0.9,
        normalizedV,
      }),
    [o, box.radius, box.height, finish, normalizedV],
  )
  const mapped = MAPPED.includes(finish)
  // Patterned finishes depend on the colors; plain ones are tinted live.
  const mats = useMemo(
    () => frostingMaterials(finish, { frosting, accent, piping }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finish, mapped ? frosting : '', mapped ? accent : '', mapped ? piping : ''],
  )
  type Tintable = { color: Color }
  const wallTint = mapped ? null : (mats[0] as unknown as Tintable)
  const capTint = mats[1] !== mats[0] ? (mats[1] as unknown as Tintable) : null
  useLerpColor(wallTint, frosting)
  useLerpColor(capTint, frosting)

  const ref = useRef<Mesh>(null)
  useRegister(cakeMeshes, ref, tierIndex, geo)

  // Fault line: the exposed band inside the break.
  const band = useMemo(() => {
    if (finish !== 'faultline') return null
    const g = tierGeometry(o, { radius: box.radius + COAT * 0.35, height: box.height, bevel: 0, texScale: box.height, normalizedV: true })
    const m = new MeshPhysicalMaterial({ map: faultTextures(frosting, SPRINKLES).band, roughness: 0.5 })
    return { g, m }
  }, [finish, o, box.radius, box.height, frosting])

  return (
    <group>
      <mesh ref={ref} name="coat" geometry={geo} material={mats as Material[]} castShadow={!normalizedV} receiveShadow>
        {finish === 'comic' && <Outlines thickness={0.015} color="#111" />}
      </mesh>
      {band && <mesh geometry={band.g} material={[band.m, band.m]} receiveShadow />}
    </group>
  )
}

/**
 * The stacked cake. The first flavor pick drops it onto the stand with a
 * bounce; after that, changes ease in place.
 */
export default function Cake3D() {
  const shape = useStore((s) => s.shape)
  const tiers = useStore((s) => s.tiers)
  const base = useStore((s) => s.base)
  const flavor = useStore((s) => s.flavor)
  const finishes = useStore((s) => Array.from({ length: 3 }, (_, i) => tierStyleOf(s, i).finish).join())
  const sponge = useStore(spongeColorOf)
  const o = outlineOf(shape)
  const boxes = tierBoxes(tiers, base)
  const filling = flavor ? FLAVORS[flavor].filling : '#ffffff'

  const group = useRef<Group>(null)
  const drop = useRef({ y: 0, v: 0, active: false })
  const had = useRef(false)
  useEffect(() => {
    if (flavor && !had.current) {
      drop.current = { y: 4, v: 0, active: true }
    }
    had.current = !!flavor
  }, [flavor])
  useFrame((_, dt) => {
    const d = drop.current
    if (!group.current) return
    cakeMotion.settled = !d.active
    if (d.active) {
      // falling with gravity, then a damped bounce on the stand
      d.v -= 22 * Math.min(dt, 0.05)
      d.y += d.v * Math.min(dt, 0.05)
      if (d.y <= 0) {
        d.y = 0
        d.v = -d.v * 0.32
        if (Math.abs(d.v) < 0.6) {
          d.active = false
          d.v = 0
        }
      }
      group.current.position.y = d.y
      const squash = d.y < 0.02 && Math.abs(d.v) > 0.5 ? 0.97 : 1
      group.current.scale.set(2 - squash, squash, 2 - squash)
    } else {
      group.current.scale.lerp({ x: 1, y: 1, z: 1 } as never, 0.2)
    }
  })

  if (!flavor) return null
  const finishOf = (i: number) => finishes.split(',')[i]

  return (
    <group ref={group}>
      {boxes.map((b) => (
        <group key={b.index} position-y={b.y}>
          <Sponge o={o} box={b} color={sponge} filling={filling} comic={finishOf(b.index) === 'comic'} />
          {finishOf(b.index) !== 'naked' && <Coat o={o} box={b} tierIndex={b.index} />}
          <Piping o={o} box={b} isTop={b.index === boxes.length - 1} />
        </group>
      ))}
    </group>
  )
}
