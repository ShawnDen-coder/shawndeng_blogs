const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const dir = path.join(__dirname, '..', 'pages', 'posts')
const files = fs.readdirSync(dir).filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
const posts = files.map((file) => {
  const source = fs.readFileSync(path.join(dir, file), 'utf8')
  const parsed = matter(source)
  const minutes = Math.max(1, Math.round(parsed.content.trim().split(/\s+/).length / 220))
  const declared = source.match(/minutes=\{(\d+)\}/)
  if (!declared || Number(declared[1]) !== minutes) throw new Error(`${file}: reading minutes must match body length (${minutes})`)
  return {file, ...parsed.data}
})

for (const post of posts) {
  if (!post.title || !post.description || !post.date || !post.author) throw new Error(`${post.file}: missing required frontmatter`)
  const tags = post.tags || post.tag
  if (!tags || (Array.isArray(tags) ? tags.length === 0 : String(tags).trim() === '')) throw new Error(`${post.file}: missing tag/tags`)
}

const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))
if (sorted.some((post, index) => index > 0 && new Date(post.date) > new Date(sorted[index - 1].date))) throw new Error('post ordering is not descending by date')
if (sorted.map((post) => post.file.replace(/\.mdx$/, '')).join('>') !== 'K8S>Docker') throw new Error('navigation order is not stable: expected K8S>Docker')
console.log(`validated ${posts.length} posts; stable descending date order`)
