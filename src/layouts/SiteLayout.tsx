import { Link, useMatchRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Arrow } from '../components/Arrow'
import { assetUrl, site } from '../lib/site'

const navigation = [
  { to: '/projects', label: '项目' },
  { to: '/posts', label: '文章' },
  { to: '/about', label: '关于' },
  { to: '/resume', label: '简历' }
] as const

export function SiteLayout({ children }: { children: ReactNode }) {
  const matchRoute = useMatchRoute()
  const isLab = !!matchRoute({ to: '/lab/manta', fuzzy: false })
  const isHome = !!matchRoute({ to: '/', fuzzy: false })
  return (
    <div
      className={
        isHome
          ? 'site-shell site-shell--ocean'
          : isLab ? 'site-shell site-shell--lab' : 'site-shell mx-auto w-full max-w-[768px] px-6 sm:px-8'
      }
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main')
          main?.focus()
          main?.scrollIntoView()
        }}
      >
        跳到正文
      </a>
      <header className="site-header flex flex-wrap items-center justify-between gap-5">
        <Link to="/" className="wordmark" aria-label="Shawn Deng 首页">
          shawn.
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-6 sm:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: false }}
              activeProps={{ 'aria-current': 'page' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer flex flex-wrap items-center justify-between gap-4">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <div className="flex items-center gap-5">
          <a href={assetUrl('feed.xml')}>RSS</a>
          <a href={site.github}>
            保持好奇，持续构建。 <Arrow diagonal />
          </a>
        </div>
      </footer>
    </div>
  )
}
