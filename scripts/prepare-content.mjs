import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

export function readPosts() {
  const seen = new Set()
  return fs
    .readdirSync('content/posts')
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = fs.readFileSync(path.join('content/posts', file), 'utf8')
      const match = source.match(
        /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/
      )
      if (!match) throw new Error(`${file}: missing YAML frontmatter`)
      const data = parse(match[1])
      const content = match[2]
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new Error(`${file}: invalid frontmatter`)
      for (const key of ['slug', 'title', 'description', 'date', 'author']) {
        if (!data[key]) throw new Error(`${file}: missing ${key}`)
      }
      const slug = String(data.slug)
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || seen.has(slug))
        throw new Error(`${file}: invalid or duplicate slug`)
      seen.add(slug)
      const date = new Date(data.date).toISOString().slice(0, 10)
      const tags = Array.isArray(data.tags)
        ? data.tags.map(String)
        : data.tag
          ? [String(data.tag)]
          : []
      for (const [, image] of content.matchAll(
        /!\[[^\]]*\]\(\/images\/([^\s)]+)\)/g
      )) {
        if (!fs.existsSync(path.join('public/images', image)))
          throw new Error(`${file}: missing image ${image}`)
      }
      return {
        slug,
        title: String(data.title),
        description: String(data.description),
        date,
        author: String(data.author),
        tags,
        body: content.trim()
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

const posts = readPosts()
fs.mkdirSync('src/generated/articles', { recursive: true })
for (const old of fs.readdirSync('src/generated/articles'))
  fs.unlinkSync(path.join('src/generated/articles', old))
for (const post of posts)
  fs.writeFileSync(
    `src/generated/articles/${post.slug}.json`,
    `${JSON.stringify(post)}\n`
  )
fs.writeFileSync(
  'src/generated/posts.json',
  `${JSON.stringify(
    posts.map(({ body, ...metadata }) => metadata),
    null,
    2
  )}\n`
)
console.log(`Prepared ${posts.length} articles`)
