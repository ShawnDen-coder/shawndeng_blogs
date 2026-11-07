import { useEffect, useRef } from 'react'
import { useScenePreferences } from './ScenePreferences'
import { createBudgetTracker, createSceneController, createProtectedRenderer } from './scene-runtime'
import { createCanvasRenderer, createWebGLRenderer } from './undertow-renderer'

export function UndertowScene() {
  const ref = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef(31)
  const gpuLostRef = useRef(false)
  const failedRef = useRef(false)
  const { userPaused, quality, setQuality, restricted } = useScenePreferences()
  useEffect(() => {
    const canvas = ref.current
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx = canvas?.getContext('2d') ?? null } catch { /* Keep the plain background. */ }
    if (!canvas || !ctx || typeof ResizeObserver === 'undefined') { setQuality('failed'); return }
    let disposed = false, frozen = false, ready = false
    let rects: DOMRect[] | null = null
    const budget = createBudgetTracker()
    const clear = () => ctx.clearRect(0,0,canvas.width,canvas.height)
    const pipeline = createProtectedRenderer({ ctx, reset: () => { canvas.width = canvas.width },
      fallback: () => createCanvasRenderer(innerWidth<768,quality==='low'),
      primaryFailed: () => { gpuLostRef.current = true },
      stop: () => { failedRef.current = true; setQuality('failed'); schedule() } })
    const draw = (phase: number) => {
      phaseRef.current = phase
      if (!pipeline.hasRenderer() || disposed) { clear(); return }
      if (!ready) { clear(); return }
      const result = pipeline.draw({ width:canvas.width, height:canvas.height, viewportWidth:innerWidth, viewportHeight:innerHeight, rects }, phase, document.documentElement.dataset.theme === 'dark')
      if (result !== 'drawn') return
      canvas.style.opacity=String(.34*(1-.55*Math.min(scrollY/(innerHeight*1.4),1)))
    }
    const controller = createSceneController({ request: callback => window.requestAnimationFrame(callback), cancel: id => window.cancelAnimationFrame(id), interval: () => innerWidth<768?1000/12:1000/15, initialPhase:phaseRef.current, draw, clear, now: () => performance.now(),
      onTiming: duration => { if (!failedRef.current && budget.sample(duration,innerWidth<768?4:6) && quality!=='still' && quality!=='failed') setQuality(quality==='high'?'medium':quality==='medium'?'low':'still') },
      measure: () => { const elements=Array.from(document.querySelectorAll('[data-scene-protect]')); rects=elements.map(el=>el.getBoundingClientRect()); ready=elements.length>=4 && rects.every(r=>[r.left,r.top,r.width,r.height].every(Number.isFinite)) } })
    const schedule = () => controller.update({ hidden: document.hidden, paused:userPaused, restricted, frozen, still:(quality==='still' || quality==='failed') || !pipeline.hasRenderer() })
    const measure = () => {
      if (disposed) return
      ready = false
      if (pipeline.hasRenderer()) controller.invalidate(); else clear()
    }
    const lost = () => {
      if (disposed) return
      pipeline.primaryLost(); measure(); schedule()
    }
    const resize = () => {
      ready=false; clear(); canvas.width=Math.ceil(innerWidth*Math.min(devicePixelRatio||1,1.5)); canvas.height=Math.ceil(innerHeight*Math.min(devicePixelRatio||1,1.5))
      pipeline.dispose()
      if (!failedRef.current && quality !== 'failed') {
        const scale=quality==='low'?.35:quality==='medium'||innerWidth<768?.45:.55
        let primary = null
        try { primary = gpuLostRef.current ? null : createWebGLRenderer(Math.min(1700,Math.ceil(innerWidth*scale)),Math.ceil(innerHeight*scale),lost) } catch { /* Use Canvas2D. */ }
        if (primary) pipeline.setPrimary(primary)
        else {
          gpuLostRef.current = true
          let fallback = null
          try { fallback = createCanvasRenderer(innerWidth<768,quality==='low') } catch { /* Keep the plain background. */ }
          if (fallback) pipeline.setFallback(fallback)
          else { failedRef.current = true; setQuality('failed') }
        }
      }
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
    return () => { disposed=true; controller.dispose(); pipeline.dispose(); mutation.disconnect(); observer?.disconnect(); window.removeEventListener('resize',resize); window.removeEventListener('scroll',measure); document.removeEventListener('visibilitychange',onVisibility); window.removeEventListener('scene-freeze',onFreeze); window.removeEventListener('scene-unfreeze',onUnfreeze); window.removeEventListener('scene-redraw',measure) }
  }, [userPaused,quality,restricted,setQuality])
  return <canvas ref={ref} className="scene-canvas" aria-hidden="true" />
}
