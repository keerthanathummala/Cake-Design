import { useEffect, useRef, useState } from 'react'
import { hexToHsv, hsvToHex } from '../../lib/color'

type Props = {
  value: string
  /** Called continuously while dragging. */
  onChange: (hex: string) => void
  /** Called once when the visitor lets go. */
  onCommit: (hex: string) => void
}

const SIZE = 220

/** A hue/saturation wheel with a brightness slider. */
export default function ColorWheel({ value, onChange, onCommit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hsv, setHsv] = useState(() => hexToHsv(value))
  const dragging = useRef(false)
  const latest = useRef(value)

  // Follow outside changes (a swatch click) when not dragging.
  useEffect(() => {
    if (!dragging.current && value.toLowerCase() !== latest.current.toLowerCase()) {
      setHsv(hexToHsv(value))
      latest.current = value
    }
  }, [value])

  // Draw the wheel at the current brightness.
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = SIZE * dpr
    c.height = SIZE * dpr
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(c.width, c.height)
    const r = c.width / 2
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const dx = x - r
        const dy = y - r
        const d = Math.sqrt(dx * dx + dy * dy)
        const i = (y * c.width + x) * 4
        if (d > r) continue
        const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
        const hex = hsvToHex(h, d / r, hsv.v)
        const n = parseInt(hex.slice(1), 16)
        img.data[i] = (n >> 16) & 255
        img.data[i + 1] = (n >> 8) & 255
        img.data[i + 2] = n & 255
        img.data[i + 3] = d > r - 1 ? Math.round((r - d) * 255) : 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [hsv.v])

  const emit = (next: { h: number; s: number; v: number }, commit = false) => {
    setHsv(next)
    const hex = hsvToHex(next.h, next.s, next.v)
    latest.current = hex
    onChange(hex)
    if (commit) onCommit(hex)
  }

  const pick = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const dx = e.clientX - rect.left - rect.width / 2
    const dy = e.clientY - rect.top - rect.height / 2
    const s = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (rect.width / 2))
    const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
    emit({ h, s, v: hsv.v || 1 })
  }

  const markerAngle = (hsv.h * Math.PI) / 180
  const mx = SIZE / 2 + Math.cos(markerAngle) * hsv.s * (SIZE / 2)
  const my = SIZE / 2 + Math.sin(markerAngle) * hsv.s * (SIZE / 2)
  const current = hsvToHex(hsv.h, hsv.s, hsv.v)

  return (
    <div className="wheel">
      <div
        className="wheel-disc"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={(e) => dragging.current && pick(e)}
        onPointerUp={() => {
          dragging.current = false
          onCommit(latest.current)
        }}
        role="slider"
        aria-label="Color wheel"
        aria-valuetext={current}
      >
        <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />
        <span className="wheel-marker" style={{ left: mx, top: my, background: current }} />
      </div>
      <label className="slider-row">
        <span>Brightness</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(hsv.v * 100)}
          style={{ background: `linear-gradient(90deg, #000, ${hsvToHex(hsv.h, hsv.s, 1)})` }}
          onChange={(e) => emit({ ...hsv, v: Number(e.target.value) / 100 })}
          onPointerUp={() => onCommit(latest.current)}
          onKeyUp={() => onCommit(latest.current)}
        />
      </label>
    </div>
  )
}
