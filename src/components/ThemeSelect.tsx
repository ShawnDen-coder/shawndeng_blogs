import { useEffect, useState } from 'react'
import { applyTheme, isThemePreference, themeStorageKey } from '../lib/theme'
import type { ThemePreference } from '../lib/theme'

export function ThemeSelect() {
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => {
    let current: ThemePreference = 'system'
    try {
      const saved = localStorage.getItem(themeStorageKey)
      if (isThemePreference(saved)) current = saved
    } catch { /* Storage can be disabled; switching still works for this visit. */ }
    setPreference(current)
    applyTheme(current)
    const sync = (event: StorageEvent) => {
      if (event.key !== themeStorageKey && event.key !== null) return
      const next = isThemePreference(event.newValue) ? event.newValue : 'system'
      setPreference(next)
      applyTheme(next)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => { if (preference === 'system') applyTheme('system') }
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [preference])

  return (
    <label className="theme-control">
      <span className="sr-only">配色主题</span>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </svg>
      <select value={preference} onChange={(event) => {
        const next = event.target.value
        if (!isThemePreference(next)) return
        setPreference(next)
        applyTheme(next)
        try { localStorage.setItem(themeStorageKey, next) } catch { /* Optional persistence. */ }
      }}>
        <option value="system">跟随系统</option>
        <option value="light">浅色</option>
        <option value="dark">深色</option>
      </select>
    </label>
  )
}
