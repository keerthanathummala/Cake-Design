import { useStore } from '../../store'

function TierIcon({ n }: { n: number }) {
  const widths = [52, 40, 28]
  return (
    <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <rect
          key={i}
          x={32 - widths[i] / 2}
          y={44 - (i + 1) * 13}
          width={widths[i]}
          height={12}
          rx={3}
          fill="currentColor"
          opacity={0.35 + i * 0.2}
        />
      ))}
      <rect x="4" y="45" width="56" height="4" rx="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export default function TierPanel() {
  const tiers = useStore((s) => s.tiers)
  const setTiers = useStore((s) => s.setTiers)

  return (
    <div>
      <h2 className="panel-title">How many tiers?</h2>
      <p className="panel-hint">Pick the height of your cake. You can change this later.</p>
      <div className="choice-grid">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            className={`choice ${tiers === n ? 'on' : ''}`}
            onClick={() => setTiers(n)}
            aria-pressed={tiers === n}
          >
            <TierIcon n={n} />
            <span>
              {n} tier{n > 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
