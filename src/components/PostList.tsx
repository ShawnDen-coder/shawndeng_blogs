import { Link } from '@tanstack/react-router'
import { posts } from '../lib/posts'

export function PostList() {
  return (
    <div className="post-list">
      {posts.map((post) => (
        <Link
          className="post-row block"
          to="/posts/$slug"
          params={{ slug: post.slug }}
          key={post.slug}
        >
          <div className="post-title-line flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
            <h3>{post.title}</h3>
            <time dateTime={post.date}>{post.date}</time>
          </div>
          <p>{post.description}</p>
        </Link>
      ))}
    </div>
  )
}
