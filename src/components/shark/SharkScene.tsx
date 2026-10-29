import { useEffect, useRef, useState } from 'react'

// Shape adapted from stackedlol/ascii-sharks, a0074c16a106f0abc665fe9712ca445f8f98ad8e.
const shark = `                            ;'
                                 %%'
                                  .t;.               .oooo
                                   S;:S%              %8S8.
                                    ;:tt%t '..        XX%%S
     t'                            ''XSSS8SSX%XX8#.    %XSX%
      :;'               ;.''X8%8XX%%S%%S%SStt%tSX8S#X8't%ttt.
       ::%'       ''8XXXSSt%Stttttt%8@%%@%8@8%Sttt%%%%SSSSS%tt.
       'SXXtt%t%%%S%:;StS%ttSS%tSXSt88@@%8%@8%tStS%%X%SS%%S%;;t
      .@##88#@...'@@@@#@8@88X88#XXXSX8SX88SX8%SS%S%%S88St%t%%%.
       %;%t             :.    '.'##@###@X#888XX##8@@@#.X%XS%.
      .%t                            ;%%%#@@##@@@.     SXS%%
      t.                            .%;%%%.            %%XXS
                                  '%t:t              .SXSS'
                                 '::.                ooooo
                                .S'`
const lines = shark.split('\n')

export function SharkScene({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, last = 0, time = 0, stopped = false, frozen = false
    let samples: number[] = [], reducedCount = false
    const draw = () => {
      const start = performance.now(), w = innerWidth, h = innerHeight
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {
        canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h)
      const dark = document.documentElement.dataset.theme === 'dark'
      const mobile = w <= 640
      const areas = Array.from(document.querySelectorAll('.site-header, .ocean-intro, .site-footer')).map(el => el.getBoundingClientRect())
      const fishes = mobile || reducedCount ? [[.77,.18,mobile ? 180 : 320,.37]] : [[.83,.67,150,.04],[.79,.51,230,.18],[.72,.30,320,.37]]
      for (const [x,y,size,alpha] of fishes) {
        const step = size / 64, line = step * 1.35
        ctx.font = `${Math.max(3,step*1.7)}px monospace`; ctx.textBaseline = 'middle'
        for (let row=0; row<lines.length; row++) for (let col=0; col<lines[row].length; col++) {
          const char = lines[row][col]; if (char === ' ') continue
          const px = x*w-size/2+col*step + Math.sin(time*.24+y*8)*12
          const py = y*h-lines.length*line/2+row*line + Math.sin(time*.3+x*7)*5
          let protection = 1
          for (const a of areas) {
            const dx = Math.max(a.left-px, 0, px-a.right), dy = Math.max(a.top-py, 0, py-a.bottom)
            const distance = Math.hypot(dx,dy)
            protection = Math.min(protection, distance <= 24 ? .14 : Math.min(1,.14+(distance-24)/48*.86))
          }
          // A lit back and a near-invisible underside, with no colored trails.
          const light = .3 + .7*(1-row/lines.length)
          ctx.fillStyle = dark ? `rgba(255,247,240,${alpha*light*protection})` : `rgba(38,37,35,${alpha*light*protection})`
          ctx.fillText(char, px, py)
        }
      }
      setReady(true)
      samples.push(performance.now()-start)
      if (samples.length >= 60) {
        const p95 = [...samples].sort((a,b)=>a-b)[56]; samples = []
        if (p95 > (mobile ? 4 : 6)) { if (!mobile && !reducedCount) reducedCount = true; else { stopped = true; setReady(false) } }
      }
    }
    const schedule = () => {
      cancelAnimationFrame(frame); last = 0
      if (!paused && !stopped && !frozen && !document.hidden && !motion.matches && innerWidth > 340 && !(innerWidth <= 640 && (innerHeight < 700 || innerWidth > innerHeight))) frame = requestAnimationFrame(tick)
    }
    const tick = (now: number) => {
      if (now-last >= 1000/(innerWidth<=640?20:30)) { time += last ? Math.min((now-last)/1000,.06) : 0; last=now; draw() }
      if (!stopped) frame=requestAnimationFrame(tick)
    }
    const update = () => { draw(); schedule() }
    const freeze = () => { frozen = true; schedule() }
    const unfreeze = () => { frozen = false; update() }
    const observer = new MutationObserver(() => draw())
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    window.addEventListener('resize',update); window.addEventListener('scroll',update); document.addEventListener('visibilitychange',schedule)
    window.addEventListener('scene-redraw',draw); window.addEventListener('scene-freeze',freeze); window.addEventListener('scene-unfreeze',unfreeze); motion.addEventListener('change',update)
    try { update() } catch { setReady(false); stopped = true }
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize',update); window.removeEventListener('scroll',update); document.removeEventListener('visibilitychange',schedule); window.removeEventListener('scene-redraw',draw); window.removeEventListener('scene-freeze',freeze); window.removeEventListener('scene-unfreeze',unfreeze); motion.removeEventListener('change',update) }
  }, [paused])
  return <div className="shark-scene" aria-hidden="true"><pre className={`shark-fallback ${ready ? 'shark-fallback--hidden' : ''}`}>{shark}</pre><canvas ref={ref} style={{ visibility: ready ? 'visible' : 'hidden' }} /></div>
}
