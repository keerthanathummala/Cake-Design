import { useState } from 'react'
import { FLAVORS, spongeColorOf, useStore } from '../../store'
import ColorWheel from './ColorWheel'
import ImageColorPicker from './ImageColorPicker'

/** Which color the right panel edits on each step. */
function useTarget() {
  const step = useStore((s) => s.step)
  const sponge = useStore(spongeColorOf)
  const flavor = useStore((s) => s.flavor)
  const custom = useStore((s) => s.spongeColor)
  const frosting = useStore((s) => s.frostingColor)
  const background = useStore((s) => s.background)
  const st = useStore.getState()
  if (step === 'flavor' && flavor)
    return {
      label: 'Cake color',
      value: sponge,
      set: st.setSpongeColor,
      reset: custom ? () => useStore.setState({ spongeColor: null }) : undefined,
      resetLabel: `Back to ${FLAVORS[flavor].label}`,
    }
  if (step === 'frosting') return { label: 'Buttercream color', value: frosting, set: st.setFrostingColor }
  if (step === 'background') return { label: 'Background color', value: background, set: st.setBackground }
  return null
}

export default function ColorPanel() {
  const target = useTarget()
  const addRecent = useStore((s) => s.addRecentColor)
  const recent = useStore((s) => s.recentColors)
  const [open, setOpen] = useState(true)

  if (!target) return null

  if (!open)
    return (
      <button className="color-fab" onClick={() => setOpen(true)} aria-label="Open color wheel">
        <span style={{ background: target.value }} />
      </button>
    )

  return (
    <aside className="right-panel" aria-label="Color wheel">
      <div className="panel-head">
        <h2 className="panel-title">{target.label}</h2>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Hide color panel">
          ×
        </button>
      </div>
      <div className="current-color">
        <span className="swatch" style={{ background: target.value }} />
        <input
          className="hex-input"
          value={target.value}
          onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && target.set(e.target.value)}
          aria-label="Hex color"
          spellCheck={false}
        />
        {target.reset && (
          <button className="btn small" onClick={target.reset}>
            {target.resetLabel}
          </button>
        )}
      </div>
      <ColorWheel value={target.value} onChange={target.set} onCommit={addRecent} />
      {recent.length > 0 && (
        <>
          <h3 className="section-label">Recent</h3>
          <div className="swatches">
            {recent.map((c) => (
              <button key={c} className="swatch-btn" style={{ background: c }} onClick={() => target.set(c)} aria-label={`Recent color ${c}`} />
            ))}
          </div>
        </>
      )}
      <h3 className="section-label">Pick from a photo</h3>
      <ImageColorPicker onChange={target.set} onCommit={addRecent} />
    </aside>
  )
}
