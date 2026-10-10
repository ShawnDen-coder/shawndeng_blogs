const fs = require('fs')
const home = fs.readFileSync('out/index.html', 'utf8')
const docker = fs.readFileSync('out/posts/Docker.html', 'utf8')
const feed = fs.readFileSync('public/feed.xml', 'utf8')
for (const [name, html] of [['home', home], ['Docker', docker]]) {
  if (!html.includes('lang="zh-CN"')) throw new Error(`${name}: missing zh-CN language`)
  if (!html.includes('rel="canonical"')) throw new Error(`${name}: missing canonical`)
  if (!html.includes('og:image') || !html.includes('/og.svg')) throw new Error(`${name}: missing owned OG image`)
  if (html.includes('Vercel') || html.includes('Starter')) throw new Error(`${name}: starter metadata remains`)
}
if (!feed.includes('<language><![CDATA[zh-CN]]></language>')) throw new Error('feed: missing language')
if ((feed.match(/<link>https:\/\//g) || []).length < 2) throw new Error('feed: item links are not absolute')
if ((feed.match(/<guid isPermaLink="true">https:\/\//g) || []).length < 2) throw new Error('feed: item GUIDs are not absolute')
console.log('validated exported HTML metadata and absolute RSS links')
