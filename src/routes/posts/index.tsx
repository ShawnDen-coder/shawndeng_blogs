import { createFileRoute } from '@tanstack/react-router'
import { PostList } from '../../components/PostList'
import { pageHead } from '../../lib/seo'

export const Route = createFileRoute('/posts/')({
  head: () =>
    pageHead('文章', '动手实践中的记录，和解决问题时留下的思考。', '/posts'),
  component: () => (
    <section className="inner-page">
      <h1>文章</h1>
      <p className="page-lede">动手实践中的记录，和解决问题时留下的思考。</p>
      <PostList />
    </section>
  )
})
