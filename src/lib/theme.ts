export type ThemePreference = 'system' | 'light' | 'dark'
export const themeStorageKey = 'shawn-theme'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

// Runs in <head> before styles paint, and again when preferences change.
// Keep this function self-contained so the same logic can be serialized for SSR.
export function applyTheme(preference: ThemePreference) {
  const theme = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content', theme === 'dark' ? '#1a1917' : '#f5f4f1'
  )
}

export const themeBootstrap = `(() => {
  let preference = 'system';
  try {
    const saved = localStorage.getItem(${JSON.stringify(themeStorageKey)});
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}
  (${applyTheme.toString()})(preference);
})();`
