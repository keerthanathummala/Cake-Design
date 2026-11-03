import type { Camera, Scene, WebGLRenderer } from 'three'

/** The live renderer, scene and camera, shared so the download step can render views. */
export const bridge: {
  gl: WebGLRenderer | null
  scene: Scene | null
  camera: Camera | null
  target: [number, number, number]
  controls: { enabled: boolean } | null
} = { gl: null, scene: null, camera: null, target: [0, 1.2, 0], controls: null }
