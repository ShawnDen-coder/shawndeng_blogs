import { Link } from '@tanstack/react-router'
import { posts } from '../lib/posts'

type PostListProps = { entries?: typeof posts; archive?: boolean }

export function PostList({ entries = posts.slice(0, 3), archive = false }: PostListProps) {
  return (
    <ul className={archive ? 'writing-list writing-list--archive' : 'writing-list writing-list--recent'}>
      {entries.map(post => (
        <li key={post.slug}>
          <Link className="journal-entry" to="/posts/$slug" params={{ slug: post.slug }}>
            <span>{post.title}</span>
            {archive && <time dateTime={post.date}>{post.date.slice(5).replace('-', '/')}</time>}
          </Link>
          {!archive && <p className="entry-description">{post.description}</p>}
        </li>
      ))}
      {!archive && (
        <li>
          <Link className="journal-entry" to="/posts" lang="en">All writing</Link>
          <p className="entry-description">记录代码、Homelab 和创作工具中的实践。</p>
        </li>
      )}
    </ul>
  )
}
