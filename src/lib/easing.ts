/** Bounce easing for a "landing" feel. */
export function bounceOut(t: number, b: number, c: number, d: number) {
  if ((t /= d) < 1 / 2.75) return c * (7.5625 * t * t) + b
  if (t < 2 / 2.75) return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b
  if (t < 2.5 / 2.75) return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b
  return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b
}
