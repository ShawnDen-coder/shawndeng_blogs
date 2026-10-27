import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { SiteLayout } from '../layouts/SiteLayout'
import { NotFound } from '../components/NotFound'
import { assetUrl } from '../lib/site'
import jetbrainsRegular from '@fontsource/jetbrains-mono/latin-400.css?url'
import jetbrainsSemibold from '@fontsource/jetbrains-mono/latin-600.css?url'
import styles from '../styles/global.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#1a1921' },
      { property: 'og:site_name', content: 'Shawn Deng' }
    ],
    links: [
      { rel: 'stylesheet', href: jetbrainsRegular },
      { rel: 'stylesheet', href: jetbrainsSemibold },
      { rel: 'stylesheet', href: styles },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'Shawn Deng RSS',
        href: assetUrl('feed.xml')
      }
    ]
  }),
  shellComponent: RootDocument,
  component: () => (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  ),
  notFoundComponent: NotFound,
  errorComponent: ({ reset }) => (
    <section className="inner-page">
      <h1>页面暂时无法加载</h1>
      <button className="primary-button" onClick={reset}>
        重试
      </button>
    </section>
  )
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
