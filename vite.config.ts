import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { execFile, execFileSync } from 'node:child_process'
import { cardDataPlugin } from './scripts/card-data-plugin.mjs'

const posts: Array<{ slug: string }> = JSON.parse(
  fs.readFileSync('src/generated/posts.json', 'utf8')
)
const base = process.env.SITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  server: { host: '0.0.0.0', port: 5173 },
  plugins: [
    cardDataPlugin(),
    {
      name: 'watch-card-artwork',
      configureServer(server) {
        const directory = path.resolve('src/components/tech-cards')
        let running = false
        let pending = false
        const regenerate = () => {
          if (running) { pending = true; return }
          running = true
          execFile(process.execPath, ['scripts/prepare-card-thumbnails.mjs'], (error, _stdout, stderr) => {
            running = false
            if (error) server.config.logger.error(`Card artwork error: ${stderr || error.message}`)
            else server.ws.send({ type: 'full-reload' })
            if (pending) { pending = false; regenerate() }
          })
        }
        server.watcher.on('all', (_event, file) => {
          if (file === path.join(directory, 'cards.yaml') || file === path.join(directory, 'card-prints.ts') ||
              file === path.join(directory, 'engraving.ts') || file.startsWith(path.join(directory, 'marks') + path.sep)) regenerate()
        })
      }
    },
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
      pages: [{ path: '/lab/manta' }, { path: '/photos' }, ...posts.map((post) => ({ path: `/posts/${post.slug}` }))]
    }),
    react()
  ]
})
