import { useEffect, useState } from 'react'

const cache = new Map<string, HTMLImageElement>()

export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src)
  if (hit?.complete) return Promise.resolve(hit)
  return new Promise((resolve, reject) => {
    const img = hit ?? new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    if (!hit) {
      img.src = src
      cache.set(src, img)
    }
  })
}

export function useImage(src: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(() => {
    const hit = cache.get(src)
    return hit?.complete ? hit : null
  })
  useEffect(() => {
    let alive = true
    loadImage(src).then((i) => alive && setImg(i), () => {})
    return () => {
      alive = false
    }
  }, [src])
  return img
}
