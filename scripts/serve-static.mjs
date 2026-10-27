import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('dist/client')
const base = fs.readFileSync(path.join(root, '.site-base'), 'utf8').trim()
const portIndex = process.argv.indexOf('--port')
const port = Number(
  portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4173
)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
}

http
  .createServer((req, res) => {
    let pathname
    try {
      pathname = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname
      )
    } catch {
      res.writeHead(400).end()
      return
    }
    if (!pathname.startsWith(base)) {
      res.writeHead(404).end('Not found')
      return
    }
    let file = path.resolve(root, pathname.slice(base.length))
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403).end()
      return
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html')
    let status = 200
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      file = path.join(root, '404.html')
      status = 404
    }
    res.writeHead(status, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream'
    })
    fs.createReadStream(file).pipe(res)
  })
  .listen(port, '0.0.0.0', () =>
    console.log(`Static preview: http://localhost:${port}${base}`)
  )
