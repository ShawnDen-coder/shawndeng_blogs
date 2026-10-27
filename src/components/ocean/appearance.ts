import type { MantaPose } from './world'
import type { Point3 } from './geometry'
import { orient } from './geometry'

const clamp = (value: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, value))

/** Distance is optical transmission, independent of the material's own light. */
export function depthTransmission(depth: number) {
  return Math.exp(-Math.max(0, depth) * .24)
}

/** Stable body-space material, lit by the actual deformed surface normal. */
export function mantaAppearance(u: number, v: number, pose: MantaPose, normal: Point3) {
  const n = orient(normal, pose)
  const length = Math.max(.00001, Math.hypot(n.x, n.y, n.z))
  // Both sides catch light; the light direction stays fixed as the animal turns.
  const face = n.z > 0 ? -1 : 1
  const diffuse = Math.max(0, (n.x * -.32 - n.y * .30 - n.z * .90) * face / length)
  const span = Math.abs(u)
  const belly = Math.exp(-u * u * 12) * Math.sin(Math.PI * v) ** .45
  const rootShade = Math.exp(-(((span - .26) / .12) ** 2)) * Math.sin(v * Math.PI)
  const rim = Math.exp(-(((v - .12) / .07) ** 2)) * (1 - span) * .1
  const light = .18 + diffuse * .62 + belly * .22 - rootShade * .14 + rim
  // Low-frequency shoulder markings belong to the skin, not the screen grid.
  const shoulder = Math.exp(-(((span - .40) / .18) ** 2) - ((v - .27) / .23) ** 2)
  const mottling = .82 + .18 * Math.sin(u * 17 + Math.sin(v * 9))
  const warmth = shoulder * mottling * (.50 + diffuse * .5)
  return { light: clamp(light, .08, 1), warmth }
}
