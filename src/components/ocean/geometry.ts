import type { MantaPose } from './world'
import { curvedSurface } from './motion-curves'
/** Original parametric manta surface. World Y is up; Z runs from nose to tail. */
export type Point3 = { x: number; y: number; z: number }
export type Projected = {
  x: number
  y: number
  depth: number
  light: number
  warmth: number
  u: number
  v: number
}

export function surface(u: number, v: number, pose: MantaPose): Point3 {
  return curvedSurface(u, v, pose.rig.phaseTime ?? pose.rig.time, pose.rig.settings, pose.bank)
}

/** Camera-space rotation shared by positions and surface normals. */
export function orient(point: Point3, pose: MantaPose): Point3 {
  const yaw = Math.atan2(-Math.cos(pose.heading), Math.sin(pose.heading) / .747)
  const xb = point.x * Math.cos(pose.bank) - point.y * Math.sin(pose.bank)
  const yb = point.x * Math.sin(pose.bank) + point.y * Math.cos(pose.bank)
  const yp = yb * Math.cos(pose.pitch) - point.z * Math.sin(pose.pitch)
  const zp = yb * Math.sin(pose.pitch) + point.z * Math.cos(pose.pitch)
  const x = xb * Math.cos(yaw) + zp * Math.sin(yaw)
  const z = -xb * Math.sin(yaw) + zp * Math.cos(yaw)
  return { x, y: yp * .664 + z * .747, z: yp * .747 - z * .664 }
}

/** Perspective from below; frame size and animal scale are separate decisions. */
export function project(
  point: Point3, pose: MantaPose, width: number, height: number,
  pointerX = 0, pointerY = 0
): Projected {
  const camera = orient(point, pose)
  const depth = 6 + pose.depth + camera.z
  // A fullscreen canvas must not turn a quiet swimmer into a screen-sized model.
  const focal = Math.min(width * 1.05, height * 1.3, 1080) * pose.scale
  const parallax = 1 / (1 + pose.depth * .35)
  return {
    x: width * pose.x + camera.x / depth * focal + pointerX * 8 * parallax,
    y: height * pose.y - camera.y / depth * focal + pointerY * 5 * parallax,
    depth, light: .7, warmth: 0, u: 0, v: 0
  }
}
