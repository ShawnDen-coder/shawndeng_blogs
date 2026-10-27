import type { MantaPose } from './world'

export type MotionSettings = {
  period: number; hold: number; amplitude: number
  delay: number; twist: number; turn: number
}
export const DEFAULT_MOTION: MotionSettings = {
  period: 3.8, hold: .45, amplitude: .82, delay: .30, twist: .28, turn: .20
}
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const ease = (t: number) => { const x = clamp(t, 0, 1); return x ** 3 * (10 - 15 * x + 6 * x * x) }
const derivative = (t: number) => { const x = clamp(t, 0, 1); return 30 * x * x * (1 - x) ** 2 }

/** Asymmetric stroke; the glide stays at the upper reversal, with C2 joins. */
export function strokeCurve(time: number, settings: MotionSettings) {
  const { period, hold, amplitude } = settings
  const phase = ((time % period) + period) % period
  const downTime = (period - hold) * .43
  const upTime = period - hold - downTime
  const upper = amplitude, lower = -amplitude * .64
  if (phase < hold) return { angle: upper, velocity: 0, thrust: 0, stage: '滑行' }
  if (phase < hold + downTime) {
    const t = (phase - hold) / downTime
    const velocity = (lower - upper) * derivative(t) / downTime
    return { angle: upper + (lower - upper) * ease(t), velocity,
      thrust: Math.abs(velocity) ** 1.4, stage: '下拍' }
  }
  const t = (phase - hold - downTime) / upTime
  const velocity = (upper - lower) * derivative(t) / upTime
  return { angle: lower + (upper - lower) * ease(t), velocity,
    thrust: .70 * Math.abs(velocity) ** 1.4, stage: '上拍' }
}

/** Stiff inner span, flexible outer span, with passive tip lag opposing fin velocity. */
export function finBend(time: number, bend: number, chord: number, settings: MotionSettings, bank = 0, side = 1) {
  const motion = strokeCurve(time - settings.delay * bend - chord * settings.delay * .35, settings)
  const flex = .55 * bend ** .75 + 1.4 * bend ** 2
  const passiveCurl = -motion.velocity * .20 * bend ** 4
  return clamp((motion.angle * flex + passiveCurl) * (1 + side * bank * .65), -1.35, 1.55)
}

/** Flexible fin arc plus chordwise twist; body/root remains stable. */
export function curvedSurface(u: number, v: number, time: number, settings: MotionSettings, bank: number) {
  const span = Math.abs(u), side = Math.sign(u)
  const front = -.72 + .38 * span ** .7
  const back = .67 - 1.01 * span ** 1.35
  const chord = back - front
  const z = front + chord * v
  const root = .15
  const extension = Math.max(0, span - root)
  let x = Math.min(span, root) * 1.9, y = 0
  // Integrating the curved span changes projected width as the fin rises/folds.
  for (let i = 0; i < 14; i++) {
    const s = root + extension * (i + .5) / 14
    const bend = (s - root) / (1 - root)
    const angle = finBend(time, bend, v, settings, bank, side)
    x += Math.cos(angle) * extension * 1.9 / 14
    y += Math.sin(angle) * extension * 1.9 / 14
  }
  const motion = strokeCurve(time - settings.delay * span, settings)
  const pitch = clamp(-motion.velocity * settings.twist, -.5, .5) * span ** 1.5
  const offset = chord * (v - .28)
  const belly = -.19 * Math.exp(-u * u * 15) * Math.sin(Math.PI * v) ** .7
  return { x: side * x, y: belly + y + offset * Math.sin(pitch),
    z: z + offset * (Math.cos(pitch) - 1) }
}

/** Integrate each chordwise strip once, reusing its arc for all mesh vertices. */
export function createFinSampler(time: number, settings: MotionSettings, bank: number, chords: number) {
  const steps = 48, root = .15, step = (1 - root) * 1.9 / steps
  const arcs: Array<{ x: Float32Array; y: Float32Array }> = []
  for (const side of [-1, 1]) {
    for (let j = 0; j <= chords; j++) {
      const x = new Float32Array(steps + 1), y = new Float32Array(steps + 1)
      x[0] = root * 1.9
      for (let i = 1; i <= steps; i++) {
        const angle = finBend(time, (i - .5) / steps, j / chords, settings, bank, side)
        x[i] = x[i - 1] + Math.cos(angle) * step
        y[i] = y[i - 1] + Math.sin(angle) * step
      }
      arcs.push({ x, y })
    }
  }
  return (u: number, v: number) => {
    const span = Math.abs(u), side = Math.sign(u)
    const arc = arcs[(u > 0 ? chords + 1 : 0) + Math.round(v * chords)]
    const position = clamp((span - root) / (1 - root), 0, 1) * steps
    const lo = Math.floor(position), hi = Math.min(steps, lo + 1), mix = position - lo
    const x = span < root ? span * 1.9 : arc.x[lo] + (arc.x[hi] - arc.x[lo]) * mix
    const y = arc.y[lo] + (arc.y[hi] - arc.y[lo]) * mix
    const front = -.72 + .38 * span ** .7
    const back = .67 - 1.01 * span ** 1.35
    const chord = back - front, offset = chord * (v - .28)
    const motion = strokeCurve(time - settings.delay * span, settings)
    const pitch = clamp(-motion.velocity * settings.twist, -.5, .5) * span ** 1.5
    const belly = -.19 * Math.exp(-u * u * 15) * Math.sin(Math.PI * v) ** .7
    return { x: side * x, y: belly + y + offset * Math.sin(pitch),
      z: front + chord * v + offset * (Math.cos(pitch) - 1) }
  }
}

/** The same turn envelope drives body orientation, trajectory and trailing tail history. */
export function turnCurve(time: number, settings: MotionSettings) {
  const duration = settings.period * 4
  const progress = clamp((time / duration - .30) / .40, 0, 1)
  const bank = -settings.turn * Math.sin(Math.PI * progress) ** 2
  const angle = -settings.turn * .65 * duration * .40 *
    (progress / 2 - Math.sin(2 * Math.PI * progress) / (4 * Math.PI))
  return { bank, yawRate: bank * .65, heading: -2.35 + angle }
}

/** Inextensible passive tail: delayed turn history and a small stroke-driven vertical response. */
export function tailPoint(position: number, time: number, settings: MotionSettings, history?: Array<{ time: number; heading: number }>) {
  const length = clamp(position, 0, 1)
  const lag = settings.period * .32
  const yaw = (heading: number) => Math.atan2(-Math.cos(heading), Math.sin(heading) / .747)
  const headingAt = (age: number) => {
    if (!history?.length) return turnCurve(time - age, settings).heading
    const target = time - age
    if (target <= history[0].time) return history[0].heading
    let lo = 0, hi = history.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (history[mid].time < target) lo = mid
      else hi = mid
    }
    const mix = clamp((target - history[lo].time) / Math.max(1e-8, history[hi].time - history[lo].time), 0, 1)
    return history[lo].heading + (history[hi].heading - history[lo].heading) * mix
  }
  const currentYaw = yaw(headingAt(0))
  const point = { x: 0, y: .015, z: .59 }
  const segments = 16
  const step = length * 1.56 / segments
  for (let i = 0; i < segments; i++) {
    const along = length * (i + .5) / segments
    const delayed = time - lag * along
    const oldYaw = yaw(headingAt(lag * along))
    const bend = Math.atan2(Math.sin(oldYaw - currentYaw), Math.cos(oldYaw - currentYaw)) * 1.25
    const stroke = strokeCurve(delayed - .18, settings)
    const lift = -.115 * stroke.velocity * along
    // Segment length stays constant: flexing never stretches the tail like rubber.
    point.x += Math.sin(bend) * Math.cos(lift) * step
    point.y += Math.sin(lift) * step
    point.z += Math.cos(bend) * Math.cos(lift) * step
  }
  return point
}

export type LabFrame = {
  time: number; root: number; tip: number; twist: number
  thrust: number; speed: number; bank: number; tailSide: number; tailLift: number; stage: string; pose: MantaPose
}
export function buildMotionFrames(settings: MotionSettings, width: number, height: number): LabFrame[] {
  const duration = settings.period * 4, dt = 1 / 120, unit = Math.min(width, height)
  const frames: LabFrame[] = []
  let speed = .055, x = .70, y = .65
  for (let n = 0; n <= Math.ceil(duration / dt); n++) {
    const time = Math.min(duration, n * dt)
    const motion = strokeCurve(time, settings)
    const tip = strokeCurve(time - settings.delay, settings)
    const { bank, yawRate, heading } = turnCurve(time, settings)
    if (n > 0) {
      speed += (.045 * motion.thrust - 7 * speed * speed) * dt
      x += Math.cos(heading) * unit * speed * dt / width
      y += Math.sin(heading) * unit * speed * dt / height
    }
    const pose: MantaPose = {
      x, y, heading, turn: yawRate, bank, pitch: 0, scale: .74, depth: 0, effort: 1,
      rig: { time, settings }
    }
    const tail = tailPoint(1, time, settings)
    frames.push({ time, tailSide: tail.x, tailLift: tail.y - .015, root: motion.angle, tip: finBend(time, 1, .5, settings),
      twist: clamp(-tip.velocity * settings.twist, -.5, .5), thrust: motion.thrust,
      speed, bank, stage: motion.stage, pose })
  }
  return frames
}
