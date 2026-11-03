import { useState } from 'react'
import { cssFamily, FONTS } from '../../lib/fonts'
import { useThumbs } from '../../lib/thumbs'
import { CANDLE_PATTERNS, colorChoices, isCandle, TOPPER_GROUPS, TOPPERS } from '../../lib/toppers'
import { newId, SLICE_NEXT, useStore } from '../../store'
import Swatches from '../Swatches'

const MAX_UPLOAD = 5 * 1024 * 1024
const WAX = ['#fbeef2', '#e8738f', '#bfe3f2', '#5aa9e6', '#fff1a8', '#f6c445', '#c8e6c0', '#8fd17e', '#d9c6f2', '#ffffff', '#d4af37', '#2b2b2b']

/** Shrink big photos so they stay quick to draw and small enough to save. */
function downscale(src: string, max = 640): Promise<{ src: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth || 1
      const h = img.naturalHeight || 1
      const k = Math.min(1, max / Math.max(w, h))
      if (k === 1 && src.length < 400_000) return resolve({ src, aspect: w / h })
      const c = document.createElement('canvas')
      c.width = Math.round(w * k)
      c.height = Math.round(h * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      resolve({ src: c.toDataURL('image/png'), aspect: w / h })
    }
    img.onerror = reject
    img.src = src
  })
}

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
  const slice = topper && SLICE_NEXT[topper.kind]
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
        <input type="range" min={0.4} max={3} step={0.02} value={size} onChange={(e) => setSize(+e.target.value)} />
      </label>
      <label className="slider-row">
        <span>Turn</span>
        <input type="range" min={-180} max={180} step={1} value={spin > 180 ? spin - 360 : spin} onChange={(e) => setSpin(+e.target.value)} />
      </label>
      {topper && (
        <label className="slider-row">
          <span>Tilt</span>
          <input
            type="range"
            min={-80}
            max={80}
            step={1}
            value={topper.tilt ?? 0}
            onChange={(e) => s.updateTopper(topper.id, { tilt: +e.target.value }, 'tilt' + topper.id)}
          />
        </label>
      )}
      <div className="row-buttons">
        {topper && (
          <button className="btn small" onClick={() => s.updateTopper(topper.id, { flip: !topper.flip }, 'flip' + topper.id)} aria-pressed={!!topper.flip}>
            {topper.flip ? 'Turn right side up' : 'Flip upside down'}
          </button>
        )}
        {slice && (
          <button className="btn small" onClick={s.sliceSelected}>
            {slice.label}
          </button>
        )}
        <button className="btn small" onClick={s.duplicateSelected}>
          Duplicate
        </button>
        <button className="btn small danger" onClick={s.removeSelected}>
          Delete
        </button>
      </div>
      {topper && isCandle(topper.kind) && (
        <>
          <h3 className="section-label">Candle pattern</h3>
          <div className="finish-list">
            {CANDLE_PATTERNS.map((p) => (
              <button
                key={p.id}
                className={`chip ${(topper.pattern ?? 'stripes') === p.id ? 'on' : ''}`}
                onClick={() => s.updateTopper(topper.id, { pattern: p.id }, 'pattern' + topper.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <h3 className="section-label">Candle color</h3>
          <Swatches colors={WAX} value={topper.color ?? ''} onPick={(c) => s.updateTopper(topper.id, { color: c }, 'wax' + topper.id)} />
          {(topper.pattern ?? 'stripes') !== 'solid' && (
            <>
              <h3 className="section-label">Pattern color</h3>
              <Swatches colors={WAX} value={topper.color2 ?? ''} onPick={(c) => s.updateTopper(topper.id, { color2: c }, 'wax2' + topper.id)} />
            </>
          )}
        </>
      )}
      {topper && colorChoices(topper.kind) && (
        <>
          <h3 className="section-label">Color</h3>
          <Swatches colors={colorChoices(topper.kind)!} value={topper.color ?? ''} onPick={(c) => s.updateTopper(topper.id, { color: c }, 'tcolor' + topper.id)} />
        </>
      )}
      <p className="panel-hint small">Drag it to move it anywhere on the cake, top or sides.</p>
    </div>
  )
}

/** Write as many messages as you like, each with its own lettering. */
function MessageEditor() {
  const s = useStore()
  const selected = s.decals.find((d) => d.id === s.selectedId && d.isMessage)
  const value = selected ? { text: selected.text ?? '', font: selected.font ?? 'script', color: selected.color ?? s.message.color } : s.message
  const change = (patch: Partial<typeof value>) => {
    if (selected) s.updateDecal(selected.id, patch, 'msg' + selected.id + Object.keys(patch)[0])
    else s.set({ message: { ...s.message, ...patch } }, 'msg' + Object.keys(patch)[0])
  }
  const add = (where: 'top' | 'front') => {
    const m = s.message
    s.enqueue([{ kind: 'message', where, text: m.text, font: m.font, color: m.color }])
  }
  const count = s.decals.filter((d) => d.isMessage).length
  return (
    <>
      <h3 className="section-label">Messages{count ? ` (${count} on the cake)` : ''}</h3>
      {selected && <p className="panel-hint small">Editing the selected message. Tap Done above to write a new one.</p>}
      <textarea
        className="message-input"
        rows={2}
        maxLength={40}
        placeholder="Happy birthday, Maya"
        value={value.text}
        onChange={(e) => change({ text: e.target.value })}
        style={{ fontFamily: cssFamily(value.font) }}
      />
      <div className="font-grid" role="radiogroup" aria-label="Lettering">
        {FONTS.map((f) => (
          <button
            key={f.id}
            role="radio"
            aria-checked={value.font === f.id}
            className={`font-card ${value.font === f.id ? 'on' : ''}`}
            style={{ fontFamily: cssFamily(f.id), fontWeight: f.weight }}
            onClick={() => change({ font: f.id })}
            title={f.label}
          >
            {value.text.trim().slice(0, 12) || 'Happy day'}
            <small>{f.label}</small>
          </button>
        ))}
      </div>
      {!selected && (
        <div className="row-buttons">
          <button className="btn small" disabled={!s.message.text.trim()} onClick={() => add('top')}>
            Add on top
          </button>
          <button className="btn small" disabled={!s.message.text.trim()} onClick={() => add('front')}>
            Add on the side
          </button>
        </div>
      )}
      <p className="panel-hint small">Add as many messages as you like; each keeps its own lettering and color (color is on the right).</p>
    </>
  )
}

export default function DecoratePanel() {
  const thumbs = useThumbs()
  const enqueue = useStore((s) => s.enqueue)
  const userStickers = useStore((s) => s.userStickers)
  const addUserSticker = useStore((s) => s.addUserSticker)
  const flavor = useStore((s) => s.flavor)
  const [error, setError] = useState('')

  const upload = (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) return setError('That file is not an image.')
    if (file.size > MAX_UPLOAD) return setError('Images up to 5 MB, please.')
    const reader = new FileReader()
    reader.onload = () =>
      downscale(reader.result as string).then(
        ({ src, aspect }) => {
          addUserSticker({ id: newId(), src, name: file.name })
          enqueue([{ kind: 'decal', src, aspect, where: 'front' }])
        },
        () => setError("That image couldn't be opened."),
      )
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

      <MessageEditor />

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
