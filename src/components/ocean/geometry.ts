import type { MantaPose } from './world'
import { curvedSurface } from './motion-curves'
/** Original parametric manta surface. World Y is up; Z runs from nose to tail. */
export type Point3 = { x: number; y: number; z: number }
export type Projected = {
  x: number
  y: number
  depth: number
  light: number
  u: number
  v: number
}

export function surface(u: number, v: number, pose: MantaPose): Point3 {
  return curvedSurface(u, v, pose.rig.time, pose.rig.settings, pose.bank)
}

/** Perspective from below; nose orientation follows the swimmer's screen heading. */
export function project(
  point: Point3, pose: MantaPose, width: number, height: number,
  pointerX = 0, pointerY = 0
): Projected {
  const yaw = Math.atan2(-Math.cos(pose.heading), Math.sin(pose.heading) / .747)
  const curvedX = point.x
  const xb = curvedX * Math.cos(pose.bank) - point.y * Math.sin(pose.bank)
  const yb = curvedX * Math.sin(pose.bank) + point.y * Math.cos(pose.bank)
  const yp = yb * Math.cos(pose.pitch) - point.z * Math.sin(pose.pitch)
  const zp = yb * Math.sin(pose.pitch) + point.z * Math.cos(pose.pitch)
  const x = xb * Math.cos(yaw) + zp * Math.sin(yaw)
  const z = -xb * Math.sin(yaw) + zp * Math.cos(yaw)
  const depth = 6 + pose.depth + yp * .747 - z * .664
  const cameraY = yp * .664 + z * .747
  const focal = Math.min(width * 1.08, height * 1.75) * pose.scale
  return {
    x: width * pose.x + x / depth * focal + pointerX * 5,
    y: height * pose.y - cameraY / depth * focal + pointerY * 3,
    depth, light: .7, u: 0, v: 0
  }
}
