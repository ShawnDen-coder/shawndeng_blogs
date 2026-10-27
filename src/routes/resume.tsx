import { createFileRoute } from '@tanstack/react-router'
import { Arrow } from '../components/Arrow'
import { pageHead } from '../lib/seo'
import { site } from '../lib/site'

export const Route = createFileRoute('/resume')({
  head: () =>
    pageHead(
      '简历',
      'Shawn Deng 的职业经历与项目成果。简历正在整理中。',
      '/resume'
    ),
  component: Resume
})

function Resume() {
  return (
    <section className="inner-page">
      <p className="eyebrow">RÉSUMÉ</p>
      <h1>简历</h1>
      <p className="page-lede">Shawn Deng / AI Agent · DevOps · Homelab</p>
      <div className="resume-note">
        <h2>简历正在整理中</h2>
        <p>工作经历、项目成果与 PDF 下载将在整理完成后发布。</p>
        <a className="text-link" href={site.github}>
          先看看我的 GitHub <Arrow diagonal />
        </a>
      </div>
    </section>
  )
}
