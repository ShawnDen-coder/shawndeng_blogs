import { Link, useMatchRoute, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ThemeIcon, useThemeControl } from '../components/ThemeSelect'

export function SiteLayout({ children }: { children: ReactNode }) {
  const matchRoute = useMatchRoute()
  const isHome = matchRoute({ to: '/', fuzzy: false })
  const isPhotos = matchRoute({ to: '/photos', fuzzy: false })
  const isLab = matchRoute({ to: '/lab/manta', fuzzy: false })
  const isWriting = useRouterState({ select: state => state.matches.some(match => match.routeId === '/posts/') })
  const theme = useThemeControl()
  return (
    <div className={`site-shell${isLab ? ' site-shell--lab' : ''}${isWriting ? ' site-shell--writing' : ''}${isPhotos ? ' site-shell--photos' : ''}`}>
      <a className="skip-link" href="#main">跳到正文</a>
      <header className={isHome ? 'site-header site-header--home' : 'site-header'}>
        {!isHome && <Link className="home-link" to="/">{isWriting ? '← Index' : '← 首页'}</Link>}
        <button className="theme-toggle" type="button" aria-label="切换明暗主题" title="切换明暗主题"
          onClick={event => theme.toggle(event.currentTarget)}><ThemeIcon /></button>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
    </div>
  )
}
