import Head from 'next/head'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import {useEffect, useState} from 'react'

function readingMinutes(content) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 220))
}

export async function getStaticProps() {
  const postsDir = path.join(process.cwd(), 'pages', 'posts')
  const posts = fs
    .readdirSync(postsDir)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => {
      const source = fs.readFileSync(path.join(postsDir, file), 'utf8')
      const parsed = matter(source)
      const data = parsed.data
      return {
        slug: file.replace(/\.mdx?$/, ''),
        title: data.title || file.replace(/\.mdx?$/, ''),
        description: data.description || '',
        date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date),
        tags: data.tags || (data.tag ? [data.tag] : []),
        readingMinutes: readingMinutes(parsed.content)
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return {props: {posts}}
}

export default function Home({posts}) {
  const [theme, setTheme] = useState('system')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  return (
    <>
      <Head>
        <title>Shawn Deng · AI Agent / DevOps / Homelab</title>
        <meta name="description" content="AI Agent、DevOps 与 Homelab 的工程实践。" />
      </Head>
      <main className="home-shell">
        <header className="home-hero">
          <p className="eyebrow">SHAWN DENG / FIELD NOTES</p>
          <h1>AI Agent / DevOps / Homelab</h1>
          <p className="hero-lede">把复杂的工程问题，整理成可复用的实践。</p>
          <p className="hero-copy">
            记录自动化、容器、Kubernetes、云原生和 AI Agent 协作中的真实经验：少一点概念堆叠，多一点可以复制的命令、判断和结果。
          </p>
          <nav className="hero-links" aria-label="站点导航">
            <Link href="/posts">全部文章</Link>
            <a href="https://github.com/ShawnDen-coder">GitHub</a>
            <a href="/feed.xml">RSS</a>
            <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '浅色模式' : '深色模式'}
            </button>
          </nav>
        </header>

        <section className="latest-section" aria-labelledby="latest-heading">
          <div className="section-heading">
            <p className="eyebrow">LATEST WRITING</p>
            <h2 id="latest-heading">最新文章</h2>
          </div>
          <div className="post-list">
            {posts.map((post) => (
              <Link className="post-row" href={`/posts/${post.slug}`} key={post.slug}>
                <div>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                </div>
                <div className="post-meta">
                  <time dateTime={post.date}>{post.date}</time>
                  <span>{post.readingMinutes} min read</span>
                  <span>{post.tags.join(' · ')}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="home-footer">
          <span>DevOps · Homelab · AI Agent · Python</span>
          <span>© {new Date().getFullYear()} Shawn Deng</span>
        </footer>
      </main>
    </>
  )
}
