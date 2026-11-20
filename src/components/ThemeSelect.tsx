import { useEffect, useRef, useState } from 'react'
import { applyTheme, isThemePreference, themeStorageKey, type ThemePreference } from '../lib/theme'
import { makeTileMask } from '../lib/theme-reveal'

// The mask is generated once, rather than rebuilding a growing path each frame.
// Its discrete SVG animations reveal the new snapshot in 48px squares.
function tileMask(x: number, y: number, width: number, height: number) {
  const svg = makeTileMask(x, y, width, height)
  const style = document.createElement('style')
  style.dataset.themeReveal = ''
  style.textContent = `::view-transition-new(root){mask-image:url("data:image/svg+xml,${encodeURIComponent(svg)}");mask-size:${width}px ${height}px;mask-repeat:no-repeat}`
  document.head.appendChild(style)
  return style
}

export function useThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>('system')
  const sequence = useRef(0)
  const active = useRef<ViewTransition | null>(null)
  const animation = useRef<Animation | null>(null)
  const mask = useRef<HTMLStyleElement | null>(null)
  const requested = useRef<ThemePreference>('system')
  const suppression = useRef<HTMLStyleElement | null>(null)
  const suppressionFrame = useRef<number | null>(null)

  const clearSuppression = () => {
    if (suppressionFrame.current !== null) cancelAnimationFrame(suppressionFrame.current)
    suppressionFrame.current = null
    suppression.current?.remove()
    suppression.current = null
  }

  const applyWithoutTransition = (next: ThemePreference) => {
    clearSuppression()
    const style = document.createElement('style')
    style.dataset.themeTransitionSuppression = ''
    style.textContent = '*, *::before, *::after { transition: none !important; }'
    document.head.appendChild(style)
    suppression.current = style
    applyTheme(next)
    // Resolve the new colors while transitions are disabled, before the new
    // view-transition snapshot is captured or normal transitions resume.
    void getComputedStyle(document.body).color
    suppressionFrame.current = requestAnimationFrame(clearSuppression)
  }

  const cancel = () => {
    animation.current?.cancel()
    animation.current = null
    active.current?.skipTransition()
    active.current = null
    mask.current?.remove()
    mask.current = null
  }

  useEffect(() => {
    let current: ThemePreference = 'system'
    try {
      const stored = localStorage.getItem(themeStorageKey)
      if (isThemePreference(stored)) current = stored
    } catch { /* Storage is optional. */ }
    const sync = (next: ThemePreference) => {
      ++sequence.current
      requested.current = next
      cancel()
      setPreference(next)
      applyWithoutTransition(next)
    }
    sync(current)
    const onStorage = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null)
        sync(isThemePreference(event.newValue) ? event.newValue : 'system')
    }
    window.addEventListener('storage', onStorage)
    const onResize = () => {
      if (!active.current) return
      ++sequence.current
      cancel()
      applyWithoutTransition(requested.current)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('resize', onResize)
      ++sequence.current
      cancel()
      clearSuppression()
    }
  }, [])

  useEffect(() => {
    if (preference !== 'system') return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      ++sequence.current
      cancel()
      applyWithoutTransition('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const targetColor = useRef('light')
  const change = (next: ThemePreference, button: HTMLElement) => {
    const id = ++sequence.current
    requested.current = next
    setPreference(next)
    try { localStorage.setItem(themeStorageKey, next) } catch { /* Optional persistence. */ }
    const target = next === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : next
    targetColor.current = target
    if (active.current || target === document.documentElement.dataset.theme ||
      matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition ||
      !CSS.supports('mask-image', 'url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22/%3E")') ||
      Math.ceil(innerWidth / 48) * Math.ceil(innerHeight / 48) > 3000) {
      cancel()
      applyWithoutTransition(next)
      return
    }
    const bounds = button.getBoundingClientRect()
    const apply = () => { if (sequence.current === id) applyWithoutTransition(next) }
    try {
      mask.current = tileMask(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, innerWidth, innerHeight)
      const transition = document.startViewTransition(apply)
      active.current = transition
      // During the root snapshot, browsers can retarget a second tap to <html>.
      const onSnapshotClick = (event: MouseEvent) => {
        if (active.current !== transition || event.target !== document.documentElement || !button.isConnected) return
        const { left, right, top, bottom } = button.getBoundingClientRect()
        if (event.clientX >= left && event.clientX < right && event.clientY >= top && event.clientY < bottom) button.click()
      }
      document.addEventListener('click', onSnapshotClick)
      transition.ready.then(() => {
        if (sequence.current === id) {
          animation.current = document.documentElement.animate(
            { opacity: [1, 1] },
            { duration: 750, pseudoElement: '::view-transition-new(root)' }
          )
          return animation.current.finished
        }
      }).catch(() => { transition.skipTransition(); apply() })
      transition.finished.catch(apply).finally(() => {
        document.removeEventListener('click', onSnapshotClick)
        if (sequence.current === id) {
          // A filled WAAPI animation remains registered after it finishes.
          animation.current?.cancel()
          animation.current = null
          active.current = null
          mask.current?.remove()
          mask.current = null
        }
      })
    } catch { cancel(); apply() }
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
