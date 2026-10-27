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
    'src/components/ocean/appearance.ts',
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

  // Cover both the compact laboratory and the full-viewport homepage.
  for (const [width, height] of [[1440, 510], [768, 410], [390, 310], [2048, 1015], [768, 1024], [390, 844]]) {
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

  // A settled glide holds an open wing and cannot keep driving the animal forward.
  const resting = { ...settings, activity: 0 }
  const rest = curvedSurface(.85, .5, 0, resting, 0)
  for (let t = 0; t < settings.period * 2; t += .1) {
    assert.equal(strokeCurve(t, resting).thrust, 0)
    assert.equal(Math.abs(strokeCurve(t, resting).velocity), 0)
    assert.deepEqual(curvedSurface(.85, .5, t, resting, 0), rest)
  }
  const glideWorld = new MantaWorld(17)
  for (const fish of glideWorld.animals) {
    fish.gait = 'glide'; fish.nextGait = Infinity; fish.rig.settings.activity = 0
  }
  for (let n = 1; n <= 300; n++) {
    const speeds = glideWorld.animals.map(fish => fish.speed)
    glideWorld.advance(n / 60, 1440, 900).forEach((fish, i) => {
      assert(fish.speed < speeds[i], 'a settled glide loses speed to drag')
    })
  }
  const rhythms = new MantaWorld(62), stages = [new Set(), new Set(), new Set()]
  for (let n = 1; n <= 60 * 90; n++) {
    const before = rhythms.animals.map(fish => ({ phase: fish.rig.phaseTime,
      activity: fish.rig.settings.activity, angle: strokeCurve(fish.rig.phaseTime, fish.rig.settings).angle }))
    rhythms.advance(n / 60, 1440, 900).forEach((fish, i) => {
      stages[i].add(fish.gait)
      assert(fish.rig.phaseTime > before[i].phase, 'changing gait cannot reset or reverse wing phase')
      assert(Math.abs(fish.rig.settings.activity - before[i].activity) <= .021)
      assert(Math.abs(strokeCurve(fish.rig.phaseTime, fish.rig.settings).angle - before[i].angle) < .05,
        'gait transitions must not snap the wing')
      assert(Number.isFinite(fish.rig.headingHistory.at(-1).strokeVelocity))
    })
  }
  stages.forEach(seen => assert.equal(seen.size, 3, 'each animal has all three rhythms'))
  const baseline = new MantaWorld(8), disturbed = new MantaWorld(8)
  disturbed.disturb(.70, .60)
  baseline.advance(2, 1440, 900); disturbed.advance(2, 1440, 900)
  assert(Math.abs(baseline.animals[0].heading - disturbed.animals[0].heading) > .01,
    'a nearby disturbance should produce a restrained turn')
  assert.equal(baseline.animals[2].heading, disturbed.animals[2].heading,
    'a distant animal should not chase the same interaction')
  const pose = rhythms.animals[0]
  const extent = width => {
    const a = project({ x: -1, y: 0, z: 0 }, pose, width, 1200)
    const b = project({ x: 1, y: 0, z: 0 }, pose, width, 1200)
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  assert(Math.abs(extent(1440) - extent(2560)) < 1e-9,
    'large screens increase the scene area without enlarging the animal')
  console.log('Open-wing glide, drag, independent gait transitions, local interaction and bounded scale passed')

  const {
    composeMantaCell, glyphIndex, readingMask, acceptsDepth, sceneSchedulesAnimation,
    waterMote, waterCount, WATER_SPEEDS, WATER_CONTRAST_CAP, PAGE_BG, mantaAppearance
  } = require('./appearance.js')
  const srgbToLinear = (c) => {
    const x = c / 255
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  const oklab = (rgb) => {
    const r = srgbToLinear(rgb[0]), g = srgbToLinear(rgb[1]), b = srgbToLinear(rgb[2])
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
    return {
      L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    }
  }
  const contrast = (rgb, theme) => Math.abs(oklab(rgb).L - oklab(PAGE_BG[theme]).L) * 100
  const chroma = (rgb) => Math.hypot(oklab(rgb).a, oklab(rgb).b)
  const over = (rgb, theme, alpha) => PAGE_BG[theme].map((channel, i) => channel + (rgb[i] - channel) * alpha)
  const paint = (theme, light, warmth, depth, span = 0) =>
    composeMantaCell({ theme, light, warmth, opticalDepth: depth, span })
  const band = (theme, light, warmth, depth, lo, hi, label) => {
    const value = contrast(paint(theme, light, warmth, depth).tile, theme)
    assert(value >= lo && value <= hi, `${label} contrast ${value.toFixed(2)} outside ${lo}–${hi}`)
  }
  for (const theme of ['dark', 'light']) {
    band(theme, .5, 0, 5.2, theme === 'dark' ? 4 : 3, theme === 'dark' ? 10 : 7, `${theme} far`)
    band(theme, .85, 0, 5.2, theme === 'dark' ? 4 : 3, theme === 'dark' ? 10 : 7, `${theme} far lit`)
    band(theme, .5, 0, 2.5, theme === 'dark' ? 10 : 7, theme === 'dark' ? 22 : 15, `${theme} mid`)
    if (theme === 'dark') {
      band(theme, .22, 0, .35, 8, 16, 'dark near shadow')
      band(theme, .85, 0, .35, 30, 48, 'dark near lit')
    } else {
      band(theme, .22, 0, .35, 18, 30, 'light near shadow')
      band(theme, .85, 0, .35, 8, 16, 'light near lit')
    }
    const caps = { 0.35: theme === 'dark' ? 0.07 : 0.05, 2.5: 0.02, 5.2: 0.012 }
    for (const depth of [0.35, 2.5, 5.2]) {
      const tinted = paint(theme, .85, 1, depth)
      assert(chroma(tinted.tile) <= caps[depth] + 1e-4, `${theme} shoulder chroma at ${depth}`)
      let previousContrast = Infinity, previousChroma = Infinity, previousGlyph = Infinity
      for (let step = 0; step <= 7; step += 0.5) {
        const sample = paint(theme, .55, 1, depth + step)
        const tileContrast = contrast(sample.tile, theme)
        const glyphContrast = contrast(sample.glyph, theme)
        const tileChroma = chroma(sample.tile)
        assert(tileContrast <= previousContrast + 0.35, `${theme} contrast must not rise with depth`)
        assert(tileChroma <= previousChroma + 0.004, `${theme} chroma must not rise with depth`)
        assert(glyphContrast <= previousGlyph + 0.35, `${theme} glyph contrast must fade with distance`)
        assert(glyphContrast <= tileContrast + (theme === 'light' ? 2.6 : 0.6),
          `${theme} glyph cannot outlast its tile`)
        if (tileContrast < 0.6) assert(glyphContrast < 0.8, `${theme} glyph residue`)
        previousContrast = tileContrast
        previousChroma = tileChroma
        previousGlyph = glyphContrast
      }
    }
    for (const light of [.22, .85]) {
      const torso = contrast(paint(theme, light, 0, .35, 0).tile, theme)
      const wing = contrast(paint(theme, light, 0, .35, .9).tile, theme)
      const ratio = wing / torso
      assert(ratio >= 0.45 && ratio <= 0.6, `${theme} wing ratio ${ratio.toFixed(3)} at light ${light}`)
      let previous = 1
      for (let span = 0.35; span <= 0.9; span += 0.05) {
        const coverage = paint(theme, light, 0, .35, span).coverage
        assert(coverage > 0.04 && coverage <= previous + 0.02, 'wing coverage stays continuous')
        previous = coverage
      }
    }
    for (const [light, depth, lo, hi] of [
      [.22, .35, .45, .6], [.85, .35, .15, .25], [.5, 2.5, .25, .4], [.5, 5.2, .1, .2], [.85, 5.2, .1, .2]
    ]) {
      const coverage = paint(theme, light, 0, depth).coverage
      assert(coverage >= lo && coverage <= hi,
        `${theme} glyph coverage ${coverage.toFixed(3)} at light ${light} depth ${depth}`)
    }
    assert(paint(theme, .22, 0, 2.5).coverage > paint(theme, .85, 0, 2.5).coverage,
      'shadow strokes stay denser than highlights')
    assert(glyphIndex(.2, .2, 5.2) <= glyphIndex(.2, .2, 0.35), 'distance lightens the stroke')
    assert.deepEqual(paint(theme, .4, .2, 1.7, .2), paint(theme, .4, .2, 1.7, .2))
  }
  const shoulderPose = new MantaWorld(3).animals[0]
  let best = -1, bestU = 0, bestV = 0, amber = 0, seen = 0
  for (let u = -1; u <= 1.001; u += 0.05) for (let v = 0; v <= 1.001; v += 0.05) {
    const material = mantaAppearance(u, v, shoulderPose, { x: 0, y: 0, z: -1 })
    if (material.warmth > best) { best = material.warmth; bestU = u; bestV = v }
    const tint = chroma(paint('dark', material.light, material.warmth, 0.35, Math.abs(u)).tile)
    seen++
    if (tint > 0.02) amber++
  }
  assert(Math.abs(Math.abs(bestU) - 0.4) < 0.08 && Math.abs(bestV - 0.27) < 0.08,
    `shoulder stays near the existing mark, found ${bestU.toFixed(2)},${bestV.toFixed(2)}`)
  assert(amber / seen <= 0.15, `amber covers ${(amber / seen).toFixed(3)} of the body`)
  let previousDepth = project(surface(-1, .5, shoulderPose), shoulderPose, 1440, 900).depth
  for (let u = -0.98; u <= 1; u += 0.02) {
    const depth = project(surface(u, .5, shoulderPose), shoulderPose, 1440, 900).depth
    assert(Math.abs(depth - previousDepth) < 0.45, 'depth along one pose stays continuous')
    previousDepth = depth
  }
  assert.equal(acceptsDepth(4, 3), true)
  assert.equal(acceptsDepth(4, 4), false)
  assert.equal(acceptsDepth(4, 5), false)
  assert.equal(readingMask(0), 0.14)
  assert.equal(readingMask(48), 1)
  assert(readingMask(24) > 0.14 && readingMask(24) < 1)
  assert(readingMask(-10) === 0.14 && readingMask(80) === 1)
  for (const theme of ['dark', 'light']) {
    let oldMax = 0
    for (const light of [0.2, 0.55, 1]) for (const depth of [0, 0.35, 2.5, 5.2]) {
      const transmission = Math.exp(-Math.max(0, depth) * 0.24)
      const alpha = transmission * 0.14 * (0.46 + light * 0.45)
      const neutral = theme === 'light'
        ? [168 - light * 106, 161 - light * 103, 151 - light * 98]
        : [92 + light * 144, 90 + light * 138, 108 + light * 110]
      oldMax = Math.max(oldMax, contrast(over(neutral, theme, alpha), theme))
    }
    for (const light of [0.22, 0.55, 0.85]) for (const depth of [0.35, 2.5, 5.2]) {
      for (const sample of [paint(theme, light, 0, depth), paint(theme, light, 1, depth)]) {
        const masked = Math.max(
          contrast(over(sample.tile, theme, readingMask(0)), theme),
          contrast(over(sample.glyph, theme, readingMask(0)), theme)
        )
        assert(masked <= oldMax + 0.05, `${theme} reading contrast ${masked.toFixed(2)} exceeds previous ${oldMax.toFixed(2)}`)
      }
    }
    for (const layer of [0, 1, 2]) {
      const mote = waterMote(theme, layer)
      assert.equal(mote.speed, WATER_SPEEDS[layer])
      const moteContrast = contrast(over(mote.color, theme, mote.alpha), theme)
      assert(moteContrast <= WATER_CONTRAST_CAP[layer],
        `${theme} water layer ${layer} contrast ${moteContrast.toFixed(2)}`)
      const masked = contrast(over(mote.color, theme, mote.alpha * readingMask(0)), theme)
      assert(masked < moteContrast, `${theme} water under text stays quieter`)
    }
  }
  assert.equal(waterCount(1440), 46)
  assert.equal(waterCount(390), 24)
  assert.deepEqual(WATER_SPEEDS, [0.3, 0.6, 1])
  const idle = { disposed: false, capturing: false, visible: true, hidden: false, reduced: false }
  assert.equal(sceneSchedulesAnimation(idle), true)
  assert.equal(sceneSchedulesAnimation({ ...idle, reduced: true }), false)
  assert.equal(sceneSchedulesAnimation({ ...idle, hidden: true }), false)
  assert.equal(sceneSchedulesAnimation({ ...idle, visible: false }), false)
  assert.equal(sceneSchedulesAnimation({ ...idle, capturing: true }), false)
  assert.equal(sceneSchedulesAnimation({ ...idle, disposed: true }), false)
  console.log('Depth grayscale, wing veil, reading mask and static scheduling passed')

} finally {
  rmSync(output, { recursive: true, force: true })
}
