import { useState } from 'react'
import { addStickerAt, DRAG_MIME } from '../../lib/addSticker'
import { STICKER_GROUPS, toDataUrl } from '../../lib/stickers'
import { newId, useStore } from '../../store'

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']

function Tile({ src, name }: { src: string; name: string }) {
  return (
    <button
      className="sticker-tile"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, src)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => addStickerAt(src)}
      title={`${name}: tap to add, or drag onto the cake`}
      aria-label={`Add ${name}`}
    >
      <img src={src} alt="" draggable={false} />
    </button>
  )
}

export default function StickerPanel() {
  const userStickers = useStore((s) => s.userStickers)
  const addUserSticker = useStore((s) => s.addUserSticker)
  const [error, setError] = useState('')

  const onFiles = (files: FileList | null) => {
    setError('')
    Array.from(files ?? []).forEach((file) => {
      if (!TYPES.includes(file.type)) return setError('Use a PNG, JPG, SVG or WebP image.')
      if (file.size > MAX_BYTES) return setError('That image is over 5 MB.')
      const reader = new FileReader()
      reader.onload = () => {
        const src = String(reader.result)
        addUserSticker({ id: newId(), src, name: file.name })
        addStickerAt(src)
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div>
      <h2 className="panel-title">Sticker collection</h2>
      <p className="panel-hint">Tap a sticker to add it, or drag it onto the cake.</p>
      <label className="btn primary upload-sticker">
        + Upload your own
        <input type="file" accept={TYPES.join(',')} multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </label>
      {error && <p className="error">{error}</p>}
      <p className="panel-hint small">Transparent PNGs look best.</p>

      {userStickers.length > 0 && (
        <>
          <h3 className="section-label">My stickers</h3>
          <div className="sticker-grid">
            {userStickers.map((u) => (
              <Tile key={u.id} src={u.src} name={u.name} />
            ))}
          </div>
        </>
      )}

      {STICKER_GROUPS.map((g) => (
        <div key={g.name}>
          <h3 className="section-label">{g.name}</h3>
          <div className="sticker-grid">
            {g.items.map((s) => (
              <Tile key={s.id} src={toDataUrl(s.svg)} name={s.name} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
