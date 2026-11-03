import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Circle, Group } from 'react-konva'
import { mix } from '../../lib/color'
import { CX, PLATE_Y, TIER_H } from '../../lib/geometry'
import { useAnimatedColor } from '../../hooks/useAnimatedColor'
import { FLAVORS, spongeColorOf, useStore } from '../../store'
import { dollops, tierProgress } from '../../lib/frosting'
import { usePipingProgress } from '../../hooks/usePipingProgress'
import Frosting from './Frosting'
import PipingBag from './PipingBag'
import { bounceOut } from '../../lib/easing'
import Tier from './Tier'

type Crumb = { id: number; x: number; y: number; vx: number; vy: number; r: number }

/**
 * The stacked cake. The first time a flavor is chosen the whole cake drops onto
 * the empty stand; after that a flavor change only recolors it.
 */
export default function Cake() {
  const tiers = useStore((s) => s.tiers)
  const flavor = useStore((s) => s.flavor)
  const sponge = useStore(spongeColorOf)
  const groupRef = useRef<Konva.Group>(null)
  const hadCake = useRef(false)
  const prevTiers = useRef(tiers)
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  const style = useStore((s) => s.frostingStyle)
  const pipingRun = useStore((s) => s.pipingRun)
  const frosting = useAnimatedColor(useStore((s) => s.frostingColor), 250)
  const progress = usePipingProgress(pipingRun, 1300 * tiers)

  const color = useAnimatedColor(sponge, 400)
  const filling = useAnimatedColor(flavor ? FLAVORS[flavor].filling : '#ffffff', 400)

  // Tiers added while a cake is already on the stand drop in one by one.
  const dropFrom = hadCake.current ? prevTiers.current : Infinity
  useEffect(() => {
    prevTiers.current = tiers
  }, [tiers])

  // Whole-cake drop when the stand goes from empty to filled.
  useEffect(() => {
    const g = groupRef.current
    if (!flavor) {
      hadCake.current = false
      return
    }
    if (!g) return
    if (!hadCake.current) {
      hadCake.current = true
      g.offsetY(0)
      g.y(-PLATE_Y - TIER_H * 3)
      g.to({
        y: 0,
        duration: 0.75,
        easing: bounceOut,
        onFinish: () => squash(g),
      })
      // Crumbs puff out once the cake first touches the plate.
      setTimeout(() => puff(setCrumbs), 260)
    } else {
      // Flavor change: a little wobble so the color change is noticed.
      g.to({ scaleX: 1.025, duration: 0.12, onFinish: () => g.to({ scaleX: 1, duration: 0.2 }) })
    }
  }, [flavor])

  if (!flavor) return null

  return (
    <Group>
      <Group ref={groupRef} x={CX} offsetX={CX} y={0}>
        {Array.from({ length: tiers }, (_, i) => (
          <Tier key={i} index={i} color={color} filling={filling} dropIn={i >= dropFrom}>
            <Frosting index={i} style={style} color={frosting} progress={tierProgress(progress, i, tiers)} isTop={i === tiers - 1} />
          </Tier>
        ))}
        {style && progress < 1 && <Bag progress={progress} tiers={tiers} style={style} color={frosting} />}
      </Group>
      {crumbs.map((c) => (
        <CrumbDot key={c.id} c={c} color={mix(color, '#000000', 0.1)} />
      ))}
    </Group>
  )
}

function squash(g: Konva.Group) {
  // Squash and stretch around the plate so the cake looks like it landed.
  g.offsetY(PLATE_Y)
  g.y(PLATE_Y)
  g.to({
    scaleY: 0.95,
    scaleX: 1.03,
    duration: 0.08,
    onFinish: () =>
      g.to({
        scaleY: 1,
        scaleX: 1,
        duration: 0.22,
        onFinish: () => {
          g.offsetY(0)
          g.y(0)
        },
      }),
  })
}

let crumbId = 0
function puff(set: (c: Crumb[]) => void) {
  const list: Crumb[] = Array.from({ length: 18 }, (_, i) => {
    const side = i % 2 ? 1 : -1
    return {
      id: crumbId++,
      x: CX + side * (150 + Math.random() * 40),
      y: PLATE_Y - 4,
      vx: side * (40 + Math.random() * 90),
      vy: -(60 + Math.random() * 110),
      r: 1.5 + Math.random() * 2.5,
    }
  })
  set(list)
  setTimeout(() => set([]), 900)
}

function CrumbDot({ c, color }: { c: Crumb; color: string }) {
  const ref = useRef<Konva.Circle>(null)
  useEffect(() => {
    const n = ref.current
    if (!n) return
    const anim = n.to({ x: c.x + c.vx * 0.7, y: c.y + c.vy * 0.25 + 30, opacity: 0, duration: 0.8 })
    return () => anim?.destroy?.()
  }, [c])
  return <Circle ref={ref} x={c.x} y={c.y} radius={c.r} fill={color} listening={false} />
}

/** The piping bag follows the dollop currently being piped. */
function Bag({ progress, tiers, style, color }: { progress: number; tiers: number; style: 'swirl' | 'twist'; color: string }) {
  const active = Math.max(0, Math.min(tiers - 1, Math.floor(progress * tiers)))
  const local = tierProgress(progress, active, tiers)
  const pts = dollops(active, style, active === tiers - 1)
  const pipe = Math.max(0, (local - 0.2) / 0.8)
  const d = pts[Math.max(0, Math.min(pts.length - 1, Math.floor(pts.length * pipe)))]
  if (!d) return null
  return <PipingBag x={d.x} y={d.y - 4} color={color} />
}
