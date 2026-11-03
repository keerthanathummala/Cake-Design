// Built-in sticker art. Each sticker is a small SVG drawn with gradients so it
// sits naturally on the realistic cake. They load as images on the canvas.

export type LibrarySticker = { id: string; name: string; svg: string }
export type StickerGroup = { name: string; items: LibrarySticker[] }

const svg = (body: string, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200"><defs>${defs}</defs>${body}</svg>`

const radial = (id: string, a: string, b: string, cx = '35%', cy = '30%') =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`

const linear = (id: string, stops: [number, string][], x2 = '1', y2 = '0') =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`

const seeds = Array.from({ length: 14 }, (_, i) => {
  const x = 32 + ((i * 37) % 38)
  const y = 38 + ((i * 23) % 40)
  return `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="#f7e27a" transform="rotate(${(i * 40) % 90 - 45} ${x} ${y})"/>`
}).join('')

const STRAWBERRY = svg(
  `<path d="M50 92C26 80 14 56 20 40c6-14 22-16 30-12 8-4 24-2 30 12 6 16-6 40-30 52z" fill="url(#sb)"/>${seeds}
   <path d="M50 30c-8-10-22-10-26-4 8 0 14 4 18 8-8-2-16 2-18 8 8-4 16-4 24-4 8 0 16 0 24 4-2-6-10-10-18-8 4-4 10-8 18-8-4-6-18-6-26 4z" fill="url(#sl)"/>
   <rect x="48" y="10" width="4" height="18" rx="2" fill="#3f7d2a"/>
   <ellipse cx="36" cy="46" rx="6" ry="10" fill="#fff" opacity=".35"/>`,
  radial('sb', '#ff6b6b', '#b3121f') + linear('sl', [[0, '#5fbf3f'], [1, '#2e7d1f']], '0', '1'),
)

const CHERRY = svg(
  `<path d="M42 58C44 36 52 20 70 8M62 60C60 40 64 24 70 8" stroke="#4a7a23" stroke-width="3" fill="none" stroke-linecap="round"/>
   <path d="M70 8c8 2 16 8 18 16-10 2-18-4-18-16z" fill="#5aa832"/>
   <circle cx="38" cy="70" r="20" fill="url(#ch)"/><circle cx="66" cy="72" r="20" fill="url(#ch)"/>
   <ellipse cx="31" cy="62" rx="5" ry="7" fill="#fff" opacity=".5"/><ellipse cx="59" cy="64" rx="5" ry="7" fill="#fff" opacity=".5"/>`,
  radial('ch', '#ff4d5e', '#7a0012'),
)

const BLUEBERRIES = svg(
  [
    [34, 58],
    [62, 54],
    [48, 74],
    [70, 76],
    [28, 80],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="16" fill="url(#bb)"/><path d="M${x - 4} ${y - 12}l4 3 4-3-1 5h-6z" fill="#2a2450" opacity=".8"/><ellipse cx="${x - 6}" cy="${y - 4}" rx="3" ry="5" fill="#fff" opacity=".35"/>`,
    )
    .join(''),
  radial('bb', '#6f78c9', '#22205a'),
)

const LEMON = svg(
  `<circle cx="50" cy="50" r="42" fill="#f2c200"/><circle cx="50" cy="50" r="37" fill="#fff8d6"/>
   ${Array.from({ length: 10 }, (_, i) => {
     const a = (i / 10) * Math.PI * 2
     const b = ((i + 1) / 10) * Math.PI * 2
     const p = (r: number, t: number) => `${50 + Math.cos(t) * r} ${50 + Math.sin(t) * r}`
     return `<path d="M${p(4, (a + b) / 2)}L${p(33, a + 0.06)}A33 33 0 0 1 ${p(33, b - 0.06)}Z" fill="url(#lm)"/>`
   }).join('')}
   <circle cx="50" cy="50" r="4" fill="#fff8d6"/>`,
  radial('lm', '#fff3a0', '#f5cd1c', '50%', '50%'),
)

const KIWI = svg(
  `<ellipse cx="50" cy="50" rx="44" ry="42" fill="#7a5a2e"/><ellipse cx="50" cy="50" rx="40" ry="38" fill="url(#kw)"/>
   <ellipse cx="50" cy="50" rx="12" ry="11" fill="#f4f1c8"/>
   ${Array.from({ length: 18 }, (_, i) => {
     const t = (i / 18) * Math.PI * 2
     return `<ellipse cx="${50 + Math.cos(t) * 18}" cy="${50 + Math.sin(t) * 17}" rx="1.6" ry="3" fill="#1d1a10" transform="rotate(${(t * 180) / Math.PI + 90} ${50 + Math.cos(t) * 18} ${50 + Math.sin(t) * 17})"/>`
   }).join('')}`,
  radial('kw', '#d4ec6a', '#5f9e1e', '50%', '50%'),
)

const petals = (n: number, r: number, rx: number, ry: number, fill: string, rot = 0) =>
  Array.from(
    { length: n },
    (_, i) => `<ellipse cx="50" cy="${50 - r}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${rot + (i * 360) / n} 50 50)"/>`,
  ).join('')

const ROSE = svg(
  `<path d="M14 66c10-14 22-12 28-4-10 4-20 6-28 4zM86 66c-10-14-22-12-28-4 10 4 20 6 28 4z" fill="#4f9a3a"/>
   <circle cx="50" cy="50" r="32" fill="url(#rs)"/>
   <path d="M50 22c16 0 28 12 28 26-8-12-20-14-28-14s-20 2-28 14c0-14 12-26 28-26z" fill="#ff9db4" opacity=".6"/>
   <path d="M30 56c4 12 14 18 20 18s16-6 20-18c-6 6-12 8-20 8s-14-2-20-8z" fill="#b8264f" opacity=".5"/>
   <path d="M50 34c10 0 16 6 16 14-4-4-10-6-16-6s-12 2-16 6c0-8 6-14 16-14zM40 52c2 6 6 10 10 10s8-4 10-10c-3 3-6 4-10 4s-7-1-10-4z" fill="#c2335c" opacity=".7"/>
   <path d="M46 44c4-2 8-2 10 2-2 2-6 4-10 2z" fill="#8f1739"/>`,
  radial('rs', '#ff7a9a', '#c21d4c', '45%', '40%'),
)

const DAISY = svg(
  petals(14, 24, 7, 20, 'url(#dp)') + `<circle cx="50" cy="50" r="13" fill="url(#dc)"/>`,
  radial('dp', '#ffffff', '#e8e2da', '50%', '20%') + radial('dc', '#ffd84d', '#e08a00'),
)

const PINK_FLOWER = svg(
  petals(5, 20, 17, 22, 'url(#pf)') + `<circle cx="50" cy="50" r="10" fill="#ffe27a"/>` + `<circle cx="50" cy="50" r="4" fill="#e7a400"/>`,
  radial('pf', '#ffd1e4', '#f06ea0', '50%', '80%'),
)

const LEAF = svg(
  `<path d="M14 86C14 40 44 14 88 14 88 56 60 86 14 86z" fill="url(#lf)"/><path d="M18 82C40 60 60 40 84 18" stroke="#2c6b21" stroke-width="2.5" fill="none"/>
   <path d="M38 62l-6-16M50 50l-4-18M62 38l-2-14M38 62l16 2M50 50l16 0M62 38l14-2" stroke="#2c6b21" stroke-width="1.5" opacity=".7"/>`,
  linear('lf', [[0, '#9ad45a'], [1, '#3f8d2a']], '1', '1'),
)

const CANDLE = svg(
  `<ellipse cx="50" cy="20" rx="8" ry="14" fill="url(#fl)"/><ellipse cx="50" cy="24" rx="3.5" ry="7" fill="#fff6c8"/>
   <rect x="49" y="30" width="2" height="8" fill="#3a2a20"/>
   <rect x="40" y="36" width="20" height="60" rx="3" fill="url(#cd)"/>
   ${[44, 56, 68, 80].map((y) => `<path d="M40 ${y}l20-8v6l-20 8z" fill="#ff7aa2"/>`).join('')}`,
  radial('fl', '#fff2a8', '#ff8a1c', '50%', '65%') + linear('cd', [[0, '#e9e4f4'], [0.5, '#ffffff'], [1, '#d4cde3']]),
)

const SPARKLER = svg(
  `<rect x="48" y="40" width="4" height="58" fill="#9aa0a8"/>
   ${Array.from({ length: 16 }, (_, i) => {
     const t = (i / 16) * Math.PI * 2
     return `<line x1="50" y1="30" x2="${50 + Math.cos(t) * (18 + (i % 3) * 7)}" y2="${30 + Math.sin(t) * (18 + (i % 3) * 7)}" stroke="${i % 2 ? '#ffd24d' : '#fff7d0'}" stroke-width="2" stroke-linecap="round"/>`
   }).join('')}
   <circle cx="50" cy="30" r="8" fill="#fffbe6"/>`,
)

const NUMBER_CANDLE = svg(
  `<ellipse cx="54" cy="12" rx="5" ry="9" fill="url(#fl)"/><rect x="53" y="18" width="2" height="6" fill="#3a2a20"/>
   <path d="M38 34l18-10h10v72H52V42l-10 6z" fill="url(#nc)" stroke="#c43a6a" stroke-width="2"/>`,
  radial('fl', '#fff2a8', '#ff8a1c', '50%', '65%') + linear('nc', [[0, '#ff8fb5'], [1, '#e0457c']]),
)

const STAR = svg(
  `<path d="M50 6l12 28 30 3-23 20 7 30-26-16-26 16 7-30L8 37l30-3z" fill="url(#st)" stroke="#d19a00" stroke-width="2" stroke-linejoin="round"/>
   <path d="M50 14l8 20 20 2" stroke="#fff6c0" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`,
  radial('st', '#fff2a1', '#f2b200'),
)

const HEART = svg(
  `<path d="M50 88C20 66 8 50 8 34 8 20 20 10 32 10c8 0 14 4 18 10 4-6 10-10 18-10 12 0 24 10 24 24 0 16-12 32-42 54z" fill="url(#ht)"/>
   <ellipse cx="30" cy="30" rx="8" ry="11" fill="#fff" opacity=".4" transform="rotate(-30 30 30)"/>`,
  radial('ht', '#ff7b95', '#c8123c'),
)

const CROWN = svg(
  `<path d="M12 74L8 30l22 18 20-30 20 30 22-18-4 44z" fill="url(#cr)" stroke="#b07d00" stroke-width="2" stroke-linejoin="round"/>
   <rect x="12" y="72" width="76" height="12" rx="3" fill="url(#cr)" stroke="#b07d00" stroke-width="2"/>
   <circle cx="50" cy="60" r="6" fill="#d61f4b"/><circle cx="28" cy="62" r="4" fill="#2d8be0"/><circle cx="72" cy="62" r="4" fill="#2d8be0"/>
   <circle cx="8" cy="30" r="4" fill="#ffe680"/><circle cx="50" cy="18" r="4" fill="#ffe680"/><circle cx="92" cy="30" r="4" fill="#ffe680"/>`,
  linear('cr', [[0, '#ffe37a'], [0.5, '#f4b400'], [1, '#c98f00']], '0', '1'),
)

const BANNER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="400" height="200">
  <line x1="12" y1="10" x2="12" y2="98" stroke="#c9a46a" stroke-width="3"/><line x1="188" y1="10" x2="188" y2="98" stroke="#c9a46a" stroke-width="3"/>
  <path d="M12 14Q100 44 188 14" stroke="#7a5b3a" stroke-width="1.5" fill="none"/>
  ${'HAPPY BDAY'
    .split('')
    .map((ch, i) => {
      if (ch === ' ') return ''
      const x = 20 + i * 17
      const y = 18 + Math.sin((i / 9) * Math.PI) * 15
      const c = ['#f06ea0', '#ffc94d', '#6cc3e8', '#8ed28a'][i % 4]
      return `<path d="M${x} ${y}h15l-7.5 22z" fill="${c}"/><text x="${x + 7.5}" y="${y + 11}" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">${ch}</text>`
    })
    .join('')}
</svg>`

const SPRINKLES = svg(
  Array.from({ length: 26 }, (_, i) => {
    const x = 14 + ((i * 41) % 72)
    const y = 14 + ((i * 29) % 72)
    const c = ['#ff6fa1', '#ffd34d', '#6cc3e8', '#8ed28a', '#b48af2', '#ffffff'][i % 6]
    return `<rect x="${x}" y="${y}" width="12" height="4" rx="2" fill="${c}" stroke="rgba(0,0,0,.12)" stroke-width=".5" transform="rotate(${(i * 67) % 180} ${x + 6} ${y + 2})"/>`
  }).join(''),
)

const PEARLS = svg(
  Array.from({ length: 9 }, (_, i) => {
    const t = (i / 8) * Math.PI
    return `<circle cx="${14 + i * 9}" cy="${40 + Math.sin(t) * 22}" r="7" fill="url(#pl)"/>`
  }).join(''),
  radial('pl', '#ffffff', '#c9c2d6'),
)

const MACARON = svg(
  `<ellipse cx="50" cy="66" rx="36" ry="14" fill="url(#mc)"/><rect x="16" y="46" width="68" height="12" rx="6" fill="#fff4e6"/>
   <path d="M16 52c0-2 4-4 6-2s4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0" stroke="#e7c9a8" stroke-width="2" fill="none"/>
   <ellipse cx="50" cy="40" rx="36" ry="16" fill="url(#mc)"/><ellipse cx="40" cy="34" rx="12" ry="4" fill="#fff" opacity=".35"/>`,
  radial('mc', '#d7f5e6', '#79c7a6'),
)

const CHOC_CURL = svg(
  `<path d="M20 70C10 40 40 20 60 30S80 70 50 66 34 40 54 42" stroke="url(#cc)" stroke-width="12" fill="none" stroke-linecap="round"/>
   <path d="M22 66C16 44 40 26 58 34" stroke="#a5735a" stroke-width="2.5" fill="none" opacity=".6"/>`,
  linear('cc', [[0, '#3d2016'], [0.5, '#6b3d2a'], [1, '#2d150d']], '1', '1'),
)

export const STICKER_GROUPS: StickerGroup[] = [
  {
    name: 'Fruit',
    items: [
      { id: 'strawberry', name: 'Strawberry', svg: STRAWBERRY },
      { id: 'cherry', name: 'Cherries', svg: CHERRY },
      { id: 'blueberries', name: 'Blueberries', svg: BLUEBERRIES },
      { id: 'lemon', name: 'Lemon slice', svg: LEMON },
      { id: 'kiwi', name: 'Kiwi slice', svg: KIWI },
    ],
  },
  {
    name: 'Flowers',
    items: [
      { id: 'rose', name: 'Rose', svg: ROSE },
      { id: 'daisy', name: 'Daisy', svg: DAISY },
      { id: 'blossom', name: 'Blossom', svg: PINK_FLOWER },
      { id: 'leaf', name: 'Leaf', svg: LEAF },
    ],
  },
  {
    name: 'Candles',
    items: [
      { id: 'candle', name: 'Candle', svg: CANDLE },
      { id: 'number1', name: 'Number candle', svg: NUMBER_CANDLE },
      { id: 'sparkler', name: 'Sparkler', svg: SPARKLER },
    ],
  },
  {
    name: 'Toppers',
    items: [
      { id: 'banner', name: 'Happy birthday banner', svg: BANNER },
      { id: 'star', name: 'Star', svg: STAR },
      { id: 'heart', name: 'Heart', svg: HEART },
      { id: 'crown', name: 'Crown', svg: CROWN },
    ],
  },
  {
    name: 'Sweets',
    items: [
      { id: 'sprinkles', name: 'Sprinkles', svg: SPRINKLES },
      { id: 'pearls', name: 'Sugar pearls', svg: PEARLS },
      { id: 'macaron', name: 'Macaron', svg: MACARON },
      { id: 'curl', name: 'Chocolate curl', svg: CHOC_CURL },
    ],
  },
]

export const toDataUrl = (svgText: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
