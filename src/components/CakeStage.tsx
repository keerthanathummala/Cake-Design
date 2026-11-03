import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import { STAGE_H, STAGE_W } from '../lib/geometry'
import { stageRef } from '../lib/stageRef'
import { useStore } from '../store'
import Stand from './cake/Stand'

/** The drawing area: background, stand, cake and stickers, scaled to fit. */
export default function CakeStage() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const konvaRef = useRef<Konva.Stage>(null)
  const [fit, setFit] = useState(1)
  const zoom = useStore((s) => s.zoom)
  const background = useStore((s) => s.background)
  const select = useStore((s) => s.select)

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
      <div className="stage-center" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
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
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
