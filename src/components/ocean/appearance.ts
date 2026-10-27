import type { MantaPose } from './world'
import { finBend } from './motion-curves'

/** Material stays attached to the fin; folding changes its light, not its markings. */
export function mantaAppearance(u: number, v: number, pose: MantaPose) {
  const span = Math.abs(u)
  const bend = finBend(pose.rig.time, Math.max(0, (span - .15) / .85), v,
    pose.rig.settings, pose.bank, Math.sign(u))
  const facing = Math.max(0, Math.cos(bend + pose.bank * Math.sign(u)))
  const belly = Math.exp(-u * u * 7)
  const edge = Math.min(v, 1 - v)
  const light = (.22 + belly * .42 + Math.sin(v * Math.PI) * .16 + facing * .22 +
    (edge < .065 ? .06 : 0)) * (1 - pose.depth * .09)
  // Restrained amber at the shoulders, framed by a pale belly and violet-grey tips.
  const shoulder = Math.exp(-(((span - .38) / .19) ** 2) - ((v - .30) / .34) ** 2)
  const warmth = shoulder * (.65 + facing * .25) * Math.exp(-Math.max(0, pose.depth) * .35)
  return { light: Math.max(.15, Math.min(1, light)), warmth }
}
