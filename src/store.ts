import { create } from 'zustand'

export type Flavor = 'redvelvet' | 'chocolate' | 'vanilla'
export type FrostingStyle = 'swirl' | 'twist'
export type Step = 'tiers' | 'flavor' | 'frosting' | 'stickers' | 'background' | 'download'

export const STEPS: { id: Step; label: string }[] = [
  { id: 'tiers', label: 'Tiers' },
  { id: 'flavor', label: 'Flavor' },
  { id: 'frosting', label: 'Frosting' },
  { id: 'stickers', label: 'Stickers' },
  { id: 'background', label: 'Background' },
  { id: 'download', label: 'Download' },
]

export const FLAVORS: Record<Flavor, { label: string; color: string; filling: string }> = {
  redvelvet: { label: 'Red velvet', color: '#a61e2e', filling: '#fbf3ea' },
  chocolate: { label: 'Chocolate', color: '#5a3424', filling: '#2e1810' },
  vanilla: { label: 'Vanilla', color: '#f6ead2', filling: '#f3d77a' },
}

export type Sticker = {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
}

export type UserSticker = { id: string; src: string; name: string }

/** Everything that undo can restore. */
type Design = {
  tiers: number
  flavor: Flavor | null
  spongeColor: string | null
  frostingColor: string
  frostingStyle: FrostingStyle | null
  stickers: Sticker[]
  background: string
}

type State = Design & {
  step: Step
  /** Bumped every time the piping animation should play. */
  pipingRun: number
  selectedId: string | null
  userStickers: UserSticker[]
  recentColors: string[]
  zoom: number
  past: Design[]
  future: Design[]

  setStep: (s: Step) => void
  setTiers: (n: number) => void
  setFlavor: (f: Flavor) => void
  setSpongeColor: (c: string) => void
  setFrostingColor: (c: string) => void
  setFrostingStyle: (s: FrostingStyle) => void
  setBackground: (c: string) => void
  addRecentColor: (c: string) => void
  addSticker: (s: Omit<Sticker, 'id'>) => void
  updateSticker: (id: string, patch: Partial<Sticker>) => void
  duplicateSticker: (id: string) => void
  removeSticker: (id: string) => void
  reorderSticker: (id: string, dir: 1 | -1) => void
  select: (id: string | null) => void
  addUserSticker: (s: UserSticker) => void
  setZoom: (z: number) => void
  undo: () => void
  redo: () => void
}

const initialDesign: Design = {
  tiers: 2,
  flavor: null,
  spongeColor: null,
  frostingColor: '#fff4ec',
  frostingStyle: null,
  stickers: [],
  background: '#ffffff',
}

let lastSnapshotKey = ''
let lastSnapshotAt = 0
let idCounter = 0
export const newId = () => `s${Date.now().toString(36)}${(idCounter++).toString(36)}`

function snapshot(s: State): Design {
  const { tiers, flavor, spongeColor, frostingColor, frostingStyle, stickers, background } = s
  return { tiers, flavor, spongeColor, frostingColor, frostingStyle, stickers, background }
}

export const useStore = create<State>((set, get) => {
  /**
   * Save the current design for undo before a change. Rapid changes of the same
   * kind (dragging around the color wheel) are merged into one undo step.
   */
  const remember = (key: string) => {
    const now = Date.now()
    if (key === lastSnapshotKey && now - lastSnapshotAt < 600) {
      lastSnapshotAt = now
      return
    }
    lastSnapshotKey = key
    lastSnapshotAt = now
    set((s) => ({ past: [...s.past.slice(-49), snapshot(s)], future: [] }))
  }

  return {
    ...initialDesign,
    step: 'tiers',
    pipingRun: 0,
    selectedId: null,
    userStickers: [],
    recentColors: [],
    zoom: 1,
    past: [],
    future: [],

    setStep: (step) => set({ step, selectedId: step === 'stickers' ? get().selectedId : null }),
    setTiers: (tiers) => {
      if (tiers === get().tiers) return
      remember('tiers')
      set({ tiers })
    },
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
    setFrostingStyle: (frostingStyle) => {
      remember('frostingStyle')
      set((s) => ({ frostingStyle, pipingRun: s.pipingRun + 1 }))
    },
    setBackground: (background) => {
      remember('background')
      set({ background })
    },
    addRecentColor: (c) =>
      set((s) => ({ recentColors: [c, ...s.recentColors.filter((x) => x !== c)].slice(0, 8) })),
    addSticker: (st) => {
      remember('add' + newId())
      const id = newId()
      set((s) => ({ stickers: [...s.stickers, { ...st, id }], selectedId: id }))
    },
    updateSticker: (id, patch) => {
      remember('update' + id)
      set((s) => ({ stickers: s.stickers.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
    },
    duplicateSticker: (id) => {
      const src = get().stickers.find((x) => x.id === id)
      if (!src) return
      remember('dup' + newId())
      const copy = { ...src, id: newId(), x: src.x + 24, y: src.y + 24 }
      set((s) => ({ stickers: [...s.stickers, copy], selectedId: copy.id }))
    },
    removeSticker: (id) => {
      remember('remove' + id)
      set((s) => ({ stickers: s.stickers.filter((x) => x.id !== id), selectedId: null }))
    },
    reorderSticker: (id, dir) => {
      const list = [...get().stickers]
      const i = list.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return
      remember('order' + id)
      ;[list[i], list[j]] = [list[j], list[i]]
      set({ stickers: list })
    },
    select: (selectedId) => set({ selectedId }),
    addUserSticker: (u) => set((s) => ({ userStickers: [u, ...s.userStickers] })),
    setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2.5, zoom)) }),
    undo: () => {
      const { past } = get()
      if (!past.length) return
      lastSnapshotKey = ''
      const prev = past[past.length - 1]
      set((s) => ({ ...prev, past: past.slice(0, -1), future: [snapshot(s), ...s.future], selectedId: null }))
    },
    redo: () => {
      const { future } = get()
      if (!future.length) return
      lastSnapshotKey = ''
      const next = future[0]
      set((s) => ({ ...next, future: future.slice(1), past: [...s.past, snapshot(s)], selectedId: null }))
    },
  }
})

/** The sponge color actually shown: a custom pick wins over the flavor default. */
export const spongeColorOf = (s: Pick<State, 'flavor' | 'spongeColor'>) =>
  s.spongeColor ?? (s.flavor ? FLAVORS[s.flavor].color : '#f6ead2')
