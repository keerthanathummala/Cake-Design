import { Color, DataTexture, MeshPhysicalMaterial, MeshToonMaterial, NearestFilter, RedFormat, type Material } from 'three'
import type { Finish } from '../store'
import {
  barkTexture,
  buttercreamBump,
  faultTextures,
  laceTexture,
  marbleTexture,
  paletteTexture,
  pressedFlowersTexture,
  scrapeAlpha,
} from './textures'

let toonRamp: DataTexture | null = null
export function toonGradient() {
  if (toonRamp) return toonRamp
  toonRamp = new DataTexture(new Uint8Array([90, 170, 255]), 3, 1, RedFormat)
  toonRamp.minFilter = toonRamp.magFilter = NearestFilter
  toonRamp.needsUpdate = true
  return toonRamp
}

export type FrostingColors = { frosting: string; accent: string; piping: string }

export const SPRINKLES = ['#f06e9a', '#ffd34d', '#5fc0e6', '#8fd17e', '#b48af2', '#ffffff']

/**
 * Materials for the frosting coat: [sides, top]. Plain finishes are tinted by
 * `color` so color changes ease in; patterned finishes bake colors into a map.
 */
export function frostingMaterials(finish: Finish, c: FrostingColors): [Material, Material] {
  const base = new Color(c.frosting)
  if (finish === 'comic') {
    const m = new MeshToonMaterial({ color: base, gradientMap: toonGradient() })
    return [m, m]
  }
  const cream = () =>
    new MeshPhysicalMaterial({
      color: base,
      roughness: 0.52,
      bumpMap: buttercreamBump(),
      bumpScale: 0.22,
      sheen: 0.35,
      sheenRoughness: 0.6,
      sheenColor: new Color('#ffffff'),
    })
  switch (finish) {
    case 'fondant': {
      const m = new MeshPhysicalMaterial({ color: base, roughness: 0.38, clearcoat: 0.15, clearcoatRoughness: 0.5, sheen: 0.2 })
      return [m, m]
    }
    case 'seminaked': {
      const wall = cream()
      wall.alphaMap = scrapeAlpha()
      wall.alphaTest = 0.45
      return [wall, cream()]
    }
    case 'palette': {
      const t = paletteTexture(c.frosting, c.accent)
      const m = new MeshPhysicalMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 2.2, roughness: 0.48, sheen: 0.3 })
      return [m, m]
    }
    case 'marble': {
      const m = new MeshPhysicalMaterial({ map: marbleTexture(c.frosting, c.accent), roughness: 0.22, clearcoat: 0.35, clearcoatRoughness: 0.3 })
      return [m, m]
    }
    case 'bark': {
      const t = barkTexture(c.frosting)
      const m = new MeshPhysicalMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 3, roughness: 0.75 })
      return [m, cream()]
    }
    case 'lace': {
      const t = laceTexture(c.frosting, c.piping)
      const m = new MeshPhysicalMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.6, roughness: 0.42, sheen: 0.25 })
      return [m, new MeshPhysicalMaterial({ color: base, roughness: 0.4 })]
    }
    case 'faultline': {
      const t = faultTextures(c.frosting, SPRINKLES)
      const wall = new MeshPhysicalMaterial({
        map: t.map,
        alphaMap: t.alpha,
        alphaTest: 0.5,
        metalnessMap: t.metal,
        metalness: 1,
        roughness: 0.35,
        bumpMap: buttercreamBump(),
        bumpScale: 0.5,
      })
      return [wall, cream()]
    }
    case 'pressed': {
      const m = new MeshPhysicalMaterial({ map: pressedFlowersTexture(c.frosting), roughness: 0.5, bumpMap: buttercreamBump(), bumpScale: 0.5, sheen: 0.3 })
      return [m, cream()]
    }
    default:
      return [cream(), cream()]
  }
}

/** Finishes whose walls are textured over the full height (v = 0..1). */
export const NORMALIZED_V: Finish[] = ['seminaked', 'faultline']
/** Finishes whose wall color comes from a map rather than a tint. */
export const MAPPED: Finish[] = ['palette', 'marble', 'bark', 'lace', 'faultline', 'pressed']
