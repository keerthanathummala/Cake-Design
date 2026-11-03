import { useStore } from '../store'

type Props = { colors: string[]; value: string | null; onPick: (c: string) => void }

/** A grid of color swatches, plus the visitor's recent colors when there are any. */
export default function Swatches({ colors, value, onPick }: Props) {
  const recent = useStore((s) => s.recentColors)
  const all = [...colors, ...recent.filter((c) => !colors.includes(c))]
  return (
    <div className="swatches">
      {all.map((c) => (
        <button
          key={c}
          className={`swatch-btn ${value?.toLowerCase() === c.toLowerCase() ? 'on' : ''}`}
          style={{ background: c }}
          onClick={() => onPick(c)}
          aria-label={`Color ${c}`}
          title={c}
        />
      ))}
    </div>
  )
}
