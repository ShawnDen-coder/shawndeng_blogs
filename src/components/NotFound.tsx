import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <section className="inner-page">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1>页面未找到</h1>
      <p className="page-lede">这个地址不存在，或内容已经搬家了。</p>
      <Link className="text-link" to="/">
        返回首页 →
      </Link>
    </section>
  )
}
