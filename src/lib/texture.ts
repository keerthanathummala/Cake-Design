// A small tileable crumb texture, drawn once and reused as a pattern
// so the sponge looks baked instead of flat.

let crumb: HTMLCanvasElement | null = null

export function crumbTexture(): HTMLCanvasElement {
  if (crumb) return crumb
  const size = 128
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  // Seeded random so the texture looks the same on every load.
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 900; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 0.6 + rand() * 2.2
    const light = rand() > 0.5
    ctx.fillStyle = light ? `rgba(255,255,255,${0.25 + rand() * 0.35})` : `rgba(0,0,0,${0.2 + rand() * 0.35})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  crumb = c
  return c
}
