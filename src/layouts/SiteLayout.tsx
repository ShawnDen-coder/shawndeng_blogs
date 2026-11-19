import { Link, useMatchRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ThemeIcon, useThemeControl } from '../components/ThemeSelect'
import { assetUrl, site } from '../lib/site'

export function SiteLayout({ children }: { children: ReactNode }) {
  const matchRoute = useMatchRoute()
  const isHome = matchRoute({ to: '/', fuzzy: false })
  const isLab = matchRoute({ to: '/lab/manta', fuzzy: false })
  const theme = useThemeControl()
  return (
    <div className={isLab ? 'site-shell site-shell--lab' : 'site-shell'}>
      <a className="skip-link" href="#main">跳到正文</a>
      <header className={isHome ? 'site-header site-header--home' : 'site-header'}>
        {!isHome && <Link className="home-link" to="/">← 首页</Link>}
        <button className="theme-toggle" type="button" aria-label="切换明暗主题" title="切换明暗主题"
          onClick={event => theme.toggle(event.currentTarget)}><ThemeIcon /></button>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()}{!isHome && ` ${site.name}`}</span>
        <div className="footer-actions">
          <button type="button" aria-pressed={theme.preference === 'system'}
            onClick={event => theme.reset(event.currentTarget)}>跟随系统</button>
          <a href={assetUrl('feed.xml')}>RSS</a>
        </div>
      </footer>
    </div>
  )
}
