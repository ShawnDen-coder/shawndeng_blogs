import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const posts: Array<{ slug: string }> = JSON.parse(
  fs.readFileSync('src/generated/posts.json', 'utf8')
)
const base =
  process.env.SITE_BASE_PATH ??
  (process.env.GITHUB_ACTIONS ? '/shawndeng_blogs/' : '/')

export default defineConfig({
  base,
  server: { host: '0.0.0.0', port: 5173 },
  plugins: [
    {
      name: 'watch-article-content',
      configureServer(server) {
        const directory = path.resolve('content/posts')
        server.watcher.add(directory)
        server.watcher.on('all', (_event, file) => {
          if (
            !file.startsWith(`${directory}${path.sep}`) ||
            !file.endsWith('.md')
          )
            return
          try {
            execFileSync(process.execPath, ['scripts/prepare-content.mjs'], {
              stdio: 'inherit'
            })
            server.ws.send({ type: 'full-reload' })
          } catch (error) {
            server.config.logger.error(`Article content error: ${error}`)
          }
        })
      }
    },
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        crawlLinks: false,
        failOnError: true
      },
      pages: [{ path: '/lab/manta' }, ...posts.map((post) => ({ path: `/posts/${post.slug}` }))]
    }),
    react()
  ]
})
