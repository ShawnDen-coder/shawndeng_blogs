type MotionState = { hidden: boolean; paused: boolean; restricted: boolean; frozen: boolean; still: boolean }
type LoopOptions = { request: (callback: FrameRequestCallback) => number; cancel: (id: number) => void; draw: (phase: number) => void; interval: () => number; initialPhase: number }
export function createSceneLoop(options: LoopOptions) {
  let frame = 0, last: number | null = null, phase = options.initialPhase, disposed = false
  let state: MotionState = { hidden: true, paused: false, restricted: false, frozen: false, still: false }
  const allowed = () => !disposed && !state.hidden && !state.paused && !state.restricted && !state.frozen && !state.still
  const tick = (now: number) => {
    frame = 0
    if (!allowed()) return
    if (last === null || now - last >= options.interval()) {
      if (last !== null) phase += Math.min((now - last) / 1000, .1) * .808
      last = now
      options.draw(phase)
    }
    if (allowed()) frame = options.request(tick)
  }
  return {
    update(next: MotionState) {
      state = next
      if (frame) options.cancel(frame)
      frame = 0; last = null
      if (allowed()) frame = options.request(tick)
    },
    dispose() { disposed = true; if (frame) options.cancel(frame); frame = 0 },
    phase() { return phase }
  }
}
type Rect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
type PaintOptions = { width: number; height: number; viewportWidth: number; viewportHeight: number; rects: Rect[] | null; paint: () => void }
export function paintProtected(ctx: CanvasRenderingContext2D, options: PaintOptions) {
  const { width, height, viewportWidth, viewportHeight, rects, paint } = options
  ctx.clearRect(0, 0, width, height)
  if (!rects?.length || !viewportWidth || !viewportHeight || rects.some(r => ![r.left,r.top,r.width,r.height].every(Number.isFinite))) return false
  try {
    paint()
    ctx.save(); ctx.scale(width / viewportWidth, height / viewportHeight); ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = .985
    ctx.shadowColor = 'black'; ctx.shadowBlur = 48
    for (const r of rects) ctx.fillRect(r.left - 24, r.top - 24, r.width + 48, r.height + 48)
    ctx.restore()
    return true
  } catch {
    ctx.clearRect(0, 0, width, height)
    return false
  }
}
export function selectRenderer<T>(primary: () => T | null, fallback: () => T | null): T | null {
  try { const result = primary(); if (result) return result } catch { /* Try the lower-cost renderer. */ }
  try { return fallback() } catch { return null }
}
export function createBudgetTracker() {
  let samples: number[] = [], over = 0
  return { sample(duration: number, budget: number) {
    samples.push(duration)
    if (samples.length < 60) return false
    samples.sort((a,b) => a-b)
    over = samples[56] > budget ? over + 1 : 0
    samples = []
    if (over < 2) return false
    over = 0
    return true
  } }
}
type RenderTarget = { draw: (ctx: CanvasRenderingContext2D, width: number, height: number, phase: number, dark: boolean) => void; destroy: () => void }
type Geometry = Omit<PaintOptions, 'paint'>
export function createProtectedRenderer(options: { ctx: CanvasRenderingContext2D; reset: () => void; fallback: () => RenderTarget | null; stop: () => void; primaryFailed?: () => void }) {
  let current: RenderTarget | null = null, primary = false, terminal = false
  const destroy = () => { const previous = current; current = null; try { previous?.destroy() } catch { /* Continue to the safe fallback. */ } }
  const fail = () => { terminal = true; destroy(); options.reset(); options.stop() }
  const fallback = () => {
    if (terminal) return
    destroy(); options.reset(); options.primaryFailed?.()
    try { current = options.fallback() } catch { current = null }
    primary = false
    if (!current) fail()
  }
  return {
    setPrimary(renderer: RenderTarget) { destroy(); if (!terminal) { current=renderer; primary=true } else renderer.destroy() },
    setFallback(renderer: RenderTarget) { destroy(); if (!terminal) { current=renderer; primary=false } else renderer.destroy() },
    hasRenderer() { return current !== null && !terminal },
    primaryLost() { if (current && primary) fallback() },
    draw(geometry: Geometry, phase: number, dark: boolean): 'unready' | 'drawn' | 'failed' {
      const { rects, viewportWidth, viewportHeight } = geometry
      if (!rects?.length || !viewportWidth || !viewportHeight || rects.some(r => ![r.left,r.top,r.width,r.height].every(Number.isFinite))) {
        options.ctx.clearRect(0,0,geometry.width,geometry.height); return 'unready'
      }
      if (!current || terminal) return 'failed'
      const attempt = () => {
        const active = current!
        try { return paintProtected(options.ctx, { ...geometry, paint: () => active.draw(options.ctx,geometry.width,geometry.height,phase,dark) }) } catch { return false }
      }
      if (attempt()) return 'drawn'
      if (primary) { fallback(); if (current && attempt()) return 'drawn' }
      if (!terminal) fail()
      return 'failed'
    },
    dispose() { destroy() }
  }
}
