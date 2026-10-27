import { project } from './geometry'
import { MantaWorld } from './world'
import type { MantaPose } from './world'
import { tailPoint, createFinSampler } from './motion-curves'
import type { Projected, Point3 } from './geometry'

const ACROSS = 58
const LENGTH = 25
const GLYPHS = '·:;=+*ox%#'
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
  private marks = new Float32Array(0)
  private vertices: Projected[] = []
  private dpr = 1
  private colors = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23
    return `rgb(${Math.round(92 + t * 144)} ${Math.round(90 + t * 138)} ${Math.round(108 + t * 110)})`
  })

  constructor(private ctx: CanvasRenderingContext2D, seed?: number) {
    if (seed !== undefined) this.world = new MantaWorld(seed)
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
        this.marks[index] = hash(
          Math.round((a.u * w1 + b.u * w2 + c.u * w3) * 100),
          Math.round((a.v * w1 + b.v * w2 + c.v * w3) * 80)
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
      ctx.fillStyle = `rgba(172,161,158,${0.1 + hash(i, 12) * 0.13})`
      ctx.fillText('·', x, y)
    }

    this.depth.fill(Infinity)
    this.ink.fill(0)
    for (const pose of poses ?? this.world.advance(time, width, height)) {
      const sampleSurface = createFinSampler(pose.rig.time, pose.rig.settings, pose.bank, LENGTH)
      const vertices = this.vertices
      for (let i = 0; i <= ACROSS; i++) {
        const u = (i / ACROSS) * 2 - 1
        for (let j = 0; j <= LENGTH; j++) {
          const v = j / LENGTH
          const p = project(
            sampleSurface(u, v),
            pose,
            width,
            height,
            pointerX,
            pointerY
          )
          const edge = Math.min(v, 1 - v)
          const belly = Math.exp(-u * u * 7)
          const light =
            0.31 +
            belly * 0.44 +
            0.19 * Math.sin(v * Math.PI) +
            0.11 * Math.cos(u * 2.6 + time * 0.18)
          p.light = clamp((light + (edge < 0.065 ? 0.12 : 0)) * (1 - pose.depth * .09), 0.15, 1)
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
      const stamp = (point: Point3, light: number, widthInCells = 0) => {
        const p = project(point, pose, width, height, pointerX, pointerY)
        const x = Math.floor(p.x / cell)
        const y = Math.floor(p.y / cell)
        for (let dx = -widthInCells; dx <= widthInCells; dx++) {
          if (x + dx < 0 || x + dx >= cols || y < 0 || y >= rows) continue
          const index = y * cols + x + dx
          if (p.depth > this.depth[index] + .12) continue
          this.depth[index] = p.depth - .02
          this.ink[index] = light * (1 - pose.depth * .09)
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
            1
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
        ctx.fillStyle = this.colors[Math.round(clamp(light, 0, 1) * 23)]
        ctx.globalAlpha = 0.67 + light * 0.29
        const glyph =
          GLYPHS[
            Math.min(
              GLYPHS.length - 1,
              Math.floor((light * 0.4 + noise * 0.6) * GLYPHS.length)
            )
          ]
        ctx.fillText(glyph, (col + 0.5) * cell, (row + 0.5) * cell)
      }
    }
    ctx.globalAlpha = 1
    if (ripple && ripple.age < 3) {
      const radius = 18 + ripple.age * 62
      const count = Math.max(24, Math.round(radius * 0.65))
      ctx.fillStyle = `rgba(236,228,218,${(1 - ripple.age / 3) * 0.34})`
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
