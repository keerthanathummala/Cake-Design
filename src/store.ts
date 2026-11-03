import { create } from 'zustand'

export type Flavor = 'redvelvet' | 'chocolate' | 'vanilla'
export type CakeShape = 'round' | 'square' | 'heart' | 'hexagon'
export type Finish =
  | 'smooth'
  | 'fondant'
  | 'naked'
  | 'seminaked'
  | 'palette'
  | 'marble'
  | 'bark'
  | 'lace'
  | 'faultline'
  | 'pressed'
  | 'comic'
export type Piping = 'none' | 'swirl' | 'twist' | 'shell' | 'beads' | 'ruffle'
export type Base = 'stand' | 'board' | 'gold' | 'bento'
export type Step = 'shape' | 'flavor' | 'style' | 'frosting' | 'decorate' | 'background' | 'download'

export const STEPS: { id: Step; label: string }[] = [
  { id: 'shape', label: 'Shape' },
  { id: 'flavor', label: 'Flavor' },
  { id: 'style', label: 'Style' },
  { id: 'frosting', label: 'Frosting' },
  { id: 'decorate', label: 'Decorate' },
  { id: 'background', label: 'Background' },
  { id: 'download', label: 'Download' },
]

export const FLAVORS: Record<Flavor, { label: string; color: string; filling: string }> = {
  redvelvet: { label: 'Red velvet', color: '#8e1a26', filling: '#f7efe4' },
  chocolate: { label: 'Chocolate', color: '#4a2a1d', filling: '#2a160e' },
  vanilla: { label: 'Vanilla', color: '#eedcb3', filling: '#f2d27a' },
}

export type Topper = {
  id: string
  kind: string
  /** World position on the cake surface. */
  position: [number, number, number]
  /** Surface normal at that point, so the topper sits flush. */
  normal: [number, number, number]
  scale: number
  /** Spin around the surface normal, in degrees. */
  spin: number
  /** Turned upside down (a cut face toward the cake, for example). */
  flip?: boolean
  /** Lean away from the surface normal, in degrees. */
  tilt?: number
  /** Candles: main color, second color and pattern. */
  color?: string
  color2?: string
  pattern?: string
}

/** An image or message printed onto the cake surface. */
export type Decal = {
  id: string
  src: string
  tier: number
  position: [number, number, number]
  normal: [number, number, number]
  size: number
  aspect: number
  spin: number
  isMessage?: boolean
  /** Message text, lettering and color (each message has its own). */
  text?: string
  font?: string
  color?: string
}

export type UserSticker = { id: string; src: string; name: string }

export type Message = { text: string; font: string; color: string }

/** Where an automatically placed decoration goes. */
export type Spot = 'top' | 'ring' | 'center' | 'front' | 'side' | 'ledge'
/** Decorations waiting to be placed once the cake is in the scene. */
export type QueueItem =
  | { kind: 'topper'; topper: string; where: Spot; count: number; scale?: number }
  | { kind: 'decal'; src: string; aspect: number; where: Spot }
  | { kind: 'message'; where: Spot; text?: string; font?: string; color?: string }

/** Frosting choices that can differ from tier to tier. */
export type TierStyle = {
  finish: Finish
  frostingColor: string
  accentColor: string
  piping: Piping
  pipingColor: string
  /** Piping thickness, 1 = standard. */
  pipingSize: number
}
const TIER_KEYS: (keyof TierStyle)[] = ['finish', 'frostingColor', 'accentColor', 'piping', 'pipingColor', 'pipingSize']

export type Design = {
  shape: CakeShape
  tiers: number
  flavor: Flavor | null
  spongeColor: string | null
  finish: Finish
  frostingColor: string
  accentColor: string
  piping: Piping
  pipingColor: string
  pipingSize: number
  /** Per-tier overrides of the frosting, bottom tier first. */
  tierStyles: Partial<TierStyle>[]
  drip: boolean
  dripColor: string
  base: Base
  styleId: string | null
  toppers: Topper[]
  decals: Decal[]
  message: Message
  background: string
}

type State = Design & {
  step: Step
  /** Bumped every time the piping animation should play. */
  pipingRun: number
  selectedId: string | null
  /** A topper or sticker waiting to be placed with a tap on the cake. */
  placing: { kind: 'topper'; topper: string } | { kind: 'decal'; src: string; aspect: number } | null
  dragging: boolean
  autoSpin: boolean
  userStickers: UserSticker[]
  /** The saved cake this design was opened from or last saved as. */
  savedId: string | null
  /** Which tier the frosting step is editing; null = all tiers. */
  frostTier: number | null
  /** Bumped to ask decorations to settle back onto the cake surface. */
  snapRun: number
  /** Placements to make on the next frame; `replace` clears earlier ones first. */
  queue: { items: QueueItem[]; replace: boolean } | null
  recentColors: string[]
  past: Design[]
  future: Design[]

  set: (patch: Partial<Design>, undoKey?: string) => void
  setStep: (s: Step) => void
  setFlavor: (f: Flavor) => void
  setSpongeColor: (c: string) => void
  setFrostingColor: (c: string) => void
  setPipingColor: (c: string) => void
  setAccentColor: (c: string) => void
  setBackground: (c: string) => void
  setPiping: (p: Piping) => void
  replayPiping: () => void
  addRecentColor: (c: string) => void
  addTopper: (t: Omit<Topper, 'id'>) => void
  updateTopper: (id: string, patch: Partial<Topper>, undoKey?: string) => void
  addDecal: (d: Omit<Decal, 'id'>) => void
  updateDecal: (id: string, patch: Partial<Decal>, undoKey?: string) => void
  duplicateSelected: () => void
  removeSelected: () => void
  select: (id: string | null) => void
  setPlacing: (p: State['placing']) => void
  setDragging: (d: boolean) => void
  setAutoSpin: (v: boolean) => void
  addUserSticker: (s: UserSticker) => void
  enqueue: (items: QueueItem[], replace?: boolean) => void
  setFrostTier: (t: number | null) => void
  /** Change the frosting of the tier being edited (or of all tiers). */
  setStyle: (patch: Partial<TierStyle>, undoKey?: string) => void
  sliceSelected: () => void
  loadDesign: (d: Design) => void
  undo: () => void
  redo: () => void
}

export const initialDesign: Design = {
  shape: 'round',
  tiers: 2,
  flavor: null,
  spongeColor: null,
  finish: 'smooth',
  frostingColor: '#f6eee3',
  accentColor: '#c9a46a',
  piping: 'none',
  pipingColor: '#fffaf2',
  pipingSize: 1,
  tierStyles: [],
  drip: false,
  dripColor: '#3b2016',
  base: 'stand',
  styleId: null,
  toppers: [],
  decals: [],
  message: { text: '', font: 'script', color: '#7a4a3a' },
  background: '#ffffff',
}

const DESIGN_KEYS = Object.keys(initialDesign) as (keyof Design)[]

let lastKey = ''
let lastAt = 0
let idCounter = 0
export const newId = () => `i${Date.now().toString(36)}${(idCounter++).toString(36)}`

function snapshot(s: State): Design {
  const out = {} as Record<string, unknown>
  for (const k of DESIGN_KEYS) out[k] = s[k]
  return out as Design
}

export const useStore = create<State>((set, get) => {
  /** Save the design for undo; rapid changes of one kind merge into one step. */
  const remember = (key: string) => {
    const now = Date.now()
    if (key === lastKey && now - lastAt < 700) {
      lastAt = now
      return
    }
    lastKey = key
    lastAt = now
    set((s) => ({ past: [...s.past.slice(-49), snapshot(s)], future: [] }))
  }

  const findAny = (id: string | null) => {
    const s = get()
    return {
      topper: s.toppers.find((t) => t.id === id),
      decal: s.decals.find((d) => d.id === id),
    }
  }

  return {
    ...initialDesign,
    step: 'shape',
    pipingRun: 0,
    selectedId: null,
    placing: null,
    dragging: false,
    autoSpin: false,
    userStickers: [],
    frostTier: null,
    savedId: null,
    snapRun: 0,
    queue: null,
    recentColors: [],
    past: [],
    future: [],

    set: (patch, undoKey = Object.keys(patch).join(',')) => {
      remember(undoKey)
      set(patch)
    },
    setStep: (step) => set({ step, selectedId: step === 'decorate' ? get().selectedId : null, placing: null }),
    setFlavor: (flavor) => {
      remember('flavor')
      set({ flavor, spongeColor: null })
    },
    setSpongeColor: (spongeColor) => {
      remember('sponge')
      set({ spongeColor })
    },
    setFrostingColor: (frostingColor) => get().setStyle({ frostingColor }, 'frostingColor'),
    setPipingColor: (pipingColor) => get().setStyle({ pipingColor }, 'pipingColor'),
    setAccentColor: (accentColor) => get().setStyle({ accentColor }, 'accentColor'),
    setBackground: (background) => {
      remember('background')
      set({ background })
    },
    setPiping: (piping) => {
      get().setStyle({ piping }, 'piping')
      set((s) => ({ pipingRun: s.pipingRun + 1 }))
    },
    setFrostTier: (frostTier) => set({ frostTier }),
    setStyle: (patch, key = Object.keys(patch).join(',')) => {
      remember(key + (get().frostTier ?? 'all'))
      const t = get().frostTier
      if (t === null) {
        // Editing all tiers: the change wins over any per-tier value of the same kind.
        const keys = Object.keys(patch) as (keyof TierStyle)[]
        set((s) => ({
          ...patch,
          tierStyles: s.tierStyles.map((ts) => {
            const copy = { ...(ts ?? {}) }
            keys.forEach((k) => delete copy[k])
            return copy
          }),
        }))
      } else {
        set((s) => {
          // no holes: every tier up to this one gets an entry
          const tierStyles = Array.from({ length: Math.max(s.tierStyles.length, t + 1) }, (_, i) => s.tierStyles[i] ?? {})
          tierStyles[t] = { ...tierStyles[t], ...patch }
          return { tierStyles }
        })
      }
    },
    sliceSelected: () => {
      const s = get()
      const t = s.toppers.find((x) => x.id === s.selectedId)
      const next = t && SLICE_NEXT[t.kind]
      if (!t || !next) return
      remember('slice' + t.id)
      // Lay the pieces side by side across the surface.
      const n = t.normal
      const ref = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
      const ax = [n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]]
      const len = Math.hypot(ax[0], ax[1], ax[2]) || 1
      const gap = 0.09 * t.scale * (next.count > 2 ? 0.8 : 1.3)
      const pieces: Topper[] = Array.from({ length: next.count }, (_, i) => {
        const o = (i - (next.count - 1) / 2) * gap
        return {
          ...t,
          id: newId(),
          kind: next.kind,
          position: [t.position[0] + (ax[0] / len) * o, t.position[1] + (ax[1] / len) * o, t.position[2] + (ax[2] / len) * o] as [number, number, number],
          spin: t.spin + (next.count > 2 ? (i - 1) * 18 : 0),
          flip: false,
        }
      })
      set((st) => ({
        toppers: [...st.toppers.filter((x) => x.id !== t.id), ...pieces],
        selectedId: pieces[0].id,
        snapRun: st.snapRun + 1,
      }))
    },
    loadDesign: (d) => {
      remember('load' + newId())
      set({ ...initialDesign, ...d, selectedId: null, frostTier: null, queue: null, snapRun: get().snapRun + 1 })
    },
    replayPiping: () => set((s) => ({ pipingRun: s.pipingRun + 1 })),
    addRecentColor: (c) => set((s) => ({ recentColors: [c, ...s.recentColors.filter((x) => x !== c)].slice(0, 8) })),
    addTopper: (t) => {
      remember('add' + newId())
      const id = newId()
      set((s) => ({ toppers: [...s.toppers, { ...t, id }], selectedId: id }))
    },
    updateTopper: (id, patch, key = 'topper' + id) => {
      remember(key)
      set((s) => ({ toppers: s.toppers.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
    },
    addDecal: (d) => {
      remember('add' + newId())
      const id = newId()
      set((s) => ({ decals: [...s.decals, { ...d, id }], selectedId: id }))
    },
    updateDecal: (id, patch, key = 'decal' + id) => {
      remember(key)
      set((s) => ({ decals: s.decals.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
    },
    duplicateSelected: () => {
      const { topper, decal } = findAny(get().selectedId)
      remember('dup' + newId())
      const id = newId()
      if (topper) {
        // Nudge the copy sideways along the surface.
        const [x, y, z] = topper.position
        const n = topper.normal
        const off: [number, number, number] = n[1] > 0.7 ? [x + 0.12, y, z + 0.06] : [x, y + 0.1, z]
        set((s) => ({ toppers: [...s.toppers, { ...topper, id, position: off }], selectedId: id, snapRun: s.snapRun + 1 }))
      } else if (decal) {
        const [x, y, z] = decal.position
        set((s) => ({ decals: [...s.decals, { ...decal, id, position: [x + 0.1, y, z] }], selectedId: id, snapRun: s.snapRun + 1 }))
      }
    },
    removeSelected: () => {
      const id = get().selectedId
      if (!id) return
      remember('remove' + id)
      set((s) => ({
        toppers: s.toppers.filter((t) => t.id !== id),
        decals: s.decals.filter((d) => d.id !== id),
        selectedId: null,
      }))
    },
    select: (selectedId) => set({ selectedId }),
    setPlacing: (placing) => set({ placing }),
    setDragging: (dragging) => set({ dragging }),
    setAutoSpin: (autoSpin) => set({ autoSpin }),
    addUserSticker: (u) => set((s) => ({ userStickers: [u, ...s.userStickers] })),
    enqueue: (items, replace = false) => {
      if (!replace) remember('add' + newId())
      set((s) => ({ queue: { items: [...(s.queue?.items ?? []), ...items], replace: replace || !!s.queue?.replace } }))
    },
    undo: () => {
      const { past } = get()
      if (!past.length) return
      lastKey = ''
      const prev = past[past.length - 1]
      set((s) => ({ ...prev, past: past.slice(0, -1), future: [snapshot(s), ...s.future], selectedId: null }))
    },
    redo: () => {
      const { future } = get()
      if (!future.length) return
      lastKey = ''
      const next = future[0]
      set((s) => ({ ...next, future: future.slice(1), past: [...s.past, snapshot(s)], selectedId: null }))
    },
  }
})

/** What slicing a fruit turns it into, and into how many pieces. */
export const SLICE_NEXT: Record<string, { kind: string; count: number; label: string }> = {
  strawberry: { kind: 'strawberry-half', count: 2, label: 'Cut in half' },
  'strawberry-half': { kind: 'strawberry-slice', count: 3, label: 'Slice thinly' },
  cherry: { kind: 'cherry-half', count: 2, label: 'Cut in half' },
  orange: { kind: 'orange-half', count: 2, label: 'Cut in half' },
}

/** The frosting a tier actually gets: its own choices over the cake-wide ones. */
export function tierStyleOf(s: Pick<Design, 'tierStyles' | keyof TierStyle>, tier: number): TierStyle {
  const base = {} as Record<string, unknown>
  for (const k of TIER_KEYS) base[k] = s[k]
  return { ...(base as TierStyle), ...(s.tierStyles[tier] ?? {}) }
}

/** The frosting the frosting step is showing: one tier's, or the cake-wide one. */
export function editedStyle(s: Pick<State, 'tierStyles' | 'frostTier' | keyof TierStyle>): TierStyle {
  return tierStyleOf(s, s.frostTier ?? -1)
}

/** The design part of the state, for saving. */
export function designOf(s: State): Design {
  return snapshot(s)
}

/** The sponge color actually shown: a custom pick wins over the flavor default. */
export const spongeColorOf = (s: Pick<State, 'flavor' | 'spongeColor'>) =>
  s.spongeColor ?? (s.flavor ? FLAVORS[s.flavor].color : '#eedcb3')
