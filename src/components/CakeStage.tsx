import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import { STAGE_H, STAGE_W } from '../lib/geometry'
import { stageRef } from '../lib/stageRef'
import { useStore } from '../store'
import Cake from './cake/Cake'
import Stand from './cake/Stand'
import TierOutlines from './cake/TierOutlines'
import StickerLayer from './StickerLayer'
import StickerToolbar from './StickerToolbar'
import { addStickerAt, DRAG_MIME } from '../lib/addSticker'

/** The drawing area: background, stand, cake and stickers, scaled to fit. */
export default function CakeStage() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const konvaRef = useRef<Konva.Stage>(null)
  const [fit, setFit] = useState(1)
  const zoom = useStore((s) => s.zoom)
  const background = useStore((s) => s.background)
  const select = useStore((s) => s.select)
  const tiers = useStore((s) => s.tiers)
  const flavor = useStore((s) => s.flavor)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const pad = 24
      const s = Math.min((el.clientWidth - pad) / STAGE_W, (el.clientHeight - pad) / STAGE_H)
      setFit(Math.max(0.2, s))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    stageRef.current = konvaRef.current
  })

  const scale = fit * zoom

  return (
    <div className="stage-wrap" ref={wrapRef}>
      <StickerToolbar />
      <div
        className="stage-center"
        style={{ width: STAGE_W * scale, height: STAGE_H * scale }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(DRAG_MIME)) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }
        }}
        onDrop={(e) => {
          const src = e.dataTransfer.getData(DRAG_MIME)
          const stage = konvaRef.current
          if (!src || !stage) return
          e.preventDefault()
          stage.setPointersPositions(e)
          const p = stage.getPointerPosition()
          if (p) addStickerAt(src, { x: p.x / scale, y: p.y / scale })
        }}
        onWheel={(e) => {
          // Mouse wheel over the stage resizes the selected sticker.
          const st = useStore.getState()
          if (e.ctrlKey || e.metaKey) {
            // Ctrl + wheel zooms the whole view.
            e.preventDefault()
            st.setZoom(st.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))
            return
          }
          const s = st.step === 'stickers' && st.stickers.find((x) => x.id === st.selectedId)
          if (!s) return
          const next = Math.max(0.2, Math.min(4, s.scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))
          st.updateSticker(s.id, { scale: next })
        }}
      >
        <Stage
          ref={konvaRef}
          width={STAGE_W * scale}
          height={STAGE_H * scale}
          scaleX={scale}
          scaleY={scale}
          className="stage"
          onMouseDown={(e) => {
            if (e.target === e.target.getStage() || e.target.name() === 'bg') select(null)
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage() || e.target.name() === 'bg') select(null)
          }}
        >
          <Layer>
            <Rect name="bg" width={STAGE_W} height={STAGE_H} fill={background} />
            <Stand />
            {!flavor && <TierOutlines tiers={tiers} />}
            <Cake />
          </Layer>
          <StickerLayer />
        </Stage>
      </div>
    </div>
  )
}
