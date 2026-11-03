/** The 3D decorations people can put on the cake. Models live in three/toppers.tsx. */
export type TopperKind =
  | 'strawberry-half'
  | 'strawberry'
  | 'blueberry'
  | 'raspberry'
  | 'cherry'
  | 'orange'
  | 'rose'
  | 'rose-white'
  | 'babysbreath'
  | 'mint'
  | 'macaron'
  | 'macaron-pistachio'
  | 'meringue'
  | 'truffle'
  | 'shard'
  | 'candle'
  | 'goldleaf'
  | 'pearls'
  | 'sprinkles'

export type TopperInfo = { id: TopperKind; label: string; group: string; /** world size at scale 1 */ size: number }

export const TOPPERS: TopperInfo[] = [
  { id: 'strawberry-half', label: 'Sliced strawberry', group: 'Fruit', size: 0.27 },
  { id: 'strawberry', label: 'Strawberry', group: 'Fruit', size: 0.25 },
  { id: 'blueberry', label: 'Blueberry', group: 'Fruit', size: 0.1 },
  { id: 'raspberry', label: 'Raspberry', group: 'Fruit', size: 0.14 },
  { id: 'cherry', label: 'Cherry', group: 'Fruit', size: 0.15 },
  { id: 'orange', label: 'Dried orange', group: 'Fruit', size: 0.34 },
  { id: 'rose', label: 'Sugar rose', group: 'Flowers', size: 0.34 },
  { id: 'rose-white', label: 'White rose', group: 'Flowers', size: 0.34 },
  { id: 'babysbreath', label: "Baby's breath", group: 'Flowers', size: 0.36 },
  { id: 'mint', label: 'Mint sprig', group: 'Flowers', size: 0.24 },
  { id: 'macaron', label: 'Macaron', group: 'Sweets', size: 0.25 },
  { id: 'macaron-pistachio', label: 'Pistachio macaron', group: 'Sweets', size: 0.25 },
  { id: 'meringue', label: 'Meringue kiss', group: 'Sweets', size: 0.2 },
  { id: 'truffle', label: 'Truffle', group: 'Sweets', size: 0.16 },
  { id: 'shard', label: 'Chocolate shard', group: 'Sweets', size: 0.38 },
  { id: 'candle', label: 'Candle', group: 'Party', size: 0.46 },
  { id: 'goldleaf', label: 'Gold leaf', group: 'Party', size: 0.26 },
  { id: 'pearls', label: 'Sugar pearls', group: 'Party', size: 0.16 },
  { id: 'sprinkles', label: 'Sprinkles', group: 'Party', size: 0.4 },
]

export const TOPPER_GROUPS = ['Fruit', 'Flowers', 'Sweets', 'Party']

export const topperInfo = (kind: string) => TOPPERS.find((t) => t.id === kind) ?? TOPPERS[0]
