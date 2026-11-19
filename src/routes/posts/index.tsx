import { createFileRoute } from '@tanstack/react-router'
import { PostList } from '../../components/PostList'
import { pageHead } from '../../lib/seo'

export const Route = createFileRoute('/posts/')({
  head: () => pageHead('Writing · 文章', '按年份浏览邓辉的技术文章。', '/posts'),
  component: Writing
})

function Writing() {
  return (
    <div className="journal writing-index">
      <h1 lang="en">Writing</h1>
      <PostList />
    </div>
  )
}
