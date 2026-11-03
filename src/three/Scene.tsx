import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitImpl } from 'three/examples/jsm/controls/OrbitControls.js'
import { useStore } from '../store'
import { bridge } from './bridge'
import Cake3D from './Cake3D'
import Decorations from './Decorations'
import { cakeTop } from './layout'
import Stand3D from './Stand3D'

function Bridge() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    bridge.gl = gl
    bridge.scene = scene
    bridge.camera = camera
  }, [gl, scene, camera])
  return null
}

/** Keeps the orbit centered on the cake as it grows or shrinks. */
function Controls() {
  const ref = useRef<OrbitImpl>(null)
  const tiers = useStore((s) => s.tiers)
  const base = useStore((s) => s.base)
  const autoSpin = useStore((s) => s.autoSpin)
  const dragging = useStore((s) => s.dragging)
  const top = cakeTop(tiers, base)
  const goal = new Vector3(0, top * 0.55, 0)
  // When the cake grows or shrinks, ease the camera back so it all fits.
  const fit = useRef(0)
  useEffect(() => {
    fit.current = 60
  }, [tiers, base])
  useFrame(({ camera }) => {
    const c = ref.current
    if (!c) return
    bridge.controls = c
    c.target.lerp(goal, 0.08)
    if (fit.current > 0) {
      fit.current--
      const want = Math.max(5.6, top * 2.5 + 1.6)
      const off = camera.position.clone().sub(c.target)
      off.setLength(off.length() + (want - off.length()) * 0.08)
      camera.position.copy(c.target).add(off)
    }
    bridge.target = [c.target.x, c.target.y, c.target.z]
  })
  return (
    <OrbitControls
      ref={ref as never}
      enablePan={false}
      minDistance={3}
      maxDistance={11}
      maxPolarAngle={1.52}
      autoRotate={autoSpin}
      autoRotateSpeed={2.2}
      enabled={!dragging}
      enableDamping
    />
  )
}

export default function Scene() {
  const background = useStore((s) => s.background)
  const select = useStore((s) => s.select)
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMappingExposure: 0.92 }}
      camera={{ fov: 30, position: [0, 2.7, 6.0], near: 0.1, far: 60 }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={[background]} />
      <hemisphereLight args={['#fff8f0', '#cdbfb3', 0.25]} />
      <directionalLight
        castShadow
        position={[3.5, 7, 4.5]}
        intensity={1.8}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4}
        shadow-camera-bottom={-2}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#ffe9d6" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[0, 5, 2]} scale={[8, 3, 1]} rotation-x={Math.PI / 2.2} />
        <Lightformer intensity={1.2} position={[-5, 2, 1]} scale={[3, 6, 1]} rotation-y={Math.PI / 2} color="#fff1e6" />
        <Lightformer intensity={1.2} position={[5, 2, -1]} scale={[3, 6, 1]} rotation-y={-Math.PI / 2} color="#eef3ff" />
        <Lightformer intensity={0.6} position={[0, 1, -6]} scale={[10, 3, 1]} />
      </Environment>
      <ContactShadows position-y={0.001} opacity={0.42} scale={7} blur={2.6} far={2.5} resolution={1024} />
      <Stand3D />
      <Cake3D />
      <Decorations />
      <Controls />
      <Bridge />
    </Canvas>
  )
}
