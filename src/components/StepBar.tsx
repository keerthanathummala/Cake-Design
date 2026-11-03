import { STEPS, useStore } from '../store'

export default function StepBar() {
  const step = useStore((s) => s.step)
  const flavor = useStore((s) => s.flavor)
  const setStep = useStore((s) => s.setStep)
  const current = STEPS.findIndex((x) => x.id === step)

  return (
    <nav className="stepbar" aria-label="Steps">
      {STEPS.map((s, i) => {
        // Steps after Flavor need a cake on the stand first.
        const locked = i > 1 && !flavor
        return (
          <button
            key={s.id}
            className={`step ${i === current ? 'on' : ''} ${i < current ? 'done' : ''}`}
            onClick={() => setStep(s.id)}
            disabled={locked}
            aria-current={i === current ? 'step' : undefined}
            title={locked ? 'Choose a flavor first' : s.label}
          >
            <span className="num">{i + 1}</span>
            <span className="label">{s.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
