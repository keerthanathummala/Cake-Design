import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { mix, shade } from '../lib/color'

// Procedural textures drawn on canvases, so the page needs no image files.

const cache = new Map<string, CanvasTexture>()

function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, r: () => number) => void, color = true) {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx, rng(key.length * 7919 + 13))
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.anisotropy = 8
  if (color) t.colorSpace = SRGBColorSpace
  cache.set(key, t)
  return t
}

/** Sponge sides: crumb texture with filling layers, v = 0 bottom → 1 top. */
export function spongeTexture(color: string, filling: string): Texture {
  return make(`sponge-${color}-${filling}`, 512, 512, (ctx, r) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, shade(color, 0.08))
    g.addColorStop(1, shade(color, -0.12))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    // crumb: lots of small light and dark pits
    for (let i = 0; i < 9000; i++) {
      const x = r() * 512
      const y = r() * 512
      const rad = 0.6 + r() * 2.4
      ctx.fillStyle = r() > 0.55 ? `rgba(0,0,0,${0.12 + r() * 0.3})` : `rgba(255,240,220,${0.08 + r() * 0.18})`
      ctx.beginPath()
      ctx.ellipse(x, y, rad, rad * (0.6 + r() * 0.6), r() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    // two filling layers with uneven edges (canvas y is flipped: 0 = top)
    for (const center of [512 * 0.36, 512 * 0.68]) {
      ctx.beginPath()
      ctx.moveTo(0, center - 14)
      for (let x = 0; x <= 512; x += 16) ctx.lineTo(x, center - 13 + Math.sin(x * 0.05 + center) * 2.5 + r() * 2)
      for (let x = 512; x >= 0; x -= 16) ctx.lineTo(x, center + 13 + Math.sin(x * 0.04) * 2.5 + r() * 2)
      ctx.closePath()
      const fg = ctx.createLinearGradient(0, center - 14, 0, center + 14)
      fg.addColorStop(0, shade(filling, 0.12))
      fg.addColorStop(0.5, filling)
      fg.addColorStop(1, shade(filling, -0.12))
      ctx.fillStyle = fg
      ctx.fill()
    }
  })
}

/** Top of a bare sponge. */
export function crumbTop(color: string): Texture {
  return make(`crumbtop-${color}`, 512, 512, (ctx, r) => {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 12000; i++) {
      ctx.fillStyle = r() > 0.5 ? `rgba(0,0,0,${0.08 + r() * 0.25})` : `rgba(255,245,230,${0.06 + r() * 0.16})`
      ctx.beginPath()
      ctx.arc(r() * 512, r() * 512, 0.6 + r() * 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

/** Fine grain for buttercream bump maps (grey = flat). */
export function buttercreamBump(strength = 1): Texture {
  return make(`bcbump-${strength}`, 512, 512, (ctx, r) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 512, 512)
    // long horizontal scraper marks plus fine noise
    for (let i = 0; i < 260; i++) {
      const y = r() * 512
      ctx.strokeStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${0.05 * strength})`
      ctx.lineWidth = 1 + r() * 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(170, y + r() * 4 - 2, 340, y + r() * 4 - 2, 512, y)
      ctx.stroke()
    }
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},0,0,${0.06 * strength})`
      ctx.fillRect(r() * 512, r() * 512, 2, 2)
    }
  }, false)
}

/** Painterly palette-knife swipes in the frosting and accent colors. */
export function paletteTexture(base: string, accent: string): { map: Texture; bump: Texture } {
  const strokes = (ctx: CanvasRenderingContext2D, r: () => number, bump: boolean) => {
    ctx.fillStyle = bump ? '#808080' : base
    ctx.fillRect(0, 0, 512, 512)
    const cols = [base, accent, mix(base, accent, 0.5), shade(base, 0.25), shade(accent, -0.15), '#ffffff']
    for (let i = 0; i < 140; i++) {
      const x = r() * 560 - 24
      const y = r() * 560 - 24
      const w = 40 + r() * 90
      const h = 14 + r() * 26
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(-0.5 + r() * 1)
      const g = ctx.createLinearGradient(0, 0, w, 0)
      if (bump) {
        g.addColorStop(0, 'rgba(255,255,255,0.9)')
        g.addColorStop(0.15, 'rgba(160,160,160,0.6)')
        g.addColorStop(1, 'rgba(90,90,90,0.2)')
      } else {
        const c = cols[Math.floor(r() * cols.length)]
        g.addColorStop(0, shade(c, 0.12))
        g.addColorStop(0.2, c)
        g.addColorStop(1, mix(c, base, 0.6))
      }
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(w * 0.5, -h * 0.5, w, h * 0.2)
      ctx.quadraticCurveTo(w * 0.6, h, 0, h)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  }
  return {
    map: make(`palette-${base}-${accent}`, 512, 512, (ctx, r) => strokes(ctx, r, false)),
    bump: make(`palettebump-${base}-${accent}`, 512, 512, (ctx, r) => strokes(ctx, r, true), false),
  }
}

/** Marble / stone: soft base with branching veins in the accent color. */
export function marbleTexture(base: string, vein: string): Texture {
  return make(`marble-${base}-${vein}`, 1024, 1024, (ctx, r) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 1024, 1024)
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.04})`
      ctx.beginPath()
      ctx.ellipse(r() * 1024, r() * 1024, 80 + r() * 200, 40 + r() * 120, r() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    const vein1 = (x: number, y: number, width: number, depth: number) => {
      ctx.strokeStyle = vein
      ctx.globalAlpha = 0.25 + r() * 0.5
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(x, y)
      let a = r() * Math.PI * 2
      for (let s = 0; s < 40; s++) {
        a += (r() - 0.5) * 0.6
        x += Math.cos(a) * 14
        y += Math.sin(a) * 14
        ctx.lineTo(x, y)
        if (depth < 2 && r() < 0.06) {
          ctx.stroke()
          vein1(x, y, width * 0.5, depth + 1)
          ctx.strokeStyle = vein
          ctx.lineWidth = width
          ctx.beginPath()
          ctx.moveTo(x, y)
        }
      }
      ctx.stroke()
    }
    for (let i = 0; i < 9; i++) vein1(r() * 1024, r() * 1024, 1.5 + r() * 3.5, 0)
    ctx.globalAlpha = 1
  })
}

/** Tree bark: vertical grain with knots, as color and bump. */
export function barkTexture(base: string): { map: Texture; bump: Texture } {
  const draw = (ctx: CanvasRenderingContext2D, r: () => number, bump: boolean) => {
    ctx.fillStyle = bump ? '#808080' : base
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 220; i++) {
      const x = r() * 512
      ctx.strokeStyle = bump ? `rgba(${r() > 0.4 ? 0 : 255},${r() > 0.4 ? 0 : 255},${r() > 0.4 ? 0 : 255},0.5)` : r() > 0.5 ? shade(base, -0.25 - r() * 0.2) : shade(base, 0.15)
      ctx.lineWidth = 1 + r() * 4
      ctx.beginPath()
      ctx.moveTo(x, -10)
      let xx = x
      for (let y = 0; y <= 530; y += 20) {
        xx += (r() - 0.5) * 6
        ctx.lineTo(xx, y)
      }
      ctx.stroke()
    }
    for (let i = 0; i < 4; i++) {
      const x = r() * 512
      const y = r() * 512
      for (let k = 0; k < 5; k++) {
        ctx.strokeStyle = bump ? 'rgba(0,0,0,0.6)' : shade(base, -0.35)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(x, y, 6 + k * 5, 14 + k * 9, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }
  return {
    map: make(`bark-${base}`, 512, 512, (ctx, r) => draw(ctx, r, false)),
    bump: make(`barkbump-${base}`, 512, 512, (ctx, r) => draw(ctx, r, true), false),
  }
}

/** Royal icing lace and filigree piped over the base color. */
export function laceTexture(base: string, icing: string): { map: Texture; bump: Texture } {
  const draw = (ctx: CanvasRenderingContext2D, bump: boolean) => {
    ctx.fillStyle = bump ? '#606060' : base
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = bump ? '#ffffff' : icing
    ctx.fillStyle = bump ? '#ffffff' : icing
    ctx.lineCap = 'round'
    // scallops along the top and a repeating medallion pattern
    ctx.lineWidth = 3
    for (let x = 0; x < 512; x += 64) {
      ctx.beginPath()
      ctx.arc(x + 32, 40, 32, 0, Math.PI)
      ctx.stroke()
      for (let k = 0; k < 5; k++) {
        ctx.beginPath()
        ctx.arc(x + 32 + Math.cos(k * 0.6 + 0.4) * 30, 40 + Math.sin(k * 0.6 + 0.4) * 30, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    for (let y = 150; y < 512; y += 180) {
      for (let x = (y / 180) % 2 ? 0 : 64; x < 560; x += 128) {
        ctx.lineWidth = 2.5
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2
          ctx.beginPath()
          ctx.ellipse(x + Math.cos(a) * 18, y + Math.sin(a) * 18, 14, 6, a, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.arc(x, y, 42, 0, Math.PI * 2)
        ctx.stroke()
        for (let p = 0; p < 16; p++) {
          const a = (p / 16) * Math.PI * 2
          ctx.beginPath()
          ctx.arc(x + Math.cos(a) * 48, y + Math.sin(a) * 48, 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }
  return {
    map: make(`lace-${base}-${icing}`, 512, 512, (ctx) => draw(ctx, false)),
    bump: make(`lacebump`, 512, 512, (ctx) => draw(ctx, true), false),
  }
}

/** Semi-naked: scraped frosting that lets sponge show through (white = kept). */
export function scrapeAlpha(): Texture {
  return make('scrape2', 512, 512, (ctx, r) => {
    // Mostly frosted, with thin horizontal scrapes where the sponge peeks through.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#000'
    for (let i = 0; i < 34; i++) {
      const y = 50 + r() * 412
      const x = r() * 512
      const len = 40 + r() * 220
      const h = 2 + r() * 7
      for (const dx of [0, -512, 512]) {
        ctx.beginPath()
        ctx.moveTo(x + dx - len / 2, y)
        for (let k = 0; k <= 12; k++) ctx.lineTo(x + dx - len / 2 + (k / 12) * len, y - h * Math.sin((k / 12) * Math.PI) * (0.6 + r() * 0.6))
        for (let k = 12; k >= 0; k--) ctx.lineTo(x + dx - len / 2 + (k / 12) * len, y + h * Math.sin((k / 12) * Math.PI) * (0.5 + r() * 0.6))
        ctx.fill()
      }
    }
    // the filling lines show through more, like a real scraped cake
    for (const fy of [512 * 0.36, 512 * 0.68]) {
      for (let x = 0; x < 512; x += 6) {
        if (r() < 0.55) ctx.fillRect(x, fy - 3 - r() * 4, 7, 6 + r() * 8)
      }
    }
  }, false)
}

/**
 * Fault line: a band around the middle where the frosting is broken open to
 * show sprinkles, with a ragged gold-leaf edge. Returns color, alpha
 * (white = frosting kept) and metalness (white = gold).
 */
export function faultTextures(base: string, sprinkles: string[]): { map: Texture; alpha: Texture; metal: Texture; band: Texture } {
  const edge = (r: () => number) => {
    const top: number[] = []
    const bot: number[] = []
    for (let x = 0; x <= 512; x += 8) {
      top.push(512 * 0.42 + Math.sin(x * 0.03) * 10 + (r() - 0.5) * 14)
      bot.push(512 * 0.62 + Math.sin(x * 0.025 + 2) * 10 + (r() - 0.5) * 14)
    }
    return { top, bot }
  }
  const pathBand = (ctx: CanvasRenderingContext2D, e: { top: number[]; bot: number[] }, grow: number) => {
    ctx.beginPath()
    e.top.forEach((y, i) => ctx.lineTo(i * 8, y - grow))
    for (let i = e.bot.length - 1; i >= 0; i--) ctx.lineTo(i * 8, e.bot[i] + grow)
    ctx.closePath()
  }
  const map = make(`fault-${base}`, 512, 512, (ctx, r) => {
    const e = edge(r)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#d8b25a'
    pathBand(ctx, e, 9)
    ctx.fill()
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(255,240,190,${r() * 0.6})`
      ctx.fillRect(r() * 512, 512 * 0.38 + r() * 512 * 0.3, 3, 2)
    }
  })
  const alpha = make('faultalpha', 512, 512, (ctx, r) => {
    const e = edge(r)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#000'
    pathBand(ctx, e, 0)
    ctx.fill()
  }, false)
  const metal = make('faultmetal', 512, 512, (ctx, r) => {
    const e = edge(r)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#fff'
    pathBand(ctx, e, 9)
    ctx.fill()
  }, false)
  const band = make(`faultband-${sprinkles.join()}`, 512, 512, (ctx, r) => {
    ctx.fillStyle = '#f4e7d6'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 1800; i++) {
      ctx.save()
      ctx.translate(r() * 512, r() * 512)
      ctx.rotate(r() * Math.PI)
      ctx.fillStyle = sprinkles[Math.floor(r() * sprinkles.length)]
      if (r() > 0.75) {
        ctx.beginPath()
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.roundRect(-7, -2, 14, 4, 2)
        ctx.fill()
      }
      ctx.restore()
    }
  })
  return { map, alpha, metal, band }
}

/** Pressed edible flowers scattered over buttercream. */
export function pressedFlowersTexture(base: string): Texture {
  return make(`pressed-${base}`, 1024, 512, (ctx, r) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 1024, 512)
    const palettes = [
      ['#6b3fa0', '#f4d03f'],
      ['#f2a7c3', '#fff3b0'],
      ['#f6f0e6', '#f2c14e'],
      ['#e8743b', '#7b2d26'],
      ['#3f6fb5', '#f5f5f5'],
    ]
    const flower = (x: number, y: number, s: number) => {
      const [petal, eye] = palettes[Math.floor(r() * palettes.length)]
      const n = 5
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(r() * 6)
      for (let i = 0; i < n; i++) {
        ctx.rotate((Math.PI * 2) / n)
        const g = ctx.createRadialGradient(0, -s * 0.5, 0, 0, -s * 0.5, s * 0.7)
        g.addColorStop(0, shade(petal, 0.25))
        g.addColorStop(1, shade(petal, -0.15))
        ctx.fillStyle = g
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.ellipse(0, -s * 0.5, s * 0.36, s * 0.55, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = shade(petal, -0.3)
        ctx.globalAlpha = 0.35
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, -s * 0.9)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = eye
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    const leaf = (x: number, y: number, s: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(r() * 6)
      ctx.fillStyle = r() > 0.5 ? '#7d9a52' : '#a7b86a'
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.ellipse(0, 0, s * 0.25, s * 0.7, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.globalAlpha = 1
    }
    for (let i = 0; i < 26; i++) leaf(r() * 1024, r() * 512, 26 + r() * 20)
    for (let i = 0; i < 22; i++) flower(r() * 1024, r() * 512, 24 + r() * 26)
  })
}

/** Text drawn for a message plaque or piped writing. */
export function messageTexture(text: string, font: string, color: string): { tex: Texture; aspect: number } {
  const family =
    font === 'script' ? '"Great Vibes", "Brush Script MT", cursive' : font === 'serif' ? '"Playfair Display", Georgia, serif' : font === 'hand' ? '"Caveat", "Comic Sans MS", cursive' : '"Helvetica Neue", Arial, sans-serif'
  const size = 120
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = `${font === 'sans' ? 700 : 400} ${size}px ${family}`
  const lines = text.split('\n').slice(0, 3)
  const w = Math.max(...lines.map((l) => probe.measureText(l).width), 10) + 60
  const h = lines.length * size * 1.15 + 40
  const c = document.createElement('canvas')
  c.width = Math.ceil(w)
  c.height = Math.ceil(h)
  const ctx = c.getContext('2d')!
  ctx.font = probe.font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // A slightly darker outline makes it read like piped icing.
  lines.forEach((l, i) => {
    const y = 20 + size * 1.15 * (i + 0.5)
    ctx.lineWidth = 6
    ctx.strokeStyle = shade(color, -0.25)
    ctx.strokeText(l, c.width / 2, y)
    ctx.fillStyle = color
    ctx.fillText(l, c.width / 2, y)
  })
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return { tex, aspect: c.width / c.height }
}

/** Light grey crumb used under a tint, so sponge color changes are instant. */
export function crumbGray(): Texture {
  return make('crumbgray', 512, 512, (ctx, r) => {
    ctx.fillStyle = '#e9e9e9'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 14000; i++) {
      const dark = r() > 0.5
      ctx.fillStyle = dark ? `rgba(0,0,0,${0.08 + r() * 0.3})` : `rgba(255,255,255,${0.2 + r() * 0.5})`
      ctx.beginPath()
      const rad = 0.5 + r() * 2.4
      ctx.ellipse(r() * 512, r() * 512, rad, rad * (0.5 + r() * 0.7), r() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}
