import { project } from './geometry'
import { depthTransmission, mantaAppearance } from './appearance'
import { MantaWorld } from './world'
import type { MantaPose } from './world'
import { tailPoint, createFinSampler } from './motion-curves'
import type { Projected, Point3 } from './geometry'

const ACROSS = 58
const LENGTH = 25
const GLYPHS = '·:;=+*ox%#'
export type ReadingArea = { left: number; top: number; right: number; bottom: number }
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

/** Canvas software projection/rasterization, no WebGL or external artwork. */
export class OceanRenderer {
  private world = new MantaWorld()
  private width = 0
  private height = 0
  private cell = 7
  private cols = 0
  private rows = 0
  private depth = new Float32Array(0)
  private ink = new Float32Array(0)
  private warmth = new Float32Array(0)
  private marks = new Float32Array(0)
  private vertices: Projected[] = []
  private points: Point3[] = []
  private readingAreas: ReadingArea[] = []
  private legibility = new Float32Array(0)
  private dpr = 1
  private colors: string[][] = []
  private tiles: string[][] = []
  private theme: 'light' | 'dark' = 'dark'

  constructor(private ctx: CanvasRenderingContext2D, seed?: number) {
    if (seed !== undefined) this.world = new MantaWorld(seed)
    this.setTheme('dark')
  }

  setTheme(theme: 'light' | 'dark') {
    this.theme = theme
    this.colors = Array.from({ length: 24 }, (_, i) => {
      const light = i / 23
      // Light paper needs darker ink; retain the shoulder tint and depth layers.
      const neutral = theme === 'light'
        ? [168 - light * 106, 161 - light * 103, 151 - light * 98]
        : [92 + light * 144, 90 + light * 138, 108 + light * 110]
      const amber = theme === 'light'
        ? [180 - light * 44, 132 - light * 74, 99 - light * 65]
        : [100 + light * 132, 59 + light * 102, 56 + light * 62]
      return Array.from({ length: 12 }, (_, j) => {
        const tint = j / 11
        return `rgb(${neutral.map((value, channel) => Math.round(value + (amber[channel] - value) * tint)).join(' ')})`
      })
    })
    this.tiles = Array.from({ length: 24 }, (_, i) => {
      const light = i / 23
      const neutral = theme === 'light'
        ? [64 + light * 100, 61 + light * 97, 56 + light * 94]
        : [52 + light * 184, 51 + light * 177, 50 + light * 168]
      const amber = theme === 'light' ? [170, 106, 67] : [220, 146, 91]
      return Array.from({ length: 12 }, (_, j) => `rgb(${neutral.map((value, channel) =>
        Math.round(value + (amber[channel] - value) * j / 11)).join(' ')})`)
    })
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width
    this.height = height
    this.dpr = Math.min(dpr, 1.75)
    this.ctx.canvas.width = Math.round(width * this.dpr)
    this.ctx.canvas.height = Math.round(height * this.dpr)
    this.cell = width < 600 ? 5.5 : 7
    this.cols = Math.ceil(width / this.cell)
    this.rows = Math.ceil(height / this.cell)
    this.depth = new Float32Array(this.cols * this.rows)
    this.ink = new Float32Array(this.depth.length)
    this.marks = new Float32Array(this.depth.length)
    this.warmth = new Float32Array(this.depth.length)
    this.legibility = new Float32Array(this.depth.length)
    this.setReadingAreas(this.readingAreas)
  }

  setReadingAreas(areas: ReadingArea[]) {
    this.readingAreas = areas
    for (let row = 0; row < this.rows; row++) for (let col = 0; col < this.cols; col++) {
      const x = (col + .5) * this.cell, y = (row + .5) * this.cell
      let opacity = 1
      for (const area of areas) {
        const distance = Math.hypot(Math.max(area.left - x, 0, x - area.right),
          Math.max(area.top - y, 0, y - area.bottom))
        const t = Math.min(1, distance / 48)
        opacity = Math.min(opacity, .14 + .86 * t * t * (3 - 2 * t))
      }
      this.legibility[row * this.cols + col] = opacity
    }
  }

  disturb(x: number, y: number) {
    if (this.width && this.height) this.world.disturb(x / this.width, y / this.height)
  }

  private triangle(a: Projected, b: Projected, c: Projected) {
    const cell = this.cell
    const minX = clamp(
      Math.floor(Math.min(a.x, b.x, c.x) / cell),
      0,
      this.cols - 1
    )
    const maxX = clamp(
      Math.ceil(Math.max(a.x, b.x, c.x) / cell),
      0,
      this.cols - 1
    )
    const minY = clamp(
      Math.floor(Math.min(a.y, b.y, c.y) / cell),
      0,
      this.rows - 1
    )
    const maxY = clamp(
      Math.ceil(Math.max(a.y, b.y, c.y) / cell),
      0,
      this.rows - 1
    )
    const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
    if (Math.abs(denominator) < 0.01) return
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = (x + 0.5) * cell
        const py = (y + 0.5) * cell
        const w1 =
          ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / denominator
        const w2 =
          ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / denominator
        const w3 = 1 - w1 - w2
        if (w1 < -0.001 || w2 < -0.001 || w3 < -0.001) continue
        const depth = a.depth * w1 + b.depth * w2 + c.depth * w3
        const index = y * this.cols + x
        if (depth >= this.depth[index]) continue
        this.depth[index] = depth
        this.ink[index] = a.light * w1 + b.light * w2 + c.light * w3
        this.warmth[index] = a.warmth * w1 + b.warmth * w2 + c.warmth * w3
        this.marks[index] = hash(
          Math.round((a.u * w1 + b.u * w2 + c.u * w3) * 20),
          Math.round((a.v * w1 + b.v * w2 + c.v * w3) * 16)
        )
      }
    }
  }

  draw(
    time: number,
    pointerX = 0,
    pointerY = 0,
    ripple?: { x: number; y: number; age: number },
    poses?: MantaPose[]
  ) {
    const { ctx, width, height, cell, cols, rows } = this
    if (!width || !height) return
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `400 ${Math.round(cell * 1.1)}px "JetBrains Mono", monospace`

    // Sparse suspended particles make distance visible without a permanent star field.
    for (let i = 0; i < 46; i++) {
      const x =
        ((hash(i, 4) + time * (0.0008 + hash(i, 7) * 0.0005)) % 1) * width
      const y = ((hash(i, 9) - time * 0.0015 + 10) % 1) * height * 0.94
      ctx.fillStyle = `rgba(${this.theme === 'light' ? '100,91,79' : '172,161,158'},${0.1 + hash(i, 12) * 0.13})`
      ctx.fillText('·', x, y)
    }

    this.depth.fill(Infinity)
    this.ink.fill(0)
    this.warmth.fill(0)
    for (const pose of poses ?? this.world.advance(time, width, height)) {
      const sampleSurface = createFinSampler(pose.rig.phaseTime ?? pose.rig.time, pose.rig.settings, pose.bank, LENGTH)
      const vertices = this.vertices
      const points = this.points
      for (let i = 0; i <= ACROSS; i++) for (let j = 0; j <= LENGTH; j++)
        points[i * (LENGTH + 1) + j] = sampleSurface(i / ACROSS * 2 - 1, j / LENGTH)
      for (let i = 0; i <= ACROSS; i++) {
        const u = (i / ACROSS) * 2 - 1
        for (let j = 0; j <= LENGTH; j++) {
          const v = j / LENGTH
          const p = project(
            points[i * (LENGTH + 1) + j],
            pose,
            width,
            height,
            pointerX,
            pointerY
          )
          const left = points[Math.max(0, i - 1) * (LENGTH + 1) + j]
          const right = points[Math.min(ACROSS, i + 1) * (LENGTH + 1) + j]
          const front = points[i * (LENGTH + 1) + Math.max(0, j - 1)]
          const back = points[i * (LENGTH + 1) + Math.min(LENGTH, j + 1)]
          const du = { x: right.x - left.x, y: right.y - left.y, z: right.z - left.z }
          const dv = { x: back.x - front.x, y: back.y - front.y, z: back.z - front.z }
          const appearance = mantaAppearance(u, v, pose, {
            x: du.y * dv.z - du.z * dv.y,
            y: du.z * dv.x - du.x * dv.z,
            z: du.x * dv.y - du.y * dv.x
          })
          p.light = appearance.light
          p.warmth = appearance.warmth
          p.u = u
          p.v = v
          vertices[i * (LENGTH + 1) + j] = p
        }
      }
      for (let i = 0; i < ACROSS; i++) {
        for (let j = 0; j < LENGTH; j++) {
          const a = vertices[i * (LENGTH + 1) + j]
          const b = vertices[(i + 1) * (LENGTH + 1) + j]
          const c = vertices[i * (LENGTH + 1) + j + 1]
          const d = vertices[(i + 1) * (LENGTH + 1) + j + 1]
          this.triangle(a, b, c)
          this.triangle(b, c, d)
        }
      }

      // Cephalic fins, tapering tail and five pairs of ventral gills make the silhouette a manta.
      const stamp = (point: Point3, light: number, widthInCells = 0, warmth = 0) => {
        const p = project(point, pose, width, height, pointerX, pointerY)
        const x = Math.floor(p.x / cell)
        const y = Math.floor(p.y / cell)
        for (let dx = -widthInCells; dx <= widthInCells; dx++) {
          if (x + dx < 0 || x + dx >= cols || y < 0 || y >= rows) continue
          const index = y * cols + x + dx
          if (p.depth > this.depth[index] + .12) continue
          this.depth[index] = p.depth - .02
          this.ink[index] = light
          this.warmth[index] = warmth
          this.marks[index] = 0.5
        }
      }
      for (let i = 0; i < 90; i++) {
        const t = i / 89
        stamp(
          tailPoint(t, pose.rig.time, pose.rig.settings, pose.rig.headingHistory),
          0.5 - t * 0.22
        )
      }
      for (const side of [-1, 1]) {
        for (let i = 0; i < 24; i++) {
          const t = i / 23
          stamp(
            {
              x: side * (0.16 + Math.sin(t * Math.PI) * 0.045),
              y: -0.035 + t * 0.065,
              z: -0.6 - t * 0.32
            },
            0.74,
            1,
            .45
          )
        }
        for (let gill = 0; gill < 5; gill++) {
          for (let i = 0; i < 16; i++) {
            const t = i / 15
            stamp(
              {
                x: side * (0.095 + t * (0.19 - gill * 0.018)),
                y: -0.205,
                z: -0.33 + gill * 0.105 + Math.sin(t * Math.PI) * 0.04
              },
              0.045
            )
          }
        }
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col
        if (this.depth[index] === Infinity) continue
        const light = this.ink[index]
        if (light < 0.1) continue
        const noise = this.marks[index]
        const transmission = depthTransmission(this.depth[index] - 6)
        const visibility = transmission * this.legibility[index]
        const tone = Math.round(clamp(light, 0, 1) * 23)
        const tint = Math.round(clamp(this.warmth[index] * transmission, 0, 1) * 11)
        const x = col * cell, y = row * cell
        // A quiet tonal tile establishes volume; the glyph adds surface detail.
        ctx.fillStyle = this.tiles[tone][tint]
        ctx.globalAlpha = visibility * (this.theme === 'light' ? .12 + (1 - light) * .18 : .12 + light * .28)
        ctx.fillRect(x + .6, y + .6, cell - 1.2, cell - 1.2)
        ctx.fillStyle = this.colors[tone][tint]
        ctx.globalAlpha = visibility * (.46 + light * .45)
        const glyph =
          GLYPHS[
            Math.min(
              GLYPHS.length - 1,
              Math.floor((light * .88 + noise * .12) * (.45 + transmission * .55) * GLYPHS.length)
            )
          ]
        ctx.fillText(glyph, (col + 0.5) * cell, (row + 0.5) * cell)
      }
    }
    ctx.globalAlpha = 1
    if (ripple && ripple.age < 3) {
      const radius = 18 + ripple.age * 62
      const count = Math.max(24, Math.round(radius * 0.65))
      ctx.fillStyle = `rgba(${this.theme === 'light' ? '73,64,52' : '236,228,218'},${(1 - ripple.age / 3) * 0.34})`
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        ctx.fillText(
          '·',
          ripple.x + Math.cos(angle) * radius,
          ripple.y + Math.sin(angle) * radius * 0.46
        )
      }
    }
  }
}
