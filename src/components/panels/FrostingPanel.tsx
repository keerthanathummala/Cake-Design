import { useStore, type Finish, type Piping } from '../../store'
import Swatches from '../Swatches'

const CREAM_SWATCHES = ['#fbf6ee', '#f6eee3', '#efe0c8', '#f4d9d6', '#e8b9c0', '#d9e4d3', '#cfdbe6', '#e3d9ec', '#f3e3a8', '#c79a72', '#6b4434', '#2e2a2b']
const PIPE_SWATCHES = ['#fffaf2', '#f6eee3', '#f2c6cf', '#d9879a', '#b7cfb0', '#a9c3dc', '#cdb7e2', '#e8c46a', '#c9a46a', '#8a5a44', '#3b2016', '#1d1d1d']

export const FINISHES: { id: Finish; label: string; hint: string }[] = [
  { id: 'smooth', label: 'Smooth buttercream', hint: 'Scraped smooth, soft sheen' },
  { id: 'fondant', label: 'Fondant', hint: 'Satin-smooth sugar paste' },
  { id: 'seminaked', label: 'Semi-naked', hint: 'Thin scrape, sponge peeks through' },
  { id: 'naked', label: 'Naked', hint: 'Bare sponge and filling' },
  { id: 'palette', label: 'Palette knife', hint: 'Painterly swipes in two colors' },
  { id: 'marble', label: 'Marble', hint: 'Polished stone with veins' },
  { id: 'faultline', label: 'Fault line', hint: 'Broken band of sprinkles, gold edge' },
  { id: 'lace', label: 'Royal icing lace', hint: 'Piped filigree over fondant' },
  { id: 'pressed', label: 'Pressed flowers', hint: 'Edible blooms pressed on the sides' },
  { id: 'bark', label: 'Tree bark', hint: 'Buttercream combed into wood grain' },
  { id: 'comic', label: 'Comic outline', hint: 'Flat colors with black outlines' },
]

export const PIPINGS: { id: Piping; label: string; hint: string }[] = [
  { id: 'none', label: 'None', hint: 'Clean edges' },
  { id: 'swirl', label: 'Swirl', hint: 'Star-tip rosettes around the top' },
  { id: 'twist', label: 'Twist', hint: 'Twisted rope borders' },
  { id: 'shell', label: 'Shell', hint: 'Classic shell borders' },
  { id: 'beads', label: 'Pearl beads', hint: 'Round piped beads' },
  { id: 'ruffle', label: 'Lambeth ruffles', hint: 'Draped swags and over-piping' },
]

export default function FrostingPanel() {
  const s = useStore()
  const usesAccent = s.finish === 'palette' || s.finish === 'marble'

  return (
    <div>
      <h2 className="panel-title">Frosting</h2>
      <p className="panel-hint">The coat covers the whole cake. Piping and drips each take their own color.</p>

      <h3 className="section-label">Icing finish</h3>
      <div className="finish-list">
        {FINISHES.map((f) => (
          <button key={f.id} className={`chip ${s.finish === f.id ? 'on' : ''}`} onClick={() => s.set({ finish: f.id })} aria-pressed={s.finish === f.id} title={f.hint}>
            {f.label}
          </button>
        ))}
      </div>

      {s.finish !== 'naked' && (
        <>
          <h3 className="section-label">Coat color</h3>
          <Swatches colors={CREAM_SWATCHES} value={s.frostingColor} onPick={s.setFrostingColor} />
        </>
      )}
      {usesAccent && (
        <>
          <h3 className="section-label">{s.finish === 'marble' ? 'Vein color' : 'Second color'}</h3>
          <Swatches colors={PIPE_SWATCHES} value={s.accentColor} onPick={s.setAccentColor} />
        </>
      )}

      <h3 className="section-label">Piping</h3>
      <div className="choice-grid two">
        {PIPINGS.map((p) => (
          <button key={p.id} className={`choice compact ${s.piping === p.id ? 'on' : ''}`} onClick={() => s.setPiping(p.id)} aria-pressed={s.piping === p.id}>
            <span>
              {p.label}
              <small>{p.hint}</small>
            </span>
          </button>
        ))}
      </div>
      {s.piping !== 'none' && (
        <>
          <h3 className="section-label">Piping color</h3>
          <Swatches colors={PIPE_SWATCHES} value={s.pipingColor} onPick={s.setPipingColor} />
          <button className="btn small" style={{ marginTop: 10 }} onClick={s.replayPiping}>
            Replay piping
          </button>
        </>
      )}

      <h3 className="section-label">Ganache drip</h3>
      <label className="toggle">
        <input type="checkbox" checked={s.drip} onChange={(e) => s.set({ drip: e.target.checked })} />
        <span>Pour a drip over each tier</span>
      </label>
      {s.drip && (
        <Swatches colors={['#3b2016', '#6b3f2a', '#f4ead8', '#e9a3b5', '#d4a94f', '#1d1d1d']} value={s.dripColor} onPick={(c) => s.set({ dripColor: c })} />
      )}
    </div>
  )
}
