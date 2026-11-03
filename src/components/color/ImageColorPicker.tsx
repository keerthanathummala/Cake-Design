import { useRef, useState } from 'react'
import { rgbToHex } from '../../lib/color'

type Props = {
  onChange: (hex: string) => void
  onCommit: (hex: string) => void
}

const W = 240
const LENS = 72

/**
 * Upload a photo, then drag the eyedropper over it. A magnifier shows the pixel
 * under the finger, the cake updates live, and letting go keeps that color.
 */
export default function ImageColorPicker({ onChange, onCommit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lensRef = useRef<HTMLCanvasElement>(null)
  const [hasImage, setHasImage] = useState(false)
  const [height, setHeight] = useState(160)
  const [lens, setLens] = useState<{ x: number; y: number; hex: string } | null>(null)
  const last = useRef<string | null>(null)

  const load = (file: File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const h = Math.round((img.height / img.width) * W)
      setHeight(h)
      setHasImage(true)
      requestAnimationFrame(() => {
        const c = canvasRef.current
        if (!c) return
        const dpr = window.devicePixelRatio || 1
        c.width = W * dpr
        c.height = h * dpr
        c.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, c.width, c.height)
        URL.revokeObjectURL(url)
      })
    }
    img.src = url
  }

  const sample = (e: React.PointerEvent) => {
    const c = canvasRef.current
    const l = lensRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height - 1, e.clientY - rect.top))
    const sx = Math.round((x / rect.width) * c.width)
    const sy = Math.round((y / rect.height) * c.height)
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    const [r, g, b] = ctx.getImageData(sx, sy, 1, 1).data
    const hex = rgbToHex({ r, g, b })
    last.current = hex
    setLens({ x, y, hex })
    onChange(hex)
    if (l) {
      const lc = l.getContext('2d')!
      lc.imageSmoothingEnabled = false
      lc.clearRect(0, 0, l.width, l.height)
      const span = 9
      lc.drawImage(c, sx - span / 2, sy - span / 2, span, span, 0, 0, l.width, l.height)
    }
  }

  return (
    <div className="image-picker">
      <label className="btn small upload-btn">
        {hasImage ? 'Use another image' : 'Upload image to pick a color'}
        <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      </label>
      {hasImage && (
        <div
          className="image-canvas"
          style={{ width: W, height }}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            sample(e)
          }}
          onPointerMove={(e) => e.buttons && sample(e)}
          onPointerUp={() => {
            if (last.current) onCommit(last.current)
            setLens(null)
          }}
        >
          <canvas ref={canvasRef} style={{ width: W, height }} />
          <canvas
            ref={lensRef}
            width={LENS}
            height={LENS}
            className="lens"
            style={{
              display: lens ? 'block' : 'none',
              left: (lens?.x ?? 0) - LENS / 2,
              top: (lens?.y ?? 0) - LENS - 18,
              borderColor: lens?.hex,
            }}
          />
        </div>
      )}
      {hasImage && <p className="panel-hint">Press and drag across the photo, then let go to keep the color.</p>}
    </div>
  )
}
