import { createFileRoute, Link } from '@tanstack/react-router'
import { pageHead } from '../lib/seo'
import { site } from '../lib/site'

export const Route = createFileRoute('/about')({
  head: () =>
    pageHead(
      '关于我',
      '了解 Shawn Deng，以及他在 AI Agent、DevOps 与 Homelab 领域的实践。',
      '/about'
    ),
  component: About
})

function About() {
  return (
    <section className="inner-page">
      <h1>你好，我是 Shawn.</h1>
      <div className="about-copy space-y-6">
        <p>我关注 AI Agent、DevOps 与 Homelab，喜欢通过动手搭建来理解技术。</p>
        <p>
          这个网站记录我在容器、Kubernetes、自动化与 AI Agent
          协作中的实践。我希望把复杂的问题拆开，留下可以复用的命令、判断和经验。
        </p>
        <p>
          你可以从我的<Link to="/posts">技术文章</Link>开始，或在{' '}
          <a href={site.github}>GitHub ↗</a> 查看代码。
        </p>
      </div>
    </section>
  )
}
