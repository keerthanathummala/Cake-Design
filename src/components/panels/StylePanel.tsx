import { useState } from 'react'
import { useStore, type QueueItem, type Spot } from '../../store'

type Aesthetic = 'Vintage' | 'Modern' | 'Minimalist' | 'Rustic'
type Icing = 'Buttercream' | 'Fondant' | 'Ganache drip' | 'Royal icing' | 'Naked'
type Event = 'Wedding' | 'Kids birthday' | 'Milestone' | 'Corporate' | 'Seasonal'

type Design = Parameters<ReturnType<typeof useStore.getState>['set']>[0]

type Preset = {
  id: string
  name: string
  blurb: string
  aesthetic: Aesthetic
  icing: Icing[]
  events: Event[]
  design: Design
  decorations: QueueItem[]
}

const t = (topper: string, where: Spot, count = 1, scale?: number): QueueItem => ({
  kind: 'topper',
  topper,
  where,
  count,
  scale,
})

const PRESETS: Preset[] = [
  // Vintage & traditional
  {
    id: 'lambeth',
    name: 'Lambeth',
    blurb: 'Over-piped swags, ruffles and cherries, the 1950s showstopper.',
    aesthetic: 'Vintage',
    icing: ['Buttercream'],
    events: ['Wedding', 'Milestone'],
    design: { shape: 'heart', tiers: 2, base: 'stand', finish: 'smooth', frostingColor: '#f4d9d6', piping: 'ruffle', pipingColor: '#fffaf2', drip: false },
    decorations: [t('cherry', 'ring', 6), t('pearls', 'center', 1)],
  },
  {
    id: 'marie',
    name: 'Marie Antoinette',
    blurb: 'Pastel tiers, shell borders, sugar roses and pearls on a gold stand.',
    aesthetic: 'Vintage',
    icing: ['Buttercream'],
    events: ['Wedding', 'Milestone'],
    design: { shape: 'round', tiers: 3, base: 'gold', finish: 'smooth', frostingColor: '#cfdbe6', piping: 'shell', pipingColor: '#fffaf2', drip: false },
    decorations: [t('rose', 'center', 1, 1.2), t('rose-white', 'top', 2), t('pearls', 'ledge', 4)],
  },
  {
    id: 'lace',
    name: 'Royal icing lace',
    blurb: 'Fine piped filigree over ivory fondant, finished with pearl beads.',
    aesthetic: 'Vintage',
    icing: ['Royal icing', 'Fondant'],
    events: ['Wedding'],
    design: { shape: 'round', tiers: 3, base: 'stand', finish: 'lace', frostingColor: '#f8f1e6', piping: 'beads', pipingColor: '#fffaf2', drip: false },
    decorations: [t('rose-white', 'center', 1, 1.3), t('babysbreath', 'top', 1)],
  },
  // Modern & abstract
  {
    id: 'palette',
    name: 'Palette knife',
    blurb: 'Painterly swipes of two colors with gold leaf, like an oil painting.',
    aesthetic: 'Modern',
    icing: ['Buttercream'],
    events: ['Milestone', 'Corporate'],
    design: { shape: 'round', tiers: 2, base: 'board', finish: 'palette', frostingColor: '#f4d9d6', accentColor: '#d9879a', piping: 'none', drip: false },
    decorations: [t('goldleaf', 'top', 2), t('rose', 'top', 1)],
  },
  {
    id: 'fault',
    name: 'Fault line',
    blurb: 'A band of sprinkles breaking through the frosting, edged in gold.',
    aesthetic: 'Modern',
    icing: ['Buttercream'],
    events: ['Kids birthday', 'Milestone'],
    design: { shape: 'hexagon', tiers: 2, base: 'stand', finish: 'faultline', frostingColor: '#fbf6ee', piping: 'none', drip: false },
    decorations: [t('macaron', 'top', 2), t('macaron-pistachio', 'top', 1), t('pearls', 'top', 2)],
  },
  {
    id: 'marble',
    name: 'Marble and gold',
    blurb: 'Polished stone veining with gold leaf and dark chocolate shards.',
    aesthetic: 'Modern',
    icing: ['Fondant'],
    events: ['Corporate', 'Wedding'],
    design: { shape: 'square', tiers: 2, base: 'gold', finish: 'marble', frostingColor: '#f6f3ee', accentColor: '#7f7a76', piping: 'none', drip: false },
    decorations: [t('shard', 'top', 3), t('goldleaf', 'top', 3)],
  },
  {
    id: 'drip',
    name: 'Ganache drip',
    blurb: 'Chocolate poured over the edge, piled with berries and sweets.',
    aesthetic: 'Modern',
    icing: ['Ganache drip', 'Buttercream'],
    events: ['Kids birthday', 'Milestone'],
    design: { shape: 'round', tiers: 2, base: 'stand', finish: 'smooth', frostingColor: '#f4d9d6', piping: 'swirl', pipingColor: '#fffaf2', drip: true, dripColor: '#3b2016' },
    decorations: [t('strawberry', 'top', 2), t('macaron', 'top', 2), t('meringue', 'top', 2), t('truffle', 'top', 1)],
  },
  // Minimalist & cute
  {
    id: 'bento',
    name: 'Korean bento',
    blurb: 'A single mini cake in a kraft box, soft pastel with a short note.',
    aesthetic: 'Minimalist',
    icing: ['Buttercream'],
    events: ['Kids birthday', 'Milestone'],
    design: {
      shape: 'round',
      tiers: 1,
      base: 'bento',
      finish: 'smooth',
      frostingColor: '#e3d9ec',
      piping: 'shell',
      pipingColor: '#fffaf2',
      drip: false,
      message: { text: 'you did it!', font: 'hand', color: '#7a4a3a' },
    },
    decorations: [{ kind: 'message', where: 'top' }],
  },
  {
    id: 'comic',
    name: 'Comic book',
    blurb: 'Flat colors with bold black outlines, like a cartoon cake.',
    aesthetic: 'Minimalist',
    icing: ['Buttercream'],
    events: ['Kids birthday'],
    design: { shape: 'round', tiers: 1, base: 'stand', finish: 'comic', frostingColor: '#fbf6ee', piping: 'beads', pipingColor: '#fbf6ee', drip: false },
    decorations: [t('candle', 'ring', 3), t('cherry', 'center', 1)],
  },
  {
    id: 'message',
    name: 'Message cake',
    blurb: 'Clean lines and one big piped message, the words are the design.',
    aesthetic: 'Minimalist',
    icing: ['Buttercream'],
    events: ['Milestone', 'Corporate', 'Kids birthday'],
    design: {
      shape: 'square',
      tiers: 1,
      base: 'board',
      finish: 'smooth',
      frostingColor: '#f3e3a8',
      piping: 'beads',
      pipingColor: '#fffaf2',
      drip: false,
      message: { text: 'Congrats!', font: 'serif', color: '#3b2016' },
    },
    decorations: [{ kind: 'message', where: 'top' }],
  },
  // Rustic & natural
  {
    id: 'seminaked',
    name: 'Semi-naked berries',
    blurb: 'Scraped thin so the sponge shows, with fresh fruit cascading down.',
    aesthetic: 'Rustic',
    icing: ['Naked', 'Buttercream'],
    events: ['Wedding', 'Seasonal'],
    design: { shape: 'round', tiers: 3, base: 'board', finish: 'seminaked', frostingColor: '#fbf6ee', piping: 'none', drip: false },
    decorations: [t('strawberry-half', 'top', 3), t('blueberry', 'top', 4), t('raspberry', 'top', 2), t('mint', 'top', 1), t('strawberry-half', 'ledge', 4), t('blueberry', 'ledge', 4)],
  },
  {
    id: 'botanical',
    name: 'Pressed florals',
    blurb: 'Edible flowers pressed into buttercream, with dried orange.',
    aesthetic: 'Rustic',
    icing: ['Buttercream'],
    events: ['Wedding', 'Seasonal'],
    design: { shape: 'round', tiers: 2, base: 'board', finish: 'pressed', frostingColor: '#fbf6ee', piping: 'none', drip: false },
    decorations: [t('orange', 'top', 2), t('babysbreath', 'top', 1), t('mint', 'top', 1)],
  },
  {
    id: 'bark',
    name: 'Tree bark',
    blurb: 'Chocolate buttercream combed into wood grain, forest berries on top.',
    aesthetic: 'Rustic',
    icing: ['Buttercream'],
    events: ['Seasonal', 'Wedding'],
    design: { shape: 'round', tiers: 2, base: 'board', finish: 'bark', frostingColor: '#6b4434', piping: 'none', drip: false },
    decorations: [t('meringue', 'top', 2), t('raspberry', 'top', 3), t('mint', 'top', 2), t('shard', 'top', 1)],
  },
  {
    id: 'naked',
    name: 'Naked cake',
    blurb: 'No frosting on the sides at all, just sponge, filling and flowers.',
    aesthetic: 'Rustic',
    icing: ['Naked'],
    events: ['Wedding', 'Seasonal'],
    design: { shape: 'round', tiers: 2, base: 'board', finish: 'naked', piping: 'none', drip: false },
    decorations: [t('rose', 'top', 1), t('babysbreath', 'top', 1), t('strawberry', 'top', 2)],
  },
]

const AESTHETICS: Aesthetic[] = ['Vintage', 'Modern', 'Minimalist', 'Rustic']
const ICINGS: Icing[] = ['Buttercream', 'Fondant', 'Ganache drip', 'Royal icing', 'Naked']
const EVENTS: Event[] = ['Wedding', 'Kids birthday', 'Milestone', 'Corporate', 'Seasonal']

/** A tiny drawing of the preset's colors and shape. */
function Swatch({ p }: { p: Preset }) {
  const d = p.design
  const coat = d.finish === 'naked' ? '#e3c89a' : (d.frostingColor ?? '#f6eee3')
  const tiers = d.tiers ?? 2
  const widths = [40, 30, 22]
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true">
      <rect x="4" y="47" width="46" height="3" rx="1.5" fill="#cbbdb2" />
      {Array.from({ length: tiers }, (_, i) => {
        const w = widths[i]
        const y = 47 - (i + 1) * 13
        return (
          <g key={i}>
            <rect x={27 - w / 2} y={y} width={w} height={12.5} rx={d.shape === 'square' ? 1.5 : 4} fill={coat} stroke="rgba(0,0,0,0.12)" />
            {d.accentColor && <path d={`M${27 - w / 2 + 3} ${y + 5}q6 -4 12 0t12 0`} stroke={d.accentColor} strokeWidth="2.2" fill="none" />}
            {d.drip && <path d={`M${27 - w / 2} ${y}h${w}v3q-3 5-5 0t-6 0q-3 7-6 0t-6 0q-3 4-5 0t-6 0v-3z`} fill={d.dripColor ?? '#3b2016'} />}
            {d.piping && d.piping !== 'none' && <rect x={27 - w / 2} y={y - 1.5} width={w} height={2.5} rx={1.2} fill={d.pipingColor ?? '#fff'} stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />}
          </g>
        )
      })}
    </svg>
  )
}

export default function StylePanel() {
  const [aesthetic, setAesthetic] = useState<Aesthetic | null>(null)
  const [icing, setIcing] = useState<Icing | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const styleId = useStore((s) => s.styleId)

  const list = PRESETS.filter((p) => (!aesthetic || p.aesthetic === aesthetic) && (!icing || p.icing.includes(icing)) && (!event || p.events.includes(event)))

  const apply = (p: Preset) => {
    const s = useStore.getState()
    s.set({ ...p.design, styleId: p.id, ...(s.flavor ? {} : { flavor: 'vanilla' as const }) }, 'style')
    useStore.setState((st) => ({ pipingRun: st.pipingRun + 1 }))
    s.enqueue(p.decorations, true)
  }

  const chips = <T extends string>(all: T[], value: T | null, setValue: (v: T | null) => void, label: string) => (
    <div className="filter-row" role="group" aria-label={label}>
      <button className={`chip ${value === null ? 'on' : ''}`} onClick={() => setValue(null)}>
        All
      </button>
      {all.map((v) => (
        <button key={v} className={`chip ${value === v ? 'on' : ''}`} onClick={() => setValue(value === v ? null : v)}>
          {v}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <h2 className="panel-title">Design style</h2>
      <p className="panel-hint">Start from a style, then change anything in the next steps. Your shape, frosting and decorations are replaced.</p>
      <h3 className="section-label">Aesthetic</h3>
      {chips(AESTHETICS, aesthetic, setAesthetic, 'Aesthetic')}
      <h3 className="section-label">Icing</h3>
      {chips(ICINGS, icing, setIcing, 'Icing type')}
      <h3 className="section-label">Event</h3>
      {chips(EVENTS, event, setEvent, 'Event')}

      <div className="style-list">
        {list.map((p) => (
          <button key={p.id} className={`style-card ${styleId === p.id ? 'on' : ''}`} onClick={() => apply(p)} aria-pressed={styleId === p.id}>
            <Swatch p={p} />
            <span>
              <strong>{p.name}</strong>
              <small>{p.blurb}</small>
              <span className="tags">
                {p.aesthetic} · {p.icing[0]}
              </span>
            </span>
          </button>
        ))}
        {list.length === 0 && <p className="panel-hint">No styles match all three filters. Try clearing one.</p>}
      </div>
    </div>
  )
}
