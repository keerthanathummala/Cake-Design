/** Lettering for piped messages. All are Google Fonts, loaded in index.html. */
export const FONTS = [
  { id: 'script', label: 'Elegant script', family: 'Great Vibes', weight: 400 },
  { id: 'dancing', label: 'Dancing', family: 'Dancing Script', weight: 700 },
  { id: 'pacifico', label: 'Retro', family: 'Pacifico', weight: 400 },
  { id: 'parisienne', label: 'Parisienne', family: 'Parisienne', weight: 400 },
  { id: 'satisfy', label: 'Satisfy', family: 'Satisfy', weight: 400 },
  { id: 'lobster', label: 'Lobster', family: 'Lobster', weight: 400 },
  { id: 'serif', label: 'Classic serif', family: 'Playfair Display', weight: 600 },
  { id: 'cinzel', label: 'Engraved', family: 'Cinzel', weight: 600 },
  { id: 'hand', label: 'Handwritten', family: 'Caveat', weight: 600 },
  { id: 'amatic', label: 'Chalk', family: 'Amatic SC', weight: 700 },
  { id: 'fredoka', label: 'Rounded', family: 'Fredoka', weight: 600 },
  { id: 'sans', label: 'Bold', family: 'Montserrat', weight: 800 },
] as const

export type FontId = (typeof FONTS)[number]['id']

export function fontOf(id: string | undefined) {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]
}

/** CSS font stack for a lettering style. */
export const cssFamily = (id: string | undefined) => `"${fontOf(id).family}", cursive`

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Caveat:wght@600&family=Cinzel:wght@600&family=Dancing+Script:wght@700&family=Fredoka:wght@600&family=Great+Vibes&family=Lobster&family=Montserrat:wght@800&family=Pacifico&family=Parisienne&family=Playfair+Display:wght@600&family=Satisfy&display=swap'
