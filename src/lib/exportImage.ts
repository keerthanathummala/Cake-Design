import { Spherical, Vector3 } from 'three'
import { bridge } from '../three/bridge'

export type ViewId = 'current' | 'front' | 'three-quarter' | 'left' | 'right' | 'back' | 'top'

export const VIEWS: { id: ViewId; label: string; azimuth?: number; elevation?: number }[] = [
  { id: 'current', label: 'As you see it' },
  { id: 'front', label: 'Front', azimuth: 0, elevation: 14 },
  { id: 'three-quarter', label: 'Three-quarter', azimuth: 40, elevation: 24 },
  { id: 'left', label: 'Left side', azimuth: -90, elevation: 14 },
  { id: 'right', label: 'Right side', azimuth: 90, elevation: 14 },
  { id: 'back', label: 'Back', azimuth: 180, elevation: 14 },
  { id: 'top', label: 'From above', azimuth: 0, elevation: 78 },
]

/**
 * Render the cake from a view to a PNG data URL `width` px wide.
 * Selection rings and other editor helpers are hidden while rendering.
 */
export function renderView(view: ViewId, width = 1600): string | null {
  const { gl, scene, camera } = bridge
  if (!gl || !scene || !camera) return null
  const preset = VIEWS.find((v) => v.id === view)
  const target = new Vector3(...bridge.target)
  const savedPos = camera.position.clone()
  const savedQuat = camera.quaternion.clone()
  const savedRatio = gl.getPixelRatio()
  const helpers: { visible: boolean }[] = []
  scene.traverse((o) => {
    if (o.userData.helper && o.visible) {
      o.visible = false
      helpers.push(o)
    }
  })
  if (preset?.azimuth !== undefined) {
    const dist = savedPos.distanceTo(target)
    const sph = new Spherical(dist, ((90 - (preset.elevation ?? 15)) * Math.PI) / 180, (preset.azimuth * Math.PI) / 180)
    camera.position.copy(new Vector3().setFromSpherical(sph).add(target))
    camera.lookAt(target)
    camera.updateMatrixWorld()
  }
  const cssWidth = gl.domElement.clientWidth || 800
  gl.setPixelRatio(width / cssWidth)
  gl.render(scene, camera)
  const url = gl.domElement.toDataURL('image/png')
  gl.setPixelRatio(savedRatio)
  camera.position.copy(savedPos)
  camera.quaternion.copy(savedQuat)
  camera.updateMatrixWorld()
  helpers.forEach((h) => (h.visible = true))
  gl.render(scene, camera)
  return url
}

type Downloads = { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
type ClaudeHost = { use?: (name: string) => Promise<unknown> }

/**
 * Save a data URL as a file. Inside the Claude artifact viewer, plain download
 * links are blocked, so the viewer's own save prompt is used there instead.
 */
export async function downloadDataUrl(url: string, filename: string): Promise<void> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude
  if (host?.use) {
    const downloads = (await host.use('downloads').catch(() => null)) as Downloads | null
    if (downloads) {
      const blob = await (await fetch(url)).blob()
      await downloads.save({ filename, data: blob })
      return
    }
  }
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
