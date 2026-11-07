import { createFileRoute, Link } from '@tanstack/react-router'
import { UndertowScene } from '../components/background/UndertowScene'
import { PostList } from '../components/PostList'
import { ProfileLayout } from '../layouts/ProfileLayout'
import { pageHead } from '../lib/seo'

export const Route = createFileRoute('/')({
  head: () => pageHead('邓辉 · Shawn', '从影视后期到创作工具、平台与 AI。喜欢深入解决难题，做些真正能帮上忙的东西。', '/'),
  component: Home
})
function Home() {
  return <><UndertowScene/><ProfileLayout home>
    <section className="home-section"><h2>正在构建</h2>
      <a className="home-project" href="https://github.com/ShawnDen-coder/shawndeng_blogs" target="_blank" rel="noreferrer"><h3>这个个人网站 <span aria-hidden="true">↗</span></h3><p>用代码整理自己的经历、项目与文字。也把构建过程，作为一次持续的工程实践。</p><p className="project-stack">React / TanStack Start / Tailwind CSS</p></a>
      <Link className="section-link" to="/projects">项目页 <span aria-hidden="true">→</span></Link>
    </section>
    <section className="home-section"><h2>技术文章</h2><p>动手实践中的记录，和解决问题时留下的思考。</p><PostList limit={3}/><Link className="section-link" to="/posts">全部文章 <span aria-hidden="true">→</span></Link></section>
  </ProfileLayout></>
}
