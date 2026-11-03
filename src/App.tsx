import { useEffect } from 'react'
import './App.css'
import CakeStage from './components/CakeStage'
import StepBar from './components/StepBar'
import FlavorPanel from './components/panels/FlavorPanel'
import TierPanel from './components/panels/TierPanel'
import { STEPS, useStore } from './store'

export default function App() {
  const step = useStore((s) => s.step)
  const flavor = useStore((s) => s.flavor)
  const setStep = useStore((s) => s.setStep)
  const idx = STEPS.findIndex((s) => s.id === step)
  const nextLocked = idx === 1 && !flavor

  // Undo / redo shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) useStore.getState().redo()
        else useStore.getState().undo()
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault()
        useStore.getState().redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <img src="./favicon.svg" alt="" width={28} height={28} />
          Cake Studio
        </div>
        <StepBar />
      </header>

      <main className="workspace">
        <aside className="left-panel" aria-label="Options">
          {step === 'tiers' && <TierPanel />}
          {step === 'flavor' && <FlavorPanel />}
        </aside>

        <section className="stage-area">
          <CakeStage />
          <footer className="bottombar">
            <div className="spacer" />
            <button className="btn" disabled={idx === 0} onClick={() => setStep(STEPS[idx - 1].id)}>
              Back
            </button>
            <button
              className="btn primary"
              disabled={idx === STEPS.length - 1 || nextLocked}
              onClick={() => setStep(STEPS[idx + 1].id)}
            >
              Next
            </button>
          </footer>
        </section>
      </main>
    </div>
  )
}
