import { Link } from '@tanstack/react-router'
import { posts } from '../lib/posts'

type PostListProps = { entries?: typeof posts; archive?: boolean }

export function PostList({ entries = posts.slice(0, 3), archive = false }: PostListProps) {
  return (
    <ul className="writing-list">
      {entries.map(post => (
        <li key={post.slug}>
          <Link className="journal-entry" to="/posts/$slug" params={{ slug: post.slug }}>
            <span>{post.title}</span>
            <time dateTime={post.date}>{archive ? post.date.slice(5).replace('-', '/') : post.date.slice(0, 4)}</time>
          </Link>
          {!archive && <p className="entry-description">{post.description}</p>}
        </li>
      ))}
    </ul>
  )
}
