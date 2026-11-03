import type { Design } from '../store'
import { hostCapability } from './exportImage'

/**
 * "My cakes": saved designs. Inside the Claude viewer they go to the page's
 * database, in a private area only the signed-in person can read. Anywhere
 * else (local development, a static host) they are kept in this browser.
 */

export type SavedCake = { id: string; name: string; savedAt: number; thumb: string; design: Design }

type Unsub = () => void
type DocSnap = { id: string; data(): Record<string, unknown> | undefined }
type Db = {
  collection(path: string): {
    doc(id: string): { set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> }
    orderBy(f: string, dir: 'asc' | 'desc'): { onSnapshot(next: (s: { docs: DocSnap[] }) => void, err: (e: { code: string }) => void): Unsub }
  }
}
type User = { id(): Promise<string | null> }

export type Store = {
  where: 'cloud' | 'device'
  watch(next: (list: SavedCake[]) => void, fail: (msg: string) => void): Unsub
  save(c: SavedCake): Promise<void>
  remove(id: string): Promise<void>
}

/** A document must stay under 256 KiB, so leave headroom. */
export const MAX_BYTES = 230_000

const parse = (id: string, d: Record<string, unknown> | undefined): SavedCake | null => {
  if (!d || typeof d.design !== 'string') return null
  try {
    return { id, name: String(d.name ?? 'My cake'), savedAt: Number(d.savedAt ?? 0), thumb: String(d.thumb ?? ''), design: JSON.parse(d.design) }
  } catch {
    return null
  }
}

function cloudStore(db: Db, uid: string): Store {
  const col = db.collection(`data/users/${uid}`)
  return {
    where: 'cloud',
    watch(next, fail) {
      let got = false
      const timer = setTimeout(() => !got && fail("Your saved cakes can't be reached right now."), 10_000)
      const unsub = col.orderBy('savedAt', 'desc').onSnapshot(
        (snap) => {
          got = true
          clearTimeout(timer)
          next(snap.docs.map((d) => parse(d.id, d.data())).filter((x): x is SavedCake => !!x))
        },
        (e) => {
          clearTimeout(timer)
          fail(e.code === 'revoked' || e.code === 'not_granted' ? 'Saving is turned off for this page.' : "Your saved cakes can't be reached right now.")
        },
      )
      return () => {
        clearTimeout(timer)
        unsub()
      }
    },
    save: (c) => col.doc(c.id).set({ name: c.name, savedAt: c.savedAt, thumb: c.thumb, design: JSON.stringify(c.design) }),
    remove: (id) => col.doc(id).delete(),
  }
}

const KEY = 'cake-studio-saved'
const listeners = new Set<(l: SavedCake[]) => void>()
function readLocal(): SavedCake[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeLocal(list: SavedCake[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  listeners.forEach((l) => l(list))
}
const deviceStore: Store = {
  where: 'device',
  watch(next) {
    listeners.add(next)
    next(readLocal())
    return () => listeners.delete(next)
  },
  async save(c) {
    writeLocal([c, ...readLocal().filter((x) => x.id !== c.id)].sort((a, b) => b.savedAt - a.savedAt))
  },
  async remove(id) {
    writeLocal(readLocal().filter((x) => x.id !== id))
  },
}

let chosen: Promise<Store> | null = null
export function cakeStore(): Promise<Store> {
  return (chosen ??= (async () => {
    const [db, user] = await Promise.all([hostCapability<Db>('db'), hostCapability<User>('user')])
    const uid = user ? await user.id().catch(() => null) : null
    return db && uid ? cloudStore(db, uid) : deviceStore
  })())
}

/** Small JPEG preview from a PNG data URL. */
export function toThumb(png: string, size = 280): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = size
      c.height = Math.round((size * img.naturalHeight) / img.naturalWidth)
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.78))
    }
    img.onerror = () => resolve('')
    img.src = png
  })
}

/**
 * Fit a design into one database document. Large uploaded pictures are the
 * only thing that can push it over; they are left out if needed.
 */
export function fitDesign(design: Design, thumb: string): { design: Design; droppedPictures: number } {
  const size = (d: Design) => JSON.stringify(d).length + thumb.length + 200
  if (size(design) <= MAX_BYTES) return { design, droppedPictures: 0 }
  const pictures = design.decals.filter((d) => !d.isMessage)
  const kept = { ...design, decals: design.decals.filter((d) => d.isMessage) }
  return { design: kept, droppedPictures: pictures.length }
}
