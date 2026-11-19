import { Link } from '@tanstack/react-router'
import { posts } from '../lib/posts'

const years = new Map<string, typeof posts>()
for (const post of [...posts].sort((a, b) => b.date.localeCompare(a.date))) {
  const year = post.date.slice(0, 4)
  if (!years.has(year)) years.set(year, [])
  years.get(year)!.push(post)
}

export function PostList() {
  return (
    <div className="writing-archive">
      {Array.from(years, ([year, entries]) => (
        <section className="writing-year" key={year} aria-label={`${year} 年的文章`}>
          <span className="writing-year-label" aria-hidden="true">{year}</span>
          <ul className="writing-list">
            {entries.map(post => (
              <li key={post.slug}>
                <Link className="journal-entry" to="/posts/$slug" params={{ slug: post.slug }}>
                  <span>{post.title}</span>
                  <time dateTime={post.date}>{post.date.slice(5).replace('-', '/')}</time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
