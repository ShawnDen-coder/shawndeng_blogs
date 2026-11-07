// Development-only visual fixture. The companion server injects the built site styles.
import fs from 'node:fs'
import { renderMermaidFences } from './prepare-content.mjs'
const input = '```mermaid\nflowchart LR\n  A["内容准备"] --> B["构建与检查"] --> C["发布文章"]\n  B --> D["复核长中文标签与浅色深色图表的阅读和横向滚动"]\n```'
const encoded = renderMermaidFences(input, 'pele-preview-fixture.md').match(/```pele-svg\n([^\n]+)/)?.[1]
if (!encoded) throw new Error('Pele did not produce an SVG')
const svg = Buffer.from(encoded, 'base64').toString()
const panels = ['light','dark'].flatMap(theme => [320,760].map(width => `<section class="fixture-panel" style="color-scheme:${theme};width:${width}px"><h2>${theme} · ${width}px</h2><div class="article-body"><div class="pele-diagram">${svg}</div></div></section>`)).join('\n')
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pele visual fixture (development only)</title>__SITE_STYLES__<style>body{padding:24px}.fixture-panel{box-sizing:border-box;max-width:100%;background:var(--ui-bg-page);color:var(--ui-text-primary);padding:16px;margin:24px 0}.fixture-panel h2{font-size:16px}.fixture-panel .pele-diagram{margin-block:16px}</style></head><body><h1>Pele visual fixture</h1><p>Development fixture: inspect both themes and horizontal scrolling in 320px and 760px containers.</p>${panels}</body></html>`
fs.writeFileSync(new URL('./fixtures/pele-preview.html', import.meta.url),html)
console.log('Generated scripts/fixtures/pele-preview.html (development only)')
