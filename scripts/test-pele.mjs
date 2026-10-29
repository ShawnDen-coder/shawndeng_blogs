import assert from 'node:assert/strict'
import { renderMermaidFences } from './prepare-content.mjs'
const input = 'Before\n\n```mermaid\nflowchart LR\n A --> B\n```\n\nAfter'
const result = renderMermaidFences(input, 'fixture.md')
const encoded = result.match(/```pele-svg\n([^\n]+)/)?.[1]
assert.ok(encoded)
const svg = Buffer.from(encoded, 'base64').toString()
assert.match(svg, /<svg/)
assert.match(svg, /var\(--pele-/)
assert.equal(renderMermaidFences('    ```mermaid\n    A --> B\n    ```', 'fixture.md').includes('pele-svg'), false)
assert.throws(() => renderMermaidFences('```mermaid\nnot a diagram\n```', 'fixture.md'), /fixture.md: Mermaid block 1/)
console.log('Pele fixture passed')
