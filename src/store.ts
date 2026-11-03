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
}

export type UserSticker = { id: string; src: string; name: string }

export type Message = { text: string; font: string; color: string }

type Design = {
  shape: CakeShape
  tiers: number
  flavor: Flavor | null
  spongeColor: string | null
  finish: Finish
  frostingColor: string
  accentColor: string
  piping: Piping
  pipingColor: string
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
    setFrostingColor: (frostingColor) => {
      remember('frostingColor')
      set({ frostingColor })
    },
    setPipingColor: (pipingColor) => {
      remember('pipingColor')
      set({ pipingColor })
    },
    setAccentColor: (accentColor) => {
      remember('accentColor')
      set({ accentColor })
    },
    setBackground: (background) => {
      remember('background')
      set({ background })
    },
    setPiping: (piping) => {
      remember('piping')
      set((s) => ({ piping, pipingRun: s.pipingRun + 1 }))
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
        set((s) => ({ toppers: [...s.toppers, { ...topper, id, position: off }], selectedId: id }))
      } else if (decal) {
        const [x, y, z] = decal.position
        set((s) => ({ decals: [...s.decals, { ...decal, id, position: [x + 0.1, y, z], isMessage: false }], selectedId: id }))
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

/** The sponge color actually shown: a custom pick wins over the flavor default. */
export const spongeColorOf = (s: Pick<State, 'flavor' | 'spongeColor'>) =>
  s.spongeColor ?? (s.flavor ? FLAVORS[s.flavor].color : '#eedcb3')
