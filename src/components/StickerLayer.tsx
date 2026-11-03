import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Image as KImage, Layer, Transformer } from 'react-konva'
import { useImage } from '../hooks/useImage'
import { useStore, type Sticker } from '../store'

const MIN = 0.2
const MAX = 4

function StickerNode({ s, editable, selected }: { s: Sticker; editable: boolean; selected: boolean }) {
  const img = useImage(s.src)
  const ref = useRef<Konva.Image>(null)
  const select = useStore((st) => st.select)
  const update = useStore((st) => st.updateSticker)

  // Pop in at 110 % and settle.
  useEffect(() => {
    const n = ref.current
    if (!n || !img) return
    n.scale({ x: s.scale * 0.6, y: s.scale * 0.6 })
    n.to({ scaleX: s.scale * 1.1, scaleY: s.scale * 1.1, duration: 0.12, onFinish: () => n.to({ scaleX: s.scale, scaleY: s.scale, duration: 0.1 }) })
    // only on first appearance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img])

  if (!img) return null
  return (
    <KImage
      ref={ref}
      id={s.id}
      name="sticker"
      image={img}
      x={s.x}
      y={s.y}
      width={s.width}
      height={s.height}
      offsetX={s.width / 2}
      offsetY={s.height / 2}
      rotation={s.rotation}
      scaleX={s.scale}
      scaleY={s.scale}
      draggable={editable}
      listening={editable}
      shadowColor="rgba(0,0,0,0.25)"
      shadowBlur={selected ? 10 : 4}
      shadowOffsetY={2}
      onMouseDown={() => select(s.id)}
      onTap={() => select(s.id)}
      onDragStart={() => select(s.id)}
      onDragEnd={(e) => update(s.id, { x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const n = e.target
        update(s.id, { x: n.x(), y: n.y(), rotation: n.rotation(), scale: n.scaleX() })
      }}
      onMouseEnter={(e) => {
        const c = e.target.getStage()?.container()
        if (c) c.style.cursor = 'move'
      }}
      onMouseLeave={(e) => {
        const c = e.target.getStage()?.container()
        if (c) c.style.cursor = ''
      }}
    />
  )
}

/** All placed stickers, with resize and rotate handles on the selected one. */
export default function StickerLayer() {
  const stickers = useStore((s) => s.stickers)
  const selectedId = useStore((s) => s.selectedId)
  const step = useStore((s) => s.step)
  const editable = step === 'stickers'
  const trRef = useRef<Konva.Transformer>(null)
  const layerRef = useRef<Konva.Layer>(null)

  useEffect(() => {
    const tr = trRef.current
    const layer = layerRef.current
    if (!tr || !layer) return
    const node = editable && selectedId ? layer.findOne<Konva.Node>('#' + selectedId) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  })

  return (
    <Layer ref={layerRef}>
      {stickers.map((s) => (
        <StickerNode key={s.id} s={s} editable={editable} selected={s.id === selectedId} />
      ))}
      <Transformer
        ref={trRef}
        name="transformer"
        keepRatio
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        rotateAnchorOffset={26}
        anchorSize={12}
        anchorCornerRadius={6}
        anchorStroke="#d24d6b"
        anchorFill="#ffffff"
        borderStroke="#d24d6b"
        borderDash={[5, 4]}
        boundBoxFunc={(oldBox, box) => {
          const node = trRef.current?.nodes()[0]
          if (!node) return box
          const w = node.width()
          const scale = Math.abs(box.width) / w
          return scale < MIN || scale > MAX ? oldBox : box
        }}
      />
    </Layer>
  )
}
