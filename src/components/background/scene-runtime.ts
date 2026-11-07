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
