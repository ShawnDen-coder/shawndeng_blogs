import { useEffect, useRef, useState } from 'react'
import { OceanRenderer } from './renderer'

export function OceanScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    // Development-only deterministic frames for full-page animation export.
    const query = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
    const requestedTime = query?.has('oceanFrame') ? Number(query.get('oceanFrame')) : NaN
    const captureTime = Number.isFinite(requestedTime) && requestedTime >= 0 && requestedTime <= 240
      ? requestedTime : undefined
    const renderer = new OceanRenderer(ctx, captureTime !== undefined ? 62 : undefined)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      if (motion.matches) {
        pointerX = pointerY = targetX = targetY = 0
        draw()
      }
      schedule()
    }
    let width = 0
    let height = 0
    let time = captureTime ?? 3.4
    let last = 0
    let raf = 0
    let visible = true
    let disposed = false
    let pointerX = 0
    let pointerY = 0
    let targetX = 0
    let targetY = 0
    let ripple: { x: number; y: number; born: number } | undefined
    const draw = () =>
      renderer.draw(
        time,
        pointerX,
        pointerY,
        ripple ? { ...ripple, age: time - ripple.born } : undefined
      )
    const frame = (now: number) => {
      raf = 0
      if (disposed || !visible || document.hidden) return
      if (motion.matches) {
        last = 0
        return
      }
      if (!last) last = now
      const elapsed = now - last
      // Cap animation at 30 fps; large gaps never jump the animal forward.
      if (elapsed >= 1000 / 30) {
        time += Math.min(elapsed / 1000, 0.06)
        last = now
        pointerX += (targetX - pointerX) * 0.045
        pointerY += (targetY - pointerY) * 0.045
        draw()
      }
      raf = requestAnimationFrame(frame)
    }
    function schedule() {
      cancelAnimationFrame(raf)
      last = 0
      if (
        !disposed &&
        captureTime === undefined &&
        visible &&
        !document.hidden &&
        !motion.matches
      )
        raf = requestAnimationFrame(frame)
    }
    const resize = () => {
      if (disposed) return
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      if (!width || !height) return
      renderer.resize(width, height, window.devicePixelRatio || 1)
      draw()
      setReady(true)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (
        !width ||
        !height ||
        motion.matches ||
        event.pointerType === 'touch'
      )
        return
      const rect = canvas.getBoundingClientRect()
      targetX = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / width) * 2 - 1)
      )
      targetY = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / height) * 2 - 1)
      )
    }
    const onPointerLeave = () => {
      targetX = 0
      targetY = 0
    }
    const onClick = (event: MouseEvent) => {
      if (motion.matches) return
      if (
        event.target instanceof Element &&
        event.target.closest('a,button,input,textarea,select')
      )
        return
      if (window.getSelection()?.toString()) return
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      if (x < 0 || x > width || y < 0 || y > height) return
      ripple = { x, y, born: time }
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      schedule()
    })
    visibilityObserver.observe(canvas)
    motion.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', schedule)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('click', onClick)
    updateMotion()
    resize()
    // Repaint after the real font arrives; the intro never waits for the canvas.
    document.fonts.ready.then(() => {
      if (!disposed) draw()
    })
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      motion.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', schedule)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave
      )
      window.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <div className="ocean-scene">
      <div className="ocean-art" aria-hidden="true">
        <svg
          className={`ocean-fallback${ready ? ' ocean-fallback--hidden' : ''}`}
          viewBox="0 0 1000 500"
          fill="none"
        >
          <g
            transform="translate(570 220) rotate(-12)"
            stroke="#ece4da"
            strokeWidth="1.4"
            opacity=".58"
          >
            <path d="M-28-48 Q-125-60-265-100 Q-235-18-120 20 Q-55 52-20 56 L0 190 8 55 Q70 45 133 10 Q215-38 245-92 Q122-45 25-48 L20-68 11-75 9-51-9-51-12-75-22-68Z" />
            <path
              d="M-240-90 Q-100-26-15 15 M220-83 Q110-20 15 15 M-15-38 Q-25 0-12 40 M15-38 Q25 0 12 40"
              strokeDasharray="1 6"
            />
          </g>
        </svg>
        <canvas ref={canvasRef} className="ocean-canvas" />
      </div>

    </div>
  )
}
