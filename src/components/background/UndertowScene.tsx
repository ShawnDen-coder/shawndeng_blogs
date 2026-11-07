import { useEffect, useRef } from 'react'
import { useScenePreferences } from './ScenePreferences'
import { createBudgetTracker, createSceneLoop, paintProtected, selectRenderer } from './scene-runtime'
import { createCanvasRenderer, createWebGLRenderer, type UndertowRenderer } from './undertow-renderer'

export function UndertowScene() {
  const ref = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef(31)
  const gpuLostRef = useRef(false)
  const { userPaused, quality, setQuality, restricted } = useScenePreferences()
  useEffect(() => {
    const canvas = ref.current
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx = canvas?.getContext('2d') ?? null } catch { /* Keep the plain background. */ }
    if (!canvas || !ctx || typeof ResizeObserver === 'undefined') { setQuality('still'); return }
    let renderer: UndertowRenderer | null = null, disposed = false, frozen = false, ready = false
    let rects: DOMRect[] | null = null
    const budget = createBudgetTracker()
    const clear = () => ctx.clearRect(0,0,canvas.width,canvas.height)
    const draw = (phase: number, timed = false) => {
      phaseRef.current = phase
      if (!ready || !renderer || disposed) { clear(); return }
      const start = performance.now(), active = renderer
      paintProtected(ctx, { width:canvas.width, height:canvas.height, viewportWidth:innerWidth, viewportHeight:innerHeight, rects,
        paint: () => active.draw(ctx,canvas.width,canvas.height,phase,document.documentElement.dataset.theme === 'dark') })
      canvas.style.opacity=String(.34*(1-.55*Math.min(scrollY/(innerHeight*1.4),1)))
      if (timed && budget.sample(performance.now()-start, innerWidth<768?4:6)) setQuality(quality==='high'?'medium':quality==='medium'?'low':'still')
    }
    const loop = createSceneLoop({ request: callback => window.requestAnimationFrame(callback), cancel: id => window.cancelAnimationFrame(id), interval: () => innerWidth<768?1000/12:1000/15, initialPhase:phaseRef.current, draw: phase => draw(phase,true) })
    const schedule = () => loop.update({ hidden: document.hidden, paused:userPaused, restricted, frozen, still:quality==='still' || !renderer })
    const measure = () => {
      if (disposed) return
      const elements = Array.from(document.querySelectorAll('[data-scene-protect]'))
      rects = elements.map(el => el.getBoundingClientRect())
      ready = elements.length >= 4 && rects.every(r => [r.left,r.top,r.width,r.height].every(Number.isFinite))
      draw(loop.phase())
    }
    const fallback = () => createCanvasRenderer(innerWidth<768,quality==='low')
    const lost = () => {
      if (disposed) return
      gpuLostRef.current = true; renderer?.destroy(); renderer = null; clear()
      renderer = selectRenderer(() => null, fallback)
      if (!renderer) setQuality('still')
      measure(); schedule()
    }
    const resize = () => {
      ready=false; clear(); canvas.width=Math.ceil(innerWidth*Math.min(devicePixelRatio||1,1.5)); canvas.height=Math.ceil(innerHeight*Math.min(devicePixelRatio||1,1.5))
      renderer?.destroy(); renderer=null
      const scale=quality==='low'?.35:quality==='medium'||innerWidth<768?.45:.55
      renderer=selectRenderer(() => gpuLostRef.current ? null : createWebGLRenderer(Math.min(1700,Math.ceil(innerWidth*scale)),Math.ceil(innerHeight*scale),lost),fallback)
      if (!renderer) setQuality('still')
      measure(); schedule()
    }
    const onFreeze=()=>{frozen=true;schedule()}, onUnfreeze=()=>{frozen=false;measure();schedule()}, onVisibility=()=>schedule()
    resize()
    window.addEventListener('resize',resize); window.addEventListener('scroll',measure,{passive:true}); document.addEventListener('visibilitychange',onVisibility)
    window.addEventListener('scene-freeze',onFreeze); window.addEventListener('scene-unfreeze',onUnfreeze); window.addEventListener('scene-redraw',measure)
    const mutation = new MutationObserver(measure); mutation.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    const observer = new ResizeObserver(measure)
    document.querySelectorAll('[data-scene-protect]').forEach(element => observer?.observe(element))
    document.fonts?.ready.then(()=>{if(!disposed) measure()})
    return () => { disposed=true; loop.dispose(); renderer?.destroy(); mutation.disconnect(); observer?.disconnect(); window.removeEventListener('resize',resize); window.removeEventListener('scroll',measure); document.removeEventListener('visibilitychange',onVisibility); window.removeEventListener('scene-freeze',onFreeze); window.removeEventListener('scene-unfreeze',onUnfreeze); window.removeEventListener('scene-redraw',measure) }
  }, [userPaused,quality,restricted,setQuality])
  return <canvas ref={ref} className="scene-canvas" aria-hidden="true" />
}
