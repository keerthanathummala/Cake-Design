import { useState } from 'react'
import { useThumbs } from '../../lib/thumbs'
import { TOPPER_GROUPS, TOPPERS } from '../../lib/toppers'
import { newId, useStore } from '../../store'

const FONTS = [
  { id: 'script', label: 'Script', family: '"Great Vibes", cursive' },
  { id: 'serif', label: 'Serif', family: '"Playfair Display", Georgia, serif' },
  { id: 'hand', label: 'Handwritten', family: '"Caveat", cursive' },
  { id: 'sans', label: 'Bold', family: 'Arial, sans-serif' },
]

const MAX_UPLOAD = 5 * 1024 * 1024

function SelectedControls() {
  const s = useStore()
  const topper = s.toppers.find((t) => t.id === s.selectedId)
  const decal = s.decals.find((d) => d.id === s.selectedId)
  if (!topper && !decal) return null
  const name = topper ? (TOPPERS.find((t) => t.id === topper.kind)?.label ?? 'Topper') : decal?.isMessage ? 'Message' : 'Picture'
  const size = topper ? topper.scale : (decal?.size ?? 0.5) / 0.5
  const spin = topper ? topper.spin : (decal?.spin ?? 0)
  const setSize = (v: number) =>
    topper ? s.updateTopper(topper.id, { scale: v }, 'size' + topper.id) : decal && s.updateDecal(decal.id, { size: v * 0.5 }, 'size' + decal.id)
  const setSpin = (v: number) =>
    topper ? s.updateTopper(topper.id, { spin: v }, 'spin' + topper.id) : decal && s.updateDecal(decal.id, { spin: v }, 'spin' + decal.id)
  return (
    <div className="selected-card">
      <div className="selected-head">
        <strong>{name}</strong>
        <button className="btn small" onClick={() => s.select(null)}>
          Done
        </button>
      </div>
      <label className="slider-row">
        <span>Size</span>
        <input type="range" min={0.4} max={2.6} step={0.02} value={size} onChange={(e) => setSize(+e.target.value)} />
      </label>
      <label className="slider-row">
        <span>Turn</span>
        <input type="range" min={-180} max={180} step={1} value={spin > 180 ? spin - 360 : spin} onChange={(e) => setSpin(+e.target.value)} />
      </label>
      <div className="row-buttons">
        <button className="btn small" onClick={s.duplicateSelected} disabled={!!decal?.isMessage}>
          Duplicate
        </button>
        <button className="btn small danger" onClick={s.removeSelected}>
          Delete
        </button>
      </div>
      <p className="panel-hint small">Drag it to move it anywhere on the cake, top or sides.</p>
    </div>
  )
}

export default function DecoratePanel() {
  const thumbs = useThumbs()
  const enqueue = useStore((s) => s.enqueue)
  const message = useStore((s) => s.message)
  const set = useStore((s) => s.set)
  const hasMessage = useStore((s) => s.decals.some((d) => d.isMessage))
  const userStickers = useStore((s) => s.userStickers)
  const addUserSticker = useStore((s) => s.addUserSticker)
  const flavor = useStore((s) => s.flavor)
  const [error, setError] = useState('')

  const upload = (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) return setError('That file is not an image.')
    if (file.size > MAX_UPLOAD) return setError('Images up to 5 MB, please.')
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight || 1
        addUserSticker({ id: newId(), src, name: file.name })
        enqueue([{ kind: 'decal', src, aspect, where: 'front' }])
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const addPicture = (src: string) => {
    const img = new Image()
    img.onload = () => enqueue([{ kind: 'decal', src, aspect: img.naturalWidth / img.naturalHeight || 1, where: 'front' }])
    img.src = src
  }

  if (!flavor) {
    return (
      <div>
        <h2 className="panel-title">Decorate</h2>
        <p className="panel-hint">Pick a flavor first so there is a cake to decorate.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="panel-title">Decorate</h2>
      <p className="panel-hint">Tap a decoration to add it, then drag it anywhere on the cake. Turn the cake to reach the sides and back.</p>

      <SelectedControls />

      {TOPPER_GROUPS.map((g) => (
        <section key={g}>
          <h3 className="section-label">{g}</h3>
          <div className="topper-grid">
            {TOPPERS.filter((t) => t.group === g).map((t) => (
              <button key={t.id} className="topper-card" onClick={() => enqueue([{ kind: 'topper', topper: t.id, where: 'top', count: 1 }])} title={`Add ${t.label}`}>
                {thumbs[t.id] ? <img src={thumbs[t.id]} alt="" width={64} height={64} /> : <span className="thumb-wait" />}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <h3 className="section-label">Message</h3>
      <textarea
        className="message-input"
        rows={2}
        maxLength={40}
        placeholder="Happy birthday, Maya"
        value={message.text}
        onChange={(e) => set({ message: { ...message, text: e.target.value } }, 'msgtext')}
      />
      <div className="finish-list" style={{ margin: '8px 0' }}>
        {FONTS.map((f) => (
          <button
            key={f.id}
            className={`chip ${message.font === f.id ? 'on' : ''}`}
            style={{ fontFamily: f.family }}
            onClick={() => set({ message: { ...message, font: f.id } }, 'msgfont')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="row-buttons">
        <button className="btn small" disabled={!message.text.trim()} onClick={() => enqueue([{ kind: 'message', where: 'top' }])}>
          {hasMessage ? 'Move to the top' : 'Write on top'}
        </button>
        <button className="btn small" disabled={!message.text.trim()} onClick={() => enqueue([{ kind: 'message', where: 'front' }])}>
          Write on the side
        </button>
      </div>
      <p className="panel-hint small">Message color is on the right.</p>

      <h3 className="section-label">Your pictures</h3>
      <label className="btn small upload-btn">
        Upload a picture
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      <p className="panel-hint small">Printed onto the frosting like an edible photo. Transparent PNGs look best.</p>
      {error && <p className="error-note">{error}</p>}
      {userStickers.length > 0 && (
        <div className="topper-grid">
          {userStickers.map((u) => (
            <button key={u.id} className="topper-card" onClick={() => addPicture(u.src)} title="Add again">
              <img src={u.src} alt="" width={64} height={64} style={{ objectFit: 'contain' }} />
              <span>{u.name.slice(0, 14)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
