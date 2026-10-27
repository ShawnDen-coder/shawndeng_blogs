import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const output = 'dist/client'
const base =
  process.env.SITE_BASE_PATH ??
  (process.env.GITHUB_ACTIONS ? '/shawndeng_blogs/' : '/')
const origin = 'https://shawnden-coder.github.io'
const url = (route) => `${origin}${base}${route.replace(/^\//, '')}`
const posts = JSON.parse(fs.readFileSync('src/generated/posts.json', 'utf8'))
const escape = (value) =>
  String(value).replace(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
      })[char]
  )

function validatePages() {
  for (const route of [
    '',
    'about',
    'resume',
    'projects',
    'posts',
    ...posts.map((post) => `posts/${post.slug}`)
  ]) {
    const file = path.join(output, route, 'index.html')
    assert.ok(fs.existsSync(file), `Missing prerendered route: ${route || '/'}`)
    const html = fs.readFileSync(file, 'utf8')
    assert.ok(
      html.includes('lang="zh-CN"'),
      `${route}: missing document language`
    )
    assert.ok(html.includes('rel="canonical"'), `${route}: missing canonical`)
    assert.ok(!html.includes('href="#/'), `${route}: hash route remains`)
    assert.equal(
      (html.match(/name="description"/g) || []).length,
      1,
      `${route}: description must be unique`
    )
    for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      assert.ok(
        href.startsWith(base),
        `${route}: asset or link escapes base path: ${href}`
      )
    }
  }
  for (const post of posts) {
    const html = fs.readFileSync(
      `${output}/posts/${post.slug}/index.html`,
      'utf8'
    )
    assert.ok(
      html.includes(post.title) && html.includes('<article'),
      `${post.slug}: missing static article content`
    )
  }
}

// Preserve the former Next.js article URLs on static hosts.
for (const [oldSlug, newSlug] of [
  ['Docker', 'docker'],
  ['K8S', 'k8s']
]) {
  const target = `${base}posts/${newSlug}/`
  const redirect = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${url(`posts/${newSlug}`)}"><title>文章已迁移</title></head><body><a href="${target}">前往文章</a></body></html>`
  // On case-insensitive filesystems Docker and docker are the same directory.
  // Linux CI can emit both, while local builds must never overwrite the article.
  if (!fs.existsSync(`${output}/posts/${oldSlug}`)) {
    fs.mkdirSync(`${output}/posts/${oldSlug}`, { recursive: true })
    fs.writeFileSync(`${output}/posts/${oldSlug}/index.html`, redirect)
  }
  fs.writeFileSync(`${output}/posts/${oldSlug}.html`, redirect)
}
fs.copyFileSync(`${output}/404/index.html`, `${output}/404.html`)
fs.writeFileSync(`${output}/.nojekyll`, '')
fs.writeFileSync(`${output}/.site-base`, base)

const items = posts
  .map(
    (post) =>
      `<item><title>${escape(post.title)}</title><link>${url(`posts/${post.slug}`)}</link><guid isPermaLink="true">${url(`posts/${post.slug}`)}</guid><description>${escape(post.description)}</description><pubDate>${new Date(post.date).toUTCString()}</pubDate></item>`
  )
  .join('\n')
fs.writeFileSync(
  `${output}/feed.xml`,
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Shawn Deng</title><link>${url('')}</link><description>工程实践与技术手记</description><language>zh-CN</language>${items}</channel></rss>`
)
const routes = [
  '',
  'about',
  'resume',
  'projects',
  'posts',
  ...posts.map((post) => `posts/${post.slug}`)
]
fs.writeFileSync(
  `${output}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${url(route)}</loc></url>`).join('')}</urlset>`
)
validatePages()
console.log(
  `Verified ${routes.length} prerendered pages, old article URLs, RSS and sitemap (base ${base})`
)
