import { createFileRoute, Link } from '@tanstack/react-router'
import { ContributionCalendar } from '../components/ContributionCalendar'
import { PostList } from '../components/PostList'
import { pageHead } from '../lib/seo'
import { site } from '../lib/site'

export const Route = createFileRoute('/')({
  head: () => pageHead('首页', '从影视后期到创作工具，记录代码、Homelab 和 AI 工作流中的实践。', '/'),
  component: Home
})

function Home() {
  return (
    <div className="journal">
      <header className="journal-intro">
        <h1 lang="en">{site.name}</h1>
        <p>我从影视后期出发，现在写代码，做创作工具，也探索 AI 工作流。</p>
        <p>这里记录我动手搭建时遇到的问题，从 Docker 到自己的 Homelab。<Link to="/about" className="inline-link">关于我</Link></p>
      </header>
      <section aria-labelledby="recent-writing">
        <h2 id="recent-writing">
          <Link className="section-index" to="/posts" aria-label="Writing · 全部文章">
            <span lang="en">Writing</span> <span aria-hidden="true">→</span>
          </Link>
        </h2>
        <PostList />
      </section>
      <ContributionCalendar />
    </div>
  )
}
