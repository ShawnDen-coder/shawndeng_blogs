import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const output = mkdtempSync(join(tmpdir(), 'ocean-motion-'))
try {
  execFileSync(process.execPath, [
    'node_modules/typescript/bin/tsc',
    'src/components/ocean/world.ts', 'src/components/ocean/geometry.ts',
    '--outDir', output, '--module', 'commonjs', '--target', 'ES2022', '--skipLibCheck'
  ])
  writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}')
  const require = createRequire(join(output, 'package.json'))
  const { MantaWorld } = require('./world.js')
  const { surface, project } = require('./geometry.js')

  const { DEFAULT_MOTION, strokeCurve, curvedSurface, buildMotionFrames, finBend, tailPoint, createFinSampler } = require('./motion-curves.js')
  const settings = { ...DEFAULT_MOTION }
  const active = settings.period - settings.hold
  for (const time of [.1, 1.1, 2.3, 3.5]) {
    const sampler = createFinSampler(time, settings, -.2, 25)
    for (let i = 0; i <= 58; i++) for (let j = 0; j <= 25; j++) {
      const u = i / 29 - 1, v = j / 25
      const actual = sampler(u, v), reference = curvedSurface(u, v, time, settings, -.2)
      assert(Math.hypot(actual.x - reference.x, actual.y - reference.y, actual.z - reference.z) < .009,
        'shared strip integration must preserve the calibrated fin shape')
    }
  }
  for (const t of [0, settings.hold, settings.hold + active * .43, settings.period]) {
    const before = strokeCurve(t - 1e-5, settings)
    const after = strokeCurve(t + 1e-5, settings)
    assert(Math.abs(before.angle - after.angle) < 1e-4, 'stroke position must join continuously')
    assert(Math.abs(before.velocity - after.velocity) < 1e-3, 'stroke velocity must join continuously')
  }
  assert(strokeCurve(settings.hold + active * .2, settings).thrust > 0, 'downstroke produces thrust')
  assert(strokeCurve(settings.hold + active * .7, settings).thrust > 0, 'upstroke also produces thrust')
  assert.equal(strokeCurve(settings.hold / 2, settings).angle, settings.amplitude)
  // Outer span curls much more than the supported inner span; the arc cannot fold through itself.
  const top = settings.hold + settings.delay
  assert(finBend(top, 1, .5, settings) > finBend(top, .5, .5, settings) * 2)
  for (let t = 0; t < settings.period; t += .025) {
    let previousX = 0
    for (let span = 0; span <= 1; span += .025) {
      const p = curvedSurface(span, .5, t, settings, 0)
      assert(p.x >= previousX, 'the curling fin must not invert its span')
      previousX = p.x
    }
  }
  const raised = curvedSurface(.95, .5, settings.hold / 2, settings, 0)
  const lowered = curvedSurface(.95, .5, settings.hold + active * .43 + settings.delay, settings, 0)
  assert(raised.y > .25 && lowered.y < 0, 'fins must rise and descend around a stable body')
  assert(Math.abs(raised.x - lowered.x) > .02, 'bending must change span, not only vertical height')
  for (const t of [0, 1, 2, 3]) {
    const body = curvedSurface(0, .5, t, settings, 0)
    assert.equal(body.x, 0)
    assert.equal(body.y, curvedSurface(0, .5, 0, settings, 0).y)
  }
  const lab = buildMotionFrames(settings, 900, 430)
  assert.deepEqual(lab, buildMotionFrames(settings, 900, 430), 'seeking uses deterministic sampled poses')
  assert(lab.at(-1).pose.x < lab[0].pose.x, 'thrust must advance the body')
  assert(lab.some(f => f.bank < -.1) && Math.abs(lab.at(-1).bank) < 1e-9, 'bank must enter and recover')
  for (const frame of lab) assert(Object.values(frame.pose).filter(v => typeof v === 'number').every(Number.isFinite))
  let tailMin = Infinity, tailMax = -Infinity
  for (let time = 0; time < settings.period * 4; time += .1) {
    assert.deepEqual(tailPoint(0, time, settings), { x: 0, y: .015, z: .59 }, 'tail root stays attached')
    let previous = tailPoint(0, time, settings), arc = 0
    for (let i = 1; i <= 32; i++) {
      const point = tailPoint(i / 32, time, settings)
      arc += Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z)
      previous = point
    }
    assert(Math.abs(arc - 1.56) < .004, 'passive bending must preserve tail length')
    const before = tailPoint(1, time - .001, settings)
    const after = tailPoint(1, time + .001, settings)
    assert(Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z) < .003, 'tail response must be continuous')
    tailMin = Math.min(tailMin, previous.y)
    tailMax = Math.max(tailMax, previous.y)
  }
  assert(tailMax - tailMin > .08, 'the tip must visibly respond to strokes')
  assert(Math.abs(tailPoint(1, settings.period * 4, settings).x) < 1e-6, 'tail settles after the turn')
  console.log('Curve joins, dual-stroke thrust, flexible span, stable body, seeking and passive tail passed')

  for (const [width, height] of [[1440, 510], [768, 410], [390, 310]]) {
    for (let seed = 0; seed < 24; seed++) {
      const world = new MantaWorld(seed)
      for (let frame = 1; frame <= 180 * 30; frame++) {
        const before = world.animals.map(p => ({ ...p }))
        const poses = world.advance(frame / 30, width, height)
        poses.forEach((p, i) => {
          assert(Object.values(p).filter(x => typeof x === 'number').every(Number.isFinite))
          assert(p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1)
          assert(Math.abs(p.bank) < .301 && Math.abs(p.pitch) < .051)
          assert(Math.abs(p.heading - before[i].heading) <= .85 / 30 + .0001)
          const origin = project({ x: 0, y: 0, z: 0 }, p, width, height)
          const nose = project({ x: 0, y: 0, z: -.72 }, p, width, height)
          const headingError = Math.atan2(nose.y - origin.y, nose.x - origin.x) - p.heading
          assert(Math.abs(Math.atan2(Math.sin(headingError), Math.cos(headingError))) < .04)
        })
      }
    }
    console.log(`${width}×${height}: 24 routes × 180 seconds passed`)
  }

  const world = new MantaWorld(42)
  for (let n = 1; n <= 1200; n++) {
    world.advance(n / 60, 1440, 510)
    assert.equal(world.animals.length, 3)
    for (const fish of world.animals) {
      assert(fish.rig.headingHistory.length > 0 && fish.rig.headingHistory.length <= 241)
      const p = tailPoint(1, fish.rig.time, fish.rig.settings, fish.rig.headingHistory)
      assert(Object.values(p).every(Number.isFinite))
    }
  }
  assert.notEqual(world.animals[0].rig.time, world.animals[1].rig.time)
  assert.notEqual(world.animals[0].rig.settings.period, world.animals[1].rig.settings.period)
  console.log('Three independent calibrated rigs and passive tail histories passed')

} finally {
  rmSync(output, { recursive: true, force: true })
}
