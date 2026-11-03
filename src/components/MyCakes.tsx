import { useEffect, useState } from 'react'
import { renderView } from '../lib/exportImage'
import { cakeStore, fitDesign, toThumb, type SavedCake, type Store } from '../lib/savedCakes'
import { designOf, newId, useStore } from '../store'

/** Keeps the saved-cakes list live while a view that shows it is open. */
function useSavedCakes() {
  const [store, setStore] = useState<Store | null>(null)
  const [list, setList] = useState<SavedCake[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let unsub: (() => void) | null = null
    let live = true
    cakeStore().then((s) => {
      if (!live) return
      setStore(s)
      unsub = s.watch(
        (l) => {
          setList(l)
          setError('')
        },
        (msg) => setError(msg),
      )
    })
    return () => {
      live = false
      unsub?.()
    }
  }, [])
  return { store, list, error }
}

const when = (t: number) =>
  new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** "Save to My cakes", shown next to the download button. */
export function SaveCake() {
  const { store, list } = useSavedCakes()
  const [name, setName] = useState('')
  const [state, setState] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; msg?: string }>({ kind: 'idle' })
  const current = useStore((s) => s.savedId)

  const save = async (asNew: boolean) => {
    if (!store) return
    setState({ kind: 'saving' })
    try {
      useStore.setState({ selectedId: null })
      const png = renderView('three-quarter', 600)
      const thumb = png ? await toThumb(png) : ''
      const { design, droppedPictures } = fitDesign(designOf(useStore.getState()), thumb)
      const id = !asNew && current ? current : newId()
      const title = name.trim() || list?.find((c) => c.id === id)?.name || `My cake ${(list?.length ?? 0) + 1}`
      await store.save({ id, name: title, savedAt: Date.now(), thumb, design })
      useStore.setState({ savedId: id })
      setName('')
      setState({
        kind: 'saved',
        msg:
          `Saved as “${title}”.` +
          (droppedPictures ? ` ${droppedPictures} uploaded picture${droppedPictures > 1 ? 's were' : ' was'} too big to save with it.` : '') +
          (store.where === 'device' ? ' It is kept in this browser.' : ''),
      })
    } catch (e) {
      const code = (e as { code?: string })?.code
      setState({
        kind: 'error',
        msg: code === 'quota_exceeded' ? 'Your saved cakes are full. Delete one in My cakes, then try again.' : "That didn't save. Please try again.",
      })
    }
  }

  const existing = current && list?.find((c) => c.id === current)
  return (
    <div className="save-cake">
      <h3 className="section-label">Save to My cakes</h3>
      <input className="text-input" placeholder={existing ? existing.name : 'Name this cake'} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
      <div className="row-buttons">
        <button className="btn primary small" disabled={!store || state.kind === 'saving'} onClick={() => save(false)}>
          {state.kind === 'saving' ? 'Saving…' : existing ? 'Save changes' : 'Save cake'}
        </button>
        {existing && (
          <button className="btn small" disabled={state.kind === 'saving'} onClick={() => save(true)}>
            Save as a new cake
          </button>
        )}
      </div>
      {state.msg && <p className={state.kind === 'error' ? 'error-note' : 'panel-hint small'}>{state.msg}</p>}
    </div>
  )
}

/** The "My cakes" button in the top bar and the list it opens. */
export default function MyCakes() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn small my-cakes-btn" onClick={() => setOpen(true)}>
        My cakes
      </button>
      {open && <CakeList onClose={() => setOpen(false)} />}
    </>
  )
}

function CakeList({ onClose }: { onClose: () => void }) {
  const { store, list, error } = useSavedCakes()
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState('')
  const loadDesign = useStore((s) => s.loadDesign)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const open = (c: SavedCake) => {
    loadDesign(c.design)
    useStore.setState({ savedId: c.id })
    onClose()
  }
  const remove = async (id: string) => {
    if (!store) return
    setBusy(id)
    try {
      await store.remove(id)
      if (useStore.getState().savedId === id) useStore.setState({ savedId: null })
    } finally {
      setBusy('')
      setConfirm(null)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="My cakes" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h2 className="panel-title">My cakes</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="panel-hint">
          {store?.where === 'device'
            ? 'Cakes you save are kept in this browser.'
            : 'Cakes you save are stored with your account; only you can see them.'}{' '}
          Save from the Download step.
        </p>
        {error && <p className="error-note">{error}</p>}
        {list === null && !error && <p className="panel-hint">Loading…</p>}
        {list?.length === 0 && <p className="panel-hint">No saved cakes yet.</p>}
        <div className="cake-list">
          {list?.map((c) => (
            <div key={c.id} className="cake-row">
              {c.thumb ? <img src={c.thumb} alt="" /> : <span className="cake-row-img" />}
              <div className="cake-row-text">
                <strong>{c.name}</strong>
                <small>{when(c.savedAt)}</small>
              </div>
              <div className="row-buttons">
                {confirm === c.id ? (
                  <>
                    <button className="btn small danger" disabled={busy === c.id} onClick={() => remove(c.id)}>
                      Delete it
                    </button>
                    <button className="btn small" onClick={() => setConfirm(null)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn small primary" onClick={() => open(c)}>
                      Open
                    </button>
                    <button className="btn small" onClick={() => setConfirm(c.id)} aria-label={`Delete ${c.name}`}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
