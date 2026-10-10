import Link from 'next/link'

const posts = [
  {slug: 'K8S', title: 'K8S 基础入门', date: '2025-03-01'},
  {slug: 'Docker', title: 'Docker 基础入门', date: '2024-08-19'}
].sort((a, b) => new Date(b.date) - new Date(a.date))

export function PostMeta({slug, date, tags, minutes}) {
  const index = posts.findIndex((post) => post.slug === slug)
  const previous = posts[index + 1]
  const next = posts[index - 1]
  return (
    <>
      <p className="post-meta-note">
        发布日期：{date} · 阅读约 {minutes} 分钟 · 标签：{tags.join('、')}
      </p>
      <nav className="post-navigation" aria-label="文章导航">
        {previous ? <Link href={`/posts/${previous.slug}`}>上一篇：{previous.title}</Link> : <Link href="/posts">上一篇：文章列表</Link>}
        {next ? <Link href={`/posts/${next.slug}`}>下一篇：{next.title}</Link> : <Link href="/posts">下一篇：文章列表</Link>}
      </nav>
    </>
  )
}
