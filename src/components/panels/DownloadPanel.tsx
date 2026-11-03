import { useEffect, useState } from 'react'
import { downloadDataUrl, exportPng } from '../../lib/exportImage'
import { useStore } from '../../store'

export default function DownloadPanel() {
  const [preview, setPreview] = useState<string | null>(null)
  const select = useStore((s) => s.select)

  useEffect(() => {
    select(null)
    // Let the deselect and any running animation settle before rendering.
    const t = setTimeout(() => setPreview(exportPng()), 250)
    return () => clearTimeout(t)
  }, [select])

  const download = () => {
    const url = exportPng()
    if (url) downloadDataUrl(url, 'my-cake.png')
  }

  return (
    <div>
      <h2 className="panel-title">Your cake</h2>
      <p className="panel-hint">This is the image you'll get: 1600 px wide, with your background and no editing handles.</p>
      <div className="preview">{preview ? <img src={preview} alt="Preview of your finished cake" /> : <span>Preparing preview…</span>}</div>
      <button className="btn primary wide" onClick={download}>
        Download PNG
      </button>
      <p className="panel-hint small" style={{ marginTop: 10 }}>
        If the download doesn't start, right-click or long-press the preview and save the image.
      </p>
    </div>
  )
}
