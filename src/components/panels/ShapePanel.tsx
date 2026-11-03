import { useStore, type Base, type CakeShape } from '../../store'

const SHAPES: { id: CakeShape; label: string; path: string }[] = [
  { id: 'round', label: 'Round', path: 'M24 6a18 18 0 1 1 0 36a18 18 0 1 1 0-36z' },
  { id: 'square', label: 'Square', path: 'M9 9h30a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3z' },
  { id: 'heart', label: 'Heart', path: 'M24 41C10 31 5 24 5 16.5 5 10 10 6 15.5 6c3.8 0 6.8 2 8.5 5 1.7-3 4.7-5 8.5-5C38 6 43 10 43 16.5 43 24 38 31 24 41z' },
  { id: 'hexagon', label: 'Hexagon', path: 'M24 5l17 9.8v19.4L24 44 7 34.2V14.8z' },
]

const BASES: { id: Base; label: string; hint: string }[] = [
  { id: 'stand', label: 'Porcelain stand', hint: 'Classic white pedestal' },
  { id: 'gold', label: 'Gold stand', hint: 'Polished metal pedestal' },
  { id: 'board', label: 'Wooden board', hint: 'Rustic, low and wide' },
  { id: 'bento', label: 'Bento box', hint: 'One mini cake in a kraft box' },
]

function TierIcon({ n }: { n: number }) {
  const widths = [40, 30, 20]
  return (
    <svg width="48" height="44" viewBox="0 0 48 44" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={24 - widths[i] / 2} y={36 - (i + 1) * 10} width={widths[i]} height={9} rx={2.5} fill="currentColor" opacity={0.4 + i * 0.2} />
      ))}
      <rect x="4" y="37" width="40" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export default function ShapePanel() {
  const shape = useStore((s) => s.shape)
  const tiers = useStore((s) => s.tiers)
  const base = useStore((s) => s.base)
  const set = useStore((s) => s.set)

  return (
    <div>
      <h2 className="panel-title">Shape and size</h2>
      <p className="panel-hint">Choose the cake's shape, how many tiers, and what it stands on.</p>

      <h3 className="section-label">Shape</h3>
      <div className="tile-grid four">
        {SHAPES.map((s) => (
          <button key={s.id} className={`tile ${shape === s.id ? 'on' : ''}`} onClick={() => set({ shape: s.id })} aria-pressed={shape === s.id}>
            <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
              <path d={s.path} fill="currentColor" opacity="0.75" />
            </svg>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <h3 className="section-label">Tiers</h3>
      <div className="tile-grid three">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            className={`tile ${tiers === n && base !== 'bento' ? 'on' : ''}`}
            onClick={() => set({ tiers: n, base: base === 'bento' ? 'stand' : base })}
            aria-pressed={tiers === n}
          >
            <TierIcon n={n} />
            <span>
              {n} tier{n > 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>

      <h3 className="section-label">Base</h3>
      <div className="choice-grid">
        {BASES.map((b) => (
          <button key={b.id} className={`choice compact ${base === b.id ? 'on' : ''}`} onClick={() => set({ base: b.id, ...(b.id === 'bento' ? { tiers: 1 } : {}) })} aria-pressed={base === b.id}>
            <span>
              {b.label}
              <small>{b.hint}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
