import { createFileRoute } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'

export const Route = createFileRoute('/404')({
  head: () => ({
    meta: [
      { title: '页面未找到 — Shawn Deng' },
      { name: 'robots', content: 'noindex' }
    ]
  }),
  component: NotFound
})
