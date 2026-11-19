import { createFileRoute, Link } from '@tanstack/react-router'
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
        <div lang="en" className="space-y-6">
          <p>I build practical tools and self-hosted infrastructure for my own workflows. My main interests are Kubernetes platform engineering, GitOps, DevOps automation, CI/CD, Python tooling, AI agents, and Rust systems programming.</p>
          <p>I work primarily with Kubernetes, FluxCD, Helm, Kustomize, Docker, GitHub Actions, SOPS, External Secrets, Apache Airflow, and Python. Python is my main language for automation and platform components, while Rust gives me a way to explore command-line tools and lower-level abstractions.</p>
          <p>Infrastructure as Code is central to how I work. Hosts, Kubernetes resources, Helm releases, application configuration, secrets integration, and operational workflows should be declarative, reproducible, versioned, automated, and recoverable. My homelab is managed like a software project: changes are documented, reviewed, tested, delivered through GitOps, and designed to be rebuilt when necessary.</p>
          <p>Most of what I build is for personal use, experimentation, and continuous learning. I value small reusable components, clear interfaces, automation over manual work, and documentation, testing, and observability as part of the system.</p>
          <p>Build it. Automate it. Understand it. 🚀</p>
        </div>
        <nav aria-label="更多内容">
          <p>浏览<Link to="/posts">技术文章</Link>、<a href={site.github}>GitHub ↗</a> 或 <Link to="/resume">简历（整理中）</Link>。</p>
        </nav>
      </div>
    </section>
  )
}
