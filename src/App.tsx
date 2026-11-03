import { useEffect } from 'react'
import './App.css'
import StepBar from './components/StepBar'
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
          <h2 className="panel-title">{STEPS[idx].label}</h2>
        </aside>

        <section className="stage-area">
          <div className="stage-wrap" />
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
