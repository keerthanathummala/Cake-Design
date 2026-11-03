import { useStore } from '../../store'
import Swatches from '../Swatches'

const BACKGROUNDS = [
  '#ffffff', '#fbf3ea', '#fde4ec', '#e6f4ea', '#e3eefb', '#efe6fb',
  '#fff6cc', '#f9d9c4', '#2b2b2b', '#1f2a44', '#5b2a3c', '#d7c9bd',
]

export default function BackgroundPanel() {
  const background = useStore((s) => s.background)
  const setBackground = useStore((s) => s.setBackground)
  return (
    <div>
      <h2 className="panel-title">Background</h2>
      <p className="panel-hint">White is the default. Pick a swatch, or use the color wheel on the right for any color.</p>
      <Swatches colors={BACKGROUNDS} value={background} onPick={setBackground} />
      <button className="btn small" style={{ marginTop: 14 }} onClick={() => setBackground('#ffffff')}>
        Reset to white
      </button>
    </div>
  )
}
