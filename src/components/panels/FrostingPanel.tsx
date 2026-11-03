import { useStore, type FrostingStyle } from '../../store'
import Swatches from '../Swatches'

const FROSTING_SWATCHES = [
  '#fff4ec', '#fbe7c6', '#f7c6d0', '#f29bb2', '#c8e6d0', '#b9d8f2',
  '#d8c8ef', '#fff0a8', '#6b4030', '#c9874a', '#e4495f', '#3c3c3c',
]

const STYLES: { id: FrostingStyle; label: string; hint: string }[] = [
  { id: 'swirl', label: 'Swirl', hint: 'A spiral piped across the top, with drips' },
  { id: 'twist', label: 'Twist', hint: 'Twisted rosettes around the edge' },
]

function StyleIcon({ id }: { id: FrostingStyle }) {
  return id === 'swirl' ? (
    <svg width="48" height="40" viewBox="0 0 48 40" aria-hidden="true">
      <path d="M24 20c0-3 4-3 4 0s-6 6-9 1 4-11 11-8 6 16-4 18-17-8-13-17" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="48" height="40" viewBox="0 0 48 40" aria-hidden="true">
      {[8, 20, 32, 44].map((x) => (
        <path key={x} d={`M${x - 4} 24c0-5 8-5 8-1s-6 4-6 0 3-5 4-9`} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="translate(-2 2)" />
      ))}
    </svg>
  )
}

export default function FrostingPanel() {
  const color = useStore((s) => s.frostingColor)
  const style = useStore((s) => s.frostingStyle)
  const setColor = useStore((s) => s.setFrostingColor)
  const setStyle = useStore((s) => s.setFrostingStyle)

  return (
    <div>
      <h2 className="panel-title">Buttercream</h2>
      <p className="panel-hint">Pick a color, then a piping style to watch it being applied.</p>
      <h3 className="section-label">Color</h3>
      <Swatches colors={FROSTING_SWATCHES} value={color} onPick={setColor} />
      <h3 className="section-label">Piping style</h3>
      <div className="choice-grid">
        {STYLES.map((s) => (
          <button key={s.id} className={`choice ${style === s.id ? 'on' : ''}`} onClick={() => setStyle(s.id)} aria-pressed={style === s.id}>
            <StyleIcon id={s.id} />
            <span>
              {s.label}
              <small>{s.hint}</small>
            </span>
          </button>
        ))}
      </div>
      {style && <p className="panel-hint" style={{ marginTop: 12 }}>Tap the style again to replay the piping.</p>}
    </div>
  )
}
