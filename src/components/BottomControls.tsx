import { useStore } from '../store'

/** Stage zoom and undo/redo, shown at the left of the bottom bar. */
export default function BottomControls() {
  const zoom = useStore((s) => s.zoom)
  const setZoom = useStore((s) => s.setZoom)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)

  return (
    <div className="bottom-controls">
      <div className="zoom" role="group" aria-label="Zoom">
        <button className="icon-btn" onClick={() => setZoom(zoom - 0.1)} aria-label="Zoom out">
          −
        </button>
        <button className="zoom-pct" onClick={() => setZoom(1)} title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button className="icon-btn" onClick={() => setZoom(zoom + 0.1)} aria-label="Zoom in">
          +
        </button>
      </div>
      <button className="btn small" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button className="btn small" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        Redo
      </button>
    </div>
  )
}
