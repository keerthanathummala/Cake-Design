import type Konva from 'konva'

/** The Konva stage, shared so the download step can export it. */
export const stageRef: { current: Konva.Stage | null } = { current: null }
