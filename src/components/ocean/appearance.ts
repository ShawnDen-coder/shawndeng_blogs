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
  const litFace = clamp((diffuse - .22) / .62, 0, 1)
  const warmth = shoulder * mottling * litFace
  return { light: clamp(light, .08, 1), warmth }
}

export type Rgb = [number, number, number]
export type OceanTheme = 'light' | 'dark'

/** Page background the transparent canvas is composited onto. */
export const PAGE_BG: Record<OceanTheme, Rgb> = {
  dark: [26, 25, 23],
  light: [245, 244, 241]
}
const SKIN: Record<OceanTheme, Rgb> = {
  dark: [236, 226, 214],
  light: [92, 84, 74]
}
const AMBER: Record<OceanTheme, Rgb> = {
  dark: [176, 92, 52],
  light: [132, 74, 46]
}
const GLYPH_INK: Record<OceanTheme, Rgb> = {
  dark: [165, 158, 150],
  light: [92, 84, 74]
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t
]
const luma = (rgb: Rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
const roundRgb = (rgb: Rgb): Rgb => [
  Math.round(clamp(rgb[0], 0, 255)),
  Math.round(clamp(rgb[1], 0, 255)),
  Math.round(clamp(rgb[2], 0, 255))
]

/** Outer wing eases from full torso strength at |u|=0.35 to 52% by |u|=0.85. */
export function membraneStrength(span: number) {
  const t = clamp((Math.abs(span) - 0.35) / 0.5, 0, 1)
  const s = t * t * (3 - 2 * t)
  return 1 - s * 0.48
}

function surfaceTone(theme: OceanTheme, light: number) {
  const lum = clamp(light, 0, 1)
  return theme === 'dark' ? 0.082 + 0.516 * lum : 0.625 - 0.4 * lum
}

function distancePresence(opticalDepth: number) {
  return Math.exp(-Math.max(0, opticalDepth) * 0.292)
}

/** Body-space hash picks a stable stroke. Farther cells use lighter glyphs. */
export function glyphIndex(light: number, mark: number, opticalDepth: number) {
  const depthEase = Math.exp(-Math.max(0, opticalDepth) * 0.2)
  const density = (1 - clamp(light, 0, 1)) * 0.84 + clamp(mark, 0, 1) * 0.16
  const t = density * (0.25 + 0.75 * depthEase)
  return Math.min(9, Math.floor(t * 10))
}

export function glyphCoverage(light: number, opticalDepth: number, span: number) {
  const lum = clamp(light, 0, 1)
  const near = 0.18 + (1 - lum) * 0.436
  const x = Math.max(0, opticalDepth - 0.35)
  const t = Math.exp(-0.0633 * x ** 2.335)
  const membrane = 0.64 + 0.36 * membraneStrength(span)
  return clamp((0.15 + (near - 0.15) * t) * membrane, 0, 0.72)
}

export type MantaPaint = { tile: Rgb; glyph: Rgb; coverage: number }

/**
 * One cell's paint. Distance moves the color toward the page background.
 * Alpha is not part of this result.
 */
export function composeMantaCell(input: {
  theme: OceanTheme
  light: number
  warmth: number
  opticalDepth: number
  span: number
}): MantaPaint {
  const theme = input.theme
  const light = clamp(input.light, 0, 1)
  const bg = PAGE_BG[theme]
  const membrane = membraneStrength(input.span)
  const mixAmt = surfaceTone(theme, light) * distancePresence(input.opticalDepth) * membrane
  let tile = mix(bg, SKIN[theme], mixAmt)
  const lit = clamp((light - 0.34) / 0.46, 0, 1)
  const tint = clamp(input.warmth, 0, 1) * lit
    * Math.exp(-Math.max(0, input.opticalDepth) * 1.15) * membrane * 0.5
  if (tint > 0) {
    const tinted = mix(tile, AMBER[theme], tint)
    const y0 = luma(tile) || 1
    const y1 = luma(tinted) || 1
    const scale = y0 / y1
    tile = [tinted[0] * scale, tinted[1] * scale, tinted[2] * scale]
  }
  const glyph = theme === 'dark'
    ? mix(bg, GLYPH_INK.dark, mixAmt * 0.9)
    : mix(bg, GLYPH_INK.light, Math.min(0.96, mixAmt * 1.06))
  return {
    tile: roundRgb(tile),
    glyph: roundRgb(glyph),
    coverage: glyphCoverage(light, input.opticalDepth, input.span)
  }
}

/** 0.14 inside a reading box, fully restored 48px outside. */
export function readingMask(distance: number) {
  const t = clamp(distance, 0, 48) / 48
  const s = t * t * (3 - 2 * t)
  return 0.14 + 0.86 * s
}

/** A strictly nearer sample wins. Equal depth keeps the earlier animal. */
export function acceptsDepth(current: number, incoming: number) {
  return incoming < current
}

export function sceneSchedulesAnimation(state: {
  disposed: boolean
  capturing: boolean
  visible: boolean
  hidden: boolean
  reduced: boolean
}) {
  return !state.disposed && !state.capturing && state.visible && !state.hidden && !state.reduced
}

export const WATER_SPEEDS = [0.3, 0.6, 1] as const
export const WATER_CONTRAST_CAP = [2, 3, 5] as const
const WATER_INK: Record<OceanTheme, Rgb> = {
  dark: [168, 162, 154],
  light: [118, 110, 102]
}
const WATER_ALPHA: Record<OceanTheme, readonly [number, number, number]> = {
  dark: [0.0268, 0.0438, 0.0748],
  light: [0.0401, 0.0651, 0.11]
}

export function waterCount(width: number) {
  return width < 600 ? 24 : 46
}

export function waterMote(theme: OceanTheme, layer: number) {
  const index = clamp(layer, 0, 2)
  return {
    color: WATER_INK[theme],
    alpha: WATER_ALPHA[theme][index],
    speed: WATER_SPEEDS[index]
  }
}
