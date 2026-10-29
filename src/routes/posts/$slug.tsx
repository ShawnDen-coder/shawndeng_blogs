import {
  createFileRoute,
  Link,
  notFound,
  redirect
} from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { loadPost } from '../../lib/posts'
import { pageHead } from '../../lib/seo'
import { assetUrl } from '../../lib/site'

export const Route = createFileRoute('/posts/$slug')({
  loader: async ({ params }) => {
    const post = await loadPost(params.slug)
    if (!post) throw notFound()
    if (params.slug !== post.slug)
      throw redirect({
        to: '/posts/$slug',
        params: { slug: post.slug },
        statusCode: 301
      })
    return post
  },
  head: ({ loaderData: post }) =>
    post ? pageHead(post.title, post.description, `/posts/${post.slug}`) : {},
  component: PostPage
})

function PostPage() {
  const post = Route.useLoaderData()
  return (
    <article className="article-page">
      <Link className="text-link back-link" to="/posts">
        ← 全部文章
      </Link>
      <p className="eyebrow">
        <time dateTime={post.date}>{post.date}</time> / {post.tags.join(' · ')}
      </p>
      <div className="article-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }) => {
              const child = Array.isArray(children) ? children[0] : children
              if (child && typeof child === 'object' && 'props' in child) {
                const props = child.props as { className?: string; children?: string }
                if (props.className === 'language-pele-svg' && typeof props.children === 'string') {
                  const bytes = Uint8Array.from(atob(props.children.trim()), char => char.charCodeAt(0))
                  return <div className="pele-diagram" dangerouslySetInnerHTML={{ __html: new TextDecoder().decode(bytes) }} />
                }
              }
              return <pre>{children}</pre>
            },
            img: ({ src, alt }) => (
              <img
                src={src?.startsWith('/images/') ? assetUrl(src) : src}
                alt={alt ?? ''}
                loading="lazy"
              />
            )
          }}
        >
          {post.body}
        </ReactMarkdown>
      </div>
    </article>
  )
}
