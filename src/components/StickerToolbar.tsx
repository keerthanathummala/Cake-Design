import { useEffect } from 'react'
import { useStore } from '../store'

/** Actions for the selected sticker, plus keyboard shortcuts. */
export default function StickerToolbar() {
  const selectedId = useStore((s) => s.selectedId)
  const step = useStore((s) => s.step)
  const sticker = useStore((s) => s.stickers.find((x) => x.id === s.selectedId))
  const { duplicateSticker, removeSticker, reorderSticker, updateSticker } = useStore.getState()
  const active = step === 'stickers' && sticker

  useEffect(() => {
    if (!active || !selectedId) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return
      const s = useStore.getState().stickers.find((x) => x.id === selectedId)
      if (!s) return
      const step = e.shiftKey ? 10 : 2
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      if (moves[e.key]) {
        e.preventDefault()
        updateSticker(s.id, { x: s.x + moves[e.key][0], y: s.y + moves[e.key][1] })
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeSticker(s.id)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSticker(s.id)
      } else if (e.key === 'Escape') {
        useStore.getState().select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, selectedId, duplicateSticker, removeSticker, updateSticker])

  if (!active || !sticker) return null
  const pct = Math.round(sticker.scale * 100)

  return (
    <div className="sticker-toolbar" role="toolbar" aria-label="Selected sticker">
      <button className="btn small" onClick={() => duplicateSticker(sticker.id)} title="Duplicate (Ctrl+D)">
        Duplicate
      </button>
      <label className="size-control">
        <span>Size</span>
        <button className="icon-btn" onClick={() => updateSticker(sticker.id, { scale: Math.max(0.2, sticker.scale - 0.1) })} aria-label="Smaller">
          −
        </button>
        <input
          type="range"
          min={20}
          max={400}
          value={pct}
          onChange={(e) => updateSticker(sticker.id, { scale: Number(e.target.value) / 100 })}
          aria-label="Sticker size"
        />
        <button className="icon-btn" onClick={() => updateSticker(sticker.id, { scale: Math.min(4, sticker.scale + 0.1) })} aria-label="Bigger">
          +
        </button>
        <span className="pct">{pct}%</span>
      </label>
      <button className="btn small" onClick={() => reorderSticker(sticker.id, 1)} title="Bring forward">
        Forward
      </button>
      <button className="btn small" onClick={() => reorderSticker(sticker.id, -1)} title="Send back">
        Back
      </button>
      <button className="btn small danger" onClick={() => removeSticker(sticker.id)} title="Delete (Del)">
        Delete
      </button>
    </div>
  )
}
