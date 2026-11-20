import { useEffect, useRef, useState } from 'react'
import { applyTheme, isThemePreference, themeStorageKey, type ThemePreference } from '../lib/theme'

// A single stepped outline grows from the control. Unlike a mask made of
// hundreds of individual tiles, its geometry stays fixed throughout the reveal.
function revealTiles(x: number, y: number) {
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.5
  const outline = [
    [-.3,-1], [.3,-1], [.3,-.85], [.6,-.85], [.6,-.6], [.85,-.6], [.85,-.3], [1,-.3],
    [1,.3], [.85,.3], [.85,.6], [.6,.6], [.6,.85], [.3,.85], [.3,1], [-.3,1],
    [-.3,.85], [-.6,.85], [-.6,.6], [-.85,.6], [-.85,.3], [-1,.3], [-1,-.3], [-.85,-.3],
    [-.85,-.6], [-.6,-.6], [-.6,-.85], [-.3,-.85]
  ]
  const polygon = (scale: number) => `polygon(${outline.map(([dx, dy]) => `${x + dx * scale}px ${y + dy * scale}px`).join(',')})`
  return document.documentElement.animate(
    [{ clipPath: polygon(0) }, { clipPath: polygon(radius) }],
    { duration: 560, easing: 'linear', fill: 'both', pseudoElement: '::view-transition-new(root)' }
  )
}

export function useThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>('system')
  const sequence = useRef(0)
  const active = useRef<ViewTransition | null>(null)
  const animation = useRef<Animation | null>(null)

  const cancel = () => {
    animation.current?.cancel()
    animation.current = null
    active.current?.skipTransition()
    active.current = null
  }

  useEffect(() => {
    let current: ThemePreference = 'system'
    try {
      const stored = localStorage.getItem(themeStorageKey)
      if (isThemePreference(stored)) current = stored
    } catch { /* Storage is optional. */ }
    const sync = (next: ThemePreference) => {
      ++sequence.current
      cancel()
      setPreference(next)
      applyTheme(next)
    }
    sync(current)
    const onStorage = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null)
        sync(isThemePreference(event.newValue) ? event.newValue : 'system')
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      ++sequence.current
      cancel()
    }
  }, [])

  useEffect(() => {
    if (preference !== 'system') return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      ++sequence.current
      cancel()
      applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const targetColor = useRef('light')
  const change = (next: ThemePreference, button: HTMLElement) => {
    const id = ++sequence.current
    setPreference(next)
    try { localStorage.setItem(themeStorageKey, next) } catch { /* Optional persistence. */ }
    const target = next === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : next
    targetColor.current = target
    if (active.current || target === document.documentElement.dataset.theme ||
      matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition ||
      !CSS.supports('clip-path', 'polygon(0 0, 1px 0, 1px 1px)')) {
      cancel()
      applyTheme(next)
      return
    }
    const bounds = button.getBoundingClientRect()
    const apply = () => { if (sequence.current === id) applyTheme(next) }
    try {
      const transition = document.startViewTransition(apply)
      active.current = transition
      transition.ready.then(() => {
        if (sequence.current === id) {
          animation.current = revealTiles(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
          return animation.current.finished
        }
      }).catch(() => { transition.skipTransition(); apply() })
      transition.finished.catch(apply).finally(() => {
        if (sequence.current === id) {
          // A filled WAAPI animation remains registered after it finishes.
          animation.current?.cancel()
          animation.current = null
          active.current = null
        }
      })
    } catch { apply() }
  }

  return {
    preference,
    toggle(button: HTMLElement) {
      const theme = active.current ? targetColor.current : document.documentElement.dataset.theme
      change(theme === 'dark' ? 'light' : 'dark', button)
    },
    reset(button: HTMLElement) { change('system', button) }
  }
}

export function ThemeIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <g className="theme-sun"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></g>
      <path className="theme-moon" d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>
    </svg>
  )
}
