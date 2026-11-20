import { createServer } from 'vite'
import { cardDataPlugin } from './card-data-plugin.mjs'
import fs from 'node:fs/promises'
import path from 'node:path'

// Run the same print generator used by the viewer, through Vite so YAML and
// import.meta.glob resolve exactly as they do in the application.
const server = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-card-generator', optimizeDeps: { noDiscovery: true }, plugins: [cardDataPlugin()], server: { middlewareMode: true, ws: false, watch: null }, appType: 'custom' })
try {
  const { techCards, preparePrint } = await server.ssrLoadModule('/src/components/tech-cards/card-prints.ts')
  const directory = path.resolve('src/generated/card-thumbnails')
  await fs.mkdir(directory, { recursive: true })
  const images = techCards.map((card, index) => ({
    card, file: `${card.id}.svg`, svg: decodeURIComponent(preparePrint(index, true).face.split(',')[1]),
  }))
  const existing = await fs.readdir(directory)
  await Promise.all(existing.filter(file => file.endsWith('.svg') && !images.some(image => image.file === file)).map(file => fs.unlink(path.join(directory, file))))
  async function writeChanged(file, contents) {
    const previous = await fs.readFile(file, 'utf8').catch(() => '')
    if (previous !== contents) await fs.writeFile(file, contents)
  }
  await Promise.all(images.map(({ file, svg }) => writeChanged(path.join(directory, file), svg)))
  const imports = images.map(({ file }, index) => `import image${index} from './card-thumbnails/${file}?no-inline'`).join('\n')
  const metadata = images.map(({ card }, index) => {
    const { emblem, ground, ...copy } = card
    copy.placement ??= null
    return `{ ...${JSON.stringify(copy)}, thumbnail: image${index} }`
  }).join(',\n')
  await writeChanged(path.resolve('src/generated/card-gallery.ts'), `${imports}\n\nexport const gallery = [\n${metadata}\n]\nexport const cardGroups = [...new Set(gallery.map(card => card.group))]\n`)
  console.log(`Prepared ${images.length} card thumbnails`)
} finally {
  await server.close()
}
