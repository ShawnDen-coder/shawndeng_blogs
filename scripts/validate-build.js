const fs = require('fs')
const home = fs.readFileSync('out/index.html', 'utf8')
const docker = fs.readFileSync('out/posts/Docker.html', 'utf8')
const feed = fs.readFileSync('out/feed.xml', 'utf8')
const exportedFiles = []
function collect(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = `${dir}/${name}`
    if (fs.statSync(file).isDirectory()) collect(file)
    else if (/\.(html|css)$/.test(name)) exportedFiles.push(fs.readFileSync(file, 'utf8'))
  }
}
collect('out')
if (exportedFiles.some((html) => html.includes('href="/feed.xml"') || html.includes('url(/fonts/'))) throw new Error('export contains root-relative feed/font asset')
if (home.includes('/posts/index')) throw new Error('home includes posts index placeholder')
for (const [name, html] of [['home', home], ['Docker', docker]]) {
  if (!html.includes('lang="zh-CN"')) throw new Error(`${name}: missing zh-CN language`)
  if (!html.includes('rel="canonical"')) throw new Error(`${name}: missing canonical`)
  if (!html.includes('og:image') || !html.includes('/og.svg')) throw new Error(`${name}: missing owned OG image`)
  if ((html.match(/name="description"/g) || []).length !== 1) throw new Error(`${name}: duplicate description metadata`)
  if ((html.match(/property="og:title"/g) || []).length !== 1) throw new Error(`${name}: duplicate og:title metadata`)
  if (html.includes('Vercel') || html.includes('Starter')) throw new Error(`${name}: starter metadata remains`)
}
if (!feed.includes('<language><![CDATA[zh-CN]]></language>')) throw new Error('feed: missing language')
if ((feed.match(/<link>https:\/\//g) || []).length < 2) throw new Error('feed: item links are not absolute')
if ((feed.match(/<guid isPermaLink="true">https:\/\//g) || []).length < 2) throw new Error('feed: item GUIDs are not absolute')
console.log('validated exported HTML metadata and absolute RSS links')
