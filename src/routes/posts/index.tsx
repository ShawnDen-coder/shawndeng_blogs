import { createFileRoute } from '@tanstack/react-router'
import { PostList } from '../../components/PostList'
import { posts } from '../../lib/posts'
import { pageHead } from '../../lib/seo'

export const Route = createFileRoute('/posts/')({
  head: () => pageHead('Writing · 文章', '按年份浏览邓辉的技术文章。', '/posts'),
  component: Writing
})

const years = new Map<string, typeof posts>()
for (const post of posts) {
  const year = post.date.slice(0, 4)
  if (!years.has(year)) years.set(year, [])
  years.get(year)!.push(post)
}

function Writing() {
  return (
    <div className="journal writing-index">
      <h1 lang="en">Writing</h1>
      <div className="writing-archive">
        {Array.from(years, ([year, entries]) => (
          <section key={year} aria-label={`${year} 年的文章`}>
            <h2>{year}</h2>
            <PostList entries={entries} archive />
          </section>
        ))}
      </div>
    </div>
  )
}
