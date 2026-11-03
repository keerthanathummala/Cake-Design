import { useState } from 'react'
import { FLAVORS, spongeColorOf, useStore } from '../../store'
import ColorWheel from './ColorWheel'
import ImageColorPicker from './ImageColorPicker'

type Target = { id: string; label: string; value: string; set: (c: string) => void; reset?: () => void; resetLabel?: string }

/** The colors the right panel can edit on the current step. */
function useTargets(): Target[] {
  const s = useStore()
  const sponge = spongeColorOf(s)
  if (s.step === 'flavor' && s.flavor)
    return [
      {
        id: 'sponge',
        label: 'Cake',
        value: sponge,
        set: s.setSpongeColor,
        reset: s.spongeColor ? () => useStore.setState({ spongeColor: null }) : undefined,
        resetLabel: `Back to ${FLAVORS[s.flavor].label}`,
      },
    ]
  if (s.step === 'frosting' || s.step === 'style') {
    const out: Target[] = []
    if (s.finish !== 'naked') out.push({ id: 'coat', label: 'Coat', value: s.frostingColor, set: s.setFrostingColor })
    if (s.piping !== 'none' || s.finish === 'lace') out.push({ id: 'piping', label: 'Piping', value: s.pipingColor, set: s.setPipingColor })
    if (s.finish === 'palette' || s.finish === 'marble') out.push({ id: 'accent', label: s.finish === 'marble' ? 'Veins' : 'Second', value: s.accentColor, set: s.setAccentColor })
    if (s.drip) out.push({ id: 'drip', label: 'Drip', value: s.dripColor, set: (c) => s.set({ dripColor: c }, 'drip') })
    return out
  }
  if (s.step === 'decorate' && s.message.text)
    return [{ id: 'message', label: 'Message', value: s.message.color, set: (c) => s.set({ message: { ...s.message, color: c } }, 'msgcolor') }]
  if (s.step === 'background') return [{ id: 'bg', label: 'Background', value: s.background, set: s.setBackground }]
  return []
}

export default function ColorPanel() {
  const targets = useTargets()
  const addRecent = useStore((s) => s.addRecentColor)
  const recent = useStore((s) => s.recentColors)
  // Start closed on phones so the cake keeps most of the screen.
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820)
  const [pick, setPick] = useState<string | null>(null)

  if (!targets.length) return null
  const target = targets.find((t) => t.id === pick) ?? targets[0]

  if (!open)
    return (
      <button className="color-fab" onClick={() => setOpen(true)} aria-label="Open color wheel">
        <span style={{ background: target.value }} />
      </button>
    )

  return (
    <aside className="right-panel" aria-label="Color wheel">
      <div className="panel-head">
        <h2 className="panel-title">Color</h2>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Hide color panel">
          ×
        </button>
      </div>
      {targets.length > 1 && (
        <div className="seg" role="tablist" aria-label="What to color">
          {targets.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === target.id} className={t.id === target.id ? 'on' : ''} onClick={() => setPick(t.id)}>
              <span className="dot" style={{ background: t.value }} />
              {t.label}
            </button>
          ))}
        </div>
      )}
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
      <ColorWheel key={target.id} value={target.value} onChange={target.set} onCommit={addRecent} />
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
