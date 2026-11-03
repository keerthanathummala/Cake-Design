import { useEffect, useState } from 'react'
import { downloadDataUrl, renderView, VIEWS, warmDownloads, type ViewId } from '../../lib/exportImage'
import { SaveCake } from '../MyCakes'
import { useStore } from '../../store'

export default function DownloadPanel() {
  const select = useStore((s) => s.select)
  const setAutoSpin = useStore((s) => s.setAutoSpin)
  const [view, setView] = useState<ViewId>('three-quarter')
  const [thumbs, setThumbs] = useState<Partial<Record<ViewId, string>>>({})
  const [note, setNote] = useState('')

  const [fallback, setFallback] = useState<string | null>(null)

  useEffect(() => {
    void warmDownloads()
    select(null)
    setAutoSpin(false)
    // Let the deselect settle, then render a small preview of every view.
    const t = setTimeout(() => {
      const out: Partial<Record<ViewId, string>> = {}
      VIEWS.forEach((v) => {
        out[v.id] = renderView(v.id, 360) ?? undefined
      })
      setThumbs(out)
    }, 350)
    return () => clearTimeout(t)
  }, [select, setAutoSpin])

  const download = async () => {
    const url = renderView(view, 1600)
    if (!url) return
    setNote('')
    setFallback(null)
    try {
      await downloadDataUrl(url, `my-cake-${view}.png`)
    } catch (e) {
      const code = (e as { code?: string })?.code
      if (code === 'declined') return
      setFallback(url)
      setNote(code === 'rate_limited' ? 'A save prompt is already open. Finish that one first.' : "The download couldn't start here. Right-click or long-press the picture below to save it.")
    }
  }

  return (
    <div>
      <h2 className="panel-title">Download</h2>
      <p className="panel-hint">Choose the view to save. You get a 1600 px PNG with your background and no editing handles.</p>
      <div className="view-grid" role="radiogroup" aria-label="View to download">
        {VIEWS.map((v) => (
          <button key={v.id} role="radio" aria-checked={view === v.id} className={`view-card ${view === v.id ? 'on' : ''}`} onClick={() => setView(v.id)}>
            <span className="view-img">{thumbs[v.id] ? <img src={thumbs[v.id]} alt="" /> : null}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>
      <button className="btn primary wide" onClick={download}>
        Download {VIEWS.find((v) => v.id === view)?.label.toLowerCase()} view
      </button>
      {note && <p className="error-note">{note}</p>}
      {fallback && (
        <figure className="fallback-shot">
          <img src={fallback} alt="Your cake, ready to save" />
          <figcaption>Didn't get a file? Right-click or long-press this picture and choose Save image.</figcaption>
        </figure>
      )}
      <SaveCake />
      <p className="panel-hint small" style={{ marginTop: 10 }}>
        Want a different angle? Pick "As you see it", turn the cake on the stage, then download.
      </p>
    </div>
  )
}
