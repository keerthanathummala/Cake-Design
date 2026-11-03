import { STAGE_W } from './geometry'
import { stageRef } from './stageRef'

/** Render the cake (without editor handles) to a PNG data URL, about 1600 px wide. */
export function exportPng(width = STAGE_W * 2): string | null {
  const stage = stageRef.current
  if (!stage) return null
  const tr = stage.findOne('.transformer')
  const wasVisible = tr?.visible()
  tr?.visible(false)
  const url = stage.toDataURL({ mimeType: 'image/png', pixelRatio: width / stage.width() })
  tr?.visible(wasVisible ?? true)
  return url
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
