import { create } from 'zustand'

/** Rendered preview images of each 3D topper, keyed by kind. */
export const useThumbs = create<Record<string, string>>(() => ({}))
