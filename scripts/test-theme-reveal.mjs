import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const output = mkdtempSync(join(tmpdir(), 'theme-reveal-'))
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/lib/theme-reveal.ts',
    '--outDir', output, '--module', 'commonjs', '--target', 'ES2022', '--skipLibCheck'])
  writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}')
  const { makeTileMask } = createRequire(join(output, 'package.json'))('./theme-reveal.js')
  const read = svg => [...svg.matchAll(/<path d="([^"]+)" opacity="0"><set attributeName="opacity" to="1" begin="([\d.]+)ms" fill="freeze"\/><\/path>/g)]
    .flatMap(([, path, delay]) => [...path.matchAll(/M(\d+) (\d+)h49v49h-49z/g)]
      .map(([, x, y]) => ({ x: +x, y: +y, delay: +delay })))
    .sort((a, b) => a.y - b.y || a.x - b.x)
  const cells = read(makeTileMask(24, 24, 145, 97, () => 0))
  assert.equal(cells.length, 12, 'partial edge cells cover the viewport')
  assert.deepEqual(cells[0], { x: 0, y: 0, delay: 0 })
  assert.equal(new Set(cells.map(({ x, y }) => `${x},${y}`)).size, cells.length)
  assert(cells.find(c => c.x === 144 && c.y === 96).delay > cells.find(c => c.x === 48 && c.y === 0).delay)
  const scattered = read(makeTileMask(24, 24, 145, 97, () => 1))
  cells.filter(c => c.delay < 500).forEach(cell => {
    const other = scattered.find(c => c.x === cell.x && c.y === cell.y)
    assert(Math.abs(other.delay - cell.delay - 175) <= 17, 'random jitter spans 25% of 700ms, quantized to one frame')
  })
  const wideNear = read(makeTileMask(24, 24, 480, 480, () => 1))[0]
  const wideNext = read(makeTileMask(24, 24, 480, 480, () => 0))[1]
  assert(wideNear.delay > wideNext.delay, 'jitter allows noncontiguous reveal')
  console.log('Theme mask grid, distance and scattered timing passed')
} finally {
  rmSync(output, { recursive: true, force: true })
}
