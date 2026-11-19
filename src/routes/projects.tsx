import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '../lib/seo'
import { Arrow } from '../components/Arrow'

export const Route = createFileRoute('/projects')({
  head: () => pageHead('项目', '正在构建的工具与个人项目。', '/projects'),
  component: Projects
})

function Projects() {
  return (
    <section className="inner-page">
      <h1>项目</h1>
      <p className="page-lede">动手构建，也持续打磨。</p>
      <a
        className="project-link block"
        href="https://github.com/ShawnDen-coder/shawndeng_blogs"
        target="_blank"
        rel="noreferrer"
      >
        <div className="flex items-center justify-between gap-4">
          <h2>这个个人网站</h2>
          <Arrow diagonal />
        </div>
        <p>
          用代码整理自己的经历、项目与文字。也把构建过程，作为一次持续的工程实践。
        </p>
        <p className="project-stack">React / TanStack Start / Tailwind CSS</p>
      </a>
    </section>
  )
}
