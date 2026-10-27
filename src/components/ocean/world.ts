import { DEFAULT_MOTION, strokeCurve } from './motion-curves'
import type { MotionSettings } from './motion-curves'

export type MantaPose = {
  x: number; y: number; heading: number; turn: number
  bank: number; pitch: number; scale: number; depth: number; effort: number
  rig: { time: number; settings: MotionSettings; headingHistory?: Array<{ time: number; heading: number }> }
}
type Swimmer = MantaPose & {
  targetX: number; targetY: number; nextDestination: number
  speed: number; cruise: number; nextCruise: number
  depthTarget: number; nextDepth: number
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const wrap = (v: number) => Math.atan2(Math.sin(v), Math.cos(v))

/** Independent routes sharing the calibrated rig; banking steers both body and trajectory. */
export class MantaWorld {
  private time = 0
  private randomState = 0
  readonly animals: Swimmer[] = []
  constructor(private seed = Math.floor(Math.random() * 0x100000000)) { this.reset() }
  private random() {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0
    return this.randomState / 0x100000000
  }
  private destination(fish: Swimmer) {
    for (let attempt = 0; attempt < 12; attempt++) {
      fish.targetX = .20 + this.random() * .60
      fish.targetY = .28 + this.random() * .44
      if (Math.hypot(fish.targetX - fish.x, fish.targetY - fish.y) > .32) break
    }
    fish.nextDestination = this.time + 9 + this.random() * 8
  }
  private reset() {
    this.time = 0
    this.randomState = this.seed >>> 0
    this.animals.splice(0, this.animals.length, ...[
      { x: .75, y: .64, heading: -2.3, scale: .78 },
      { x: .20, y: .36, heading: .55, scale: .56 },
      { x: .54, y: .25, heading: 2.3, scale: .43 }
    ].map((p, i) => ({
      ...p, turn: 0, bank: 0, pitch: 0,
      depth: i * .8, depthTarget: i * .8, nextDepth: 6 + this.random() * 10,
      targetX: p.x + Math.cos(p.heading) * .4,
      targetY: p.y + Math.sin(p.heading) * .3,
      nextDestination: 7 + this.random() * 7,
      effort: 1, speed: .075, cruise: .16, nextCruise: 3 + this.random() * 5,
      rig: { time: i * 1.27 + .2, settings: { ...DEFAULT_MOTION,
        period: DEFAULT_MOTION.period * [1, 1.07, .95][i] }, headingHistory: [{ time: i * 1.27 + .2, heading: p.heading }] }
    })))
  }
  advance(time: number, width: number, height: number) {
    if (time < this.time) this.reset()
    while (this.time < time - .00001) {
      const dt = Math.min(1 / 60, time - this.time)
      this.time += dt
      const positions = this.animals.map(({ x, y }) => ({ x, y }))
      this.animals.forEach((fish, i) => {
        const unit = Math.min(width, height)
        if (this.time > fish.nextDestination || Math.hypot(
          (fish.targetX - fish.x) * width, (fish.targetY - fish.y) * height
        ) < unit * .16) this.destination(fish)
        if (this.time > fish.nextCruise) {
          fish.cruise = .15 + this.random() * .035
          fish.nextCruise = this.time + 4 + this.random() * 5
        }
        if (this.time > fish.nextDepth) {
          fish.depthTarget = i * .8 + (this.random() - .5) * .4
          fish.nextDepth = this.time + 8 + this.random() * 9
        }
        const dx = (fish.targetX - fish.x) * width
        const dy = (fish.targetY - fish.y) * height
        const distance = Math.max(1, Math.hypot(dx, dy))
        const futureX = fish.x + Math.cos(fish.heading) * unit * fish.speed * 3.5 / width
        const futureY = fish.y + Math.sin(fish.heading) * unit * fish.speed * 3.5 / height
        let steerX = dx / distance + Math.max(0, .22 - futureX) * 14 - Math.max(0, futureX - .78) * 14
        let steerY = dy / distance + Math.max(0, .28 - futureY) * 14 - Math.max(0, futureY - .72) * 14
        positions.forEach((other, j) => {
          if (j === i) return
          const sx = (fish.x - other.x) * width / unit
          const sy = (fish.y - other.y) * height / unit
          const apart = Math.hypot(sx, sy)
          if (apart > .001 && apart < .30) {
            steerX += sx / apart * (.30 - apart) * 3
            steerY += sy / apart * (.30 - apart) * 3
          }
        })
        let error = wrap(Math.atan2(steerY, steerX) - fish.heading)
        if (Math.abs(error) > 2.5) error = Math.abs(error) * (
          Math.abs(fish.turn) > .05 ? Math.sign(fish.turn) : (i % 2 ? -1 : 1)
        )
        const targetBank = clamp(error * .40, -.30, .30)
        fish.bank += (targetBank - fish.bank) * Math.min(1, dt * 2.2)
        fish.turn = fish.bank * 2.6
        fish.heading += fish.turn * dt
        const clearanceX = (Math.cos(fish.heading) < 0 ? fish.x : 1 - fish.x) * width / unit
        const clearanceY = (Math.sin(fish.heading) < 0 ? fish.y : 1 - fish.y) * height / unit
        const edgeSpeed = clamp((Math.min(clearanceX, clearanceY) - .05) / .35, .15, 1)
        const targetSpeed = fish.cruise * edgeSpeed * (1 - Math.min(.4, Math.abs(fish.turn) * .5))
        fish.effort += ((targetSpeed / .125) ** 2 - fish.effort) * dt * 1.8
        fish.rig.time += dt
        const stroke = strokeCurve(fish.rig.time, fish.rig.settings)
        const acceleration = .045 * stroke.thrust * fish.effort -
          (7 + (1 - edgeSpeed) * 15) * fish.speed * fish.speed
        fish.speed = Math.max(0, fish.speed + acceleration * dt)
        fish.x += Math.cos(fish.heading) * unit * fish.speed * dt / width
        fish.y += Math.sin(fish.heading) * unit * fish.speed * dt / height
        const dive = (fish.depthTarget - fish.depth) * .08
        fish.depth += dive * dt
        fish.pitch += (clamp(dive * .7, -.05, .05) - fish.pitch) * dt * 1.5
        fish.rig.headingHistory!.push({ time: fish.rig.time, heading: fish.heading })
        while (fish.rig.headingHistory!.length > 1 &&
          fish.rig.time - fish.rig.headingHistory![1].time > 2) fish.rig.headingHistory!.shift()
      })
    }
    return this.animals
  }
}
