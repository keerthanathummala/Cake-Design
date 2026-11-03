import { useStore } from '../store'

/** Undo/redo and the 360° spin toggle, at the left of the bottom bar. */
export default function BottomControls() {
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const autoSpin = useStore((s) => s.autoSpin)
  const setAutoSpin = useStore((s) => s.setAutoSpin)
  const hasCake = useStore((s) => !!s.flavor)

  return (
    <div className="bottom-controls">
      <button className="btn small" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button className="btn small redo" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        Redo
      </button>
      <button className={`btn small spin ${autoSpin ? 'on' : ''}`} onClick={() => setAutoSpin(!autoSpin)} aria-pressed={autoSpin} disabled={!hasCake}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.9 0 3.5 1 4.5 2.4M12.8 1.5v3.6H9.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {autoSpin ? 'Stop spin' : 'Spin 360°'}
      </button>
      <span className="orbit-hint">Drag to turn · scroll to zoom</span>
    </div>
  )
}
