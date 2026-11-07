import { Link } from '@tanstack/react-router'
import { site } from '../lib/site'

export function ProfileIntro({ home = false }: { home?: boolean }) {
  const name = <>你好，我是邓辉<span>Shawn.</span></>
  return <aside className="profile-intro" data-scene-protect>
    {home ? <h1>{name}</h1> : <p className="profile-name">{name}</p>}
    <div className="profile-copy">
      <p>从<Link to="/about">影视后期</Link>出发，现在构建<Link to="/projects">创作工具、平台与 AI 工作流</Link>。</p>
      <p>喜欢把难题弄明白，做些真正能帮上忙的东西。</p>
    </div>
    <div className="profile-links">
      <a href={site.github} target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
      <Link to="/about">更多关于我 <span aria-hidden="true">→</span></Link>
      <Link to="/resume">查看简历 <span aria-hidden="true">→</span></Link>
    </div>
  </aside>
}
