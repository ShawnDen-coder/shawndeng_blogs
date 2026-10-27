import content from '../generated/posts.json'

export type Post = {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  body: string
}

export const posts: Omit<Post, 'body'>[] = content
const articles = import.meta.glob<Post>('../generated/articles/*.json', {
  import: 'default'
})

export function findPost(slug: string) {
  return posts.find((post) => post.slug === slug.toLowerCase())
}

export async function loadPost(slug: string) {
  const metadata = findPost(slug)
  if (!metadata) return undefined
  return articles[`../generated/articles/${metadata.slug}.json`]?.()
}
