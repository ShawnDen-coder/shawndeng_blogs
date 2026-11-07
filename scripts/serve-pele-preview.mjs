// Serve only the development fixture and built static assets; this never changes the production output.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const root=path.resolve('dist/client')
const assetDir=path.join(root,'assets')
if (!fs.existsSync(assetDir)) throw Error('Run npm run build first')
const files=fs.readdirSync(assetDir)
const styles=['latin-400-','latin-600-','global-'].map(prefix => {
  const file=files.find(name => name.startsWith(prefix) && name.endsWith('.css'))
  if (!file) throw Error(`Missing built stylesheet: ${prefix}`)
  return `<link rel="stylesheet" href="/assets/${file}">`
}).join('')
const html=fs.readFileSync('scripts/fixtures/pele-preview.html','utf8').replace('__SITE_STYLES__',styles)
const base=fs.readFileSync(path.join(root,'.site-base'),'utf8').trim()
const types={'.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml'}
http.createServer((req,res)=>{
  let pathname=new URL(req.url,'http://localhost').pathname
  if (pathname==='/' || pathname==='/pele-preview.html') { res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html); return }
  if (base !== '/' && pathname.startsWith(base)) pathname='/'+pathname.slice(base.length)
  const file=path.resolve(root,'.'+pathname)
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return }
  res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'}); fs.createReadStream(file).pipe(res)
}).listen(4176,'127.0.0.1',()=>console.log('Pele fixture: http://127.0.0.1:4176/'))
