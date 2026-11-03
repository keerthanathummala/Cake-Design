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
