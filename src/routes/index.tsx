import { createFileRoute, Link } from '@tanstack/react-router'
import { SharkScene } from '../components/shark/SharkScene'
import { useEffect, useState } from 'react'
import { pageHead } from '../lib/seo'
import { site } from '../lib/site'

export const Route = createFileRoute('/')({
  head: () =>
    pageHead(
      '邓辉 · Shawn',
      '从影视后期到创作工具、平台与 AI。喜欢深入解决难题，做些真正能帮上忙的东西。',
      '/'
    ),
  component: Home
})

function Home() {
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const toggle = () => setPaused(value => !value)
    window.addEventListener('scene-toggle', toggle)
    return () => window.removeEventListener('scene-toggle', toggle)
  }, [])
  return (
    <>
    <section className="ocean-home" aria-labelledby="intro-title">
      <SharkScene paused={paused} />
      <div className="ocean-intro">
        <h1 id="intro-title">
          你好，我是邓辉<span className="ocean-name">Shawn.</span>
        </h1>
        <div className="ocean-copy">
          <p>
            从<Link to="/about">影视后期</Link>出发，现在构建
            <Link to="/projects">创作工具、平台与 AI 工作流</Link>。
          </p>
          <p>
            喜欢把难题弄明白，做些真正能帮上忙的东西。
          </p>
        </div>
        <div className="ocean-links">
          <a href={site.github} target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <Link to="/about">
            更多关于我 <span aria-hidden="true">↗</span>
          </Link>
          <Link to="/resume">
            查看简历 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
    </>
  )
}
