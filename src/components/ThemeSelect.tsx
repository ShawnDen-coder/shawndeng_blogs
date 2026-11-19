import { useEffect, useRef, useState } from 'react'
import { applyTheme, isThemePreference, themeStorageKey, type ThemePreference } from '../lib/theme'

// Each frame reveals whole tiles of the incoming snapshot. Cap the tile count
// on large screens so the mask stays small even on ultrawide displays.
function revealTiles(x: number, y: number) {
  const size = Math.max(38, Math.ceil(Math.sqrt(innerWidth * innerHeight / 500)))
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const buckets = Array.from({ length: 20 }, () => [] as string[])
  for (let top = 0; top < innerHeight; top += size) {
    for (let left = 0; left < innerWidth; left += size) {
      const distance = Math.hypot(left + size / 2 - x, top + size / 2 - y) / radius
      const frame = Math.min(buckets.length - 1, Math.floor((distance * 0.82 + Math.random() * 0.18) * buckets.length))
      buckets[frame].push(`M${left} ${top}h${size}v${size}h-${size}z`)
    }
  }
  let path = 'M0 0'
  const frames = [{ clipPath: `path('${path}')`, easing: 'steps(1, end)' }]
  for (const bucket of buckets) {
    path += bucket.join('')
    frames.push({ clipPath: `path('${path}')`, easing: 'steps(1, end)' })
  }
  return document.documentElement.animate(frames, { duration: 560, fill: 'both', pseudoElement: '::view-transition-new(root)' })
}

export function useThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>('system')
  const sequence = useRef(0)
  const active = useRef<ViewTransition | null>(null)

  useEffect(() => {
    let current: ThemePreference = 'system'
    try {
      const stored = localStorage.getItem(themeStorageKey)
      if (isThemePreference(stored)) current = stored
    } catch { /* Storage is optional. */ }
    const sync = (next: ThemePreference) => {
      ++sequence.current
      active.current?.skipTransition()
      active.current = null
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
      active.current?.skipTransition()
    }
  }, [])

  useEffect(() => {
    if (preference !== 'system') return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      ++sequence.current
      active.current?.skipTransition()
      active.current = null
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
      !CSS.supports('clip-path', 'path("M0 0h1v1z")')) {
      active.current?.skipTransition()
      active.current = null
      applyTheme(next)
      return
    }
    const bounds = button.getBoundingClientRect()
    const apply = () => { if (sequence.current === id) applyTheme(next) }
    try {
      const transition = document.startViewTransition(apply)
      active.current = transition
      transition.ready.then(() => {
        if (sequence.current === id) return revealTiles(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2).finished
      }).catch(() => { transition.skipTransition(); apply() })
      transition.finished.catch(apply).finally(() => { if (sequence.current === id) active.current = null })
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
