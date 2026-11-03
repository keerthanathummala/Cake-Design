import { FLAVORS, useStore, type Flavor } from '../../store'
import { shade } from '../../lib/color'

export default function FlavorPanel() {
  const flavor = useStore((s) => s.flavor)
  const setFlavor = useStore((s) => s.setFlavor)

  return (
    <div>
      <h2 className="panel-title">Choose your cake</h2>
      <p className="panel-hint">
        {flavor ? 'Switch flavors any time; the cake changes color.' : 'Pick a flavor to drop the cake onto the stand.'}
      </p>
      <div className="choice-grid">
        {(Object.keys(FLAVORS) as Flavor[]).map((f) => {
          const c = FLAVORS[f].color
          return (
            <button key={f} className={`choice ${flavor === f ? 'on' : ''}`} onClick={() => setFlavor(f)} aria-pressed={flavor === f}>
              <span
                className="swatch big"
                style={{
                  background: `linear-gradient(180deg, ${shade(c, 0.15)} 0 42%, ${FLAVORS[f].filling} 42% 56%, ${c} 56% 100%)`,
                }}
              />
              <span>{FLAVORS[f].label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
