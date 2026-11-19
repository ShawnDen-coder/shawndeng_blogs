import { createFileRoute, Link } from '@tanstack/react-router'
import { PersonalIntroduction } from '../components/PersonalIntroduction'
import { pageHead } from '../lib/seo'
import { site } from '../lib/site'

export const Route = createFileRoute('/about')({
  head: () =>
    pageHead(
      '关于我',
      '了解 Shawn Deng 如何构建自用工具、自托管基础设施，并通过 GitOps 和自动化管理 Homelab。',
      '/about'
    ),
  component: About
})

function About() {
  return (
    <section className="inner-page">
      <h1>关于我</h1>
      <div className="about-copy space-y-6">
        <PersonalIntroduction className="space-y-6" />
        <nav aria-label="更多内容">
          <p>浏览<Link to="/posts">技术文章</Link>、<a href={site.github}>GitHub ↗</a> 或 <Link to="/resume">简历（整理中）</Link>。</p>
        </nav>
      </div>
    </section>
  )
}
