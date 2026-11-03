import { useMemo } from 'react'
import { CanvasTexture, LatheGeometry, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'
import { useStore } from '../store'
import { BASE_TOP } from './layout'

/** Profile of a pedestal cake stand, from the center of the plate outwards and down. */
const standProfile = [
  [0, 0.62], [1.32, 0.62], [1.36, 0.6], [1.37, 0.575], [1.33, 0.56], [0.9, 0.55], [0.3, 0.52],
  [0.16, 0.48], [0.12, 0.4], [0.11, 0.2], [0.14, 0.12], [0.42, 0.05], [0.5, 0.02], [0.5, 0], [0, 0],
].map(([x, y]) => new Vector2(x, y)).reverse()

function woodTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#b07c4f'
  ctx.fillRect(0, 0, 512, 512)
  for (let r = 4; r < 380; r += 5 + Math.random() * 7) {
    ctx.strokeStyle = `rgba(${90 + Math.random() * 30},${55 + Math.random() * 20},30,${0.25 + Math.random() * 0.3})`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.ellipse(256, 256, r, r * (0.96 + Math.random() * 0.06), Math.random(), 0, Math.PI * 2)
    ctx.stroke()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

function Pedestal({ gold }: { gold: boolean }) {
  const geo = useMemo(() => new LatheGeometry(standProfile, 96), [])
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      {gold ? (
        <meshPhysicalMaterial color="#d4a94f" metalness={1} roughness={0.22} />
      ) : (
        <meshPhysicalMaterial color="#f7f4f0" roughness={0.18} clearcoat={0.8} clearcoatRoughness={0.12} />
      )}
    </mesh>
  )
}

function Board() {
  const tex = useMemo(woodTexture, [])
  return (
    <mesh position-y={BASE_TOP.board / 2} castShadow receiveShadow>
      <cylinderGeometry args={[1.45, 1.47, BASE_TOP.board, 96]} />
      <meshStandardMaterial map={tex} roughness={0.7} />
    </mesh>
  )
}

/** A kraft-paper clamshell box for a bento cake, lid open behind it. */
function BentoBox() {
  const kraft = '#c9a27a'
  const s = 1.7
  const h = 0.42
  const wall = 0.02
  return (
    <group>
      <mesh position-y={0.01} receiveShadow castShadow>
        <boxGeometry args={[s, 0.02, s]} />
        <meshStandardMaterial color={kraft} roughness={0.9} />
      </mesh>
      {[
        [0, h / 2, s / 2, s, wall],
        [0, h / 2, -s / 2, s, wall],
        [s / 2, h / 2, 0, wall, s],
        [-s / 2, h / 2, 0, wall, s],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={kraft} roughness={0.9} />
        </mesh>
      ))}
      {/* lid, hinged at the back and folded open */}
      <group position={[0, h, -s / 2]} rotation-x={-1.95}>
        <mesh position={[0, 0.01, s / 2]} castShadow>
          <boxGeometry args={[s, 0.02, s]} />
          <meshStandardMaterial color={kraft} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.09, s - 0.01]} castShadow>
          <boxGeometry args={[s, 0.18, 0.02]} />
          <meshStandardMaterial color={kraft} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

export default function Stand3D() {
  const base = useStore((s) => s.base)
  if (base === 'board') return <Board />
  if (base === 'bento') return <BentoBox />
  return <Pedestal gold={base === 'gold'} />
}
