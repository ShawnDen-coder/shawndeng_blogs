// Each cell has the reference timing: mostly distance, with random scatter.
export function makeTileMask(x: number, y: number, width: number, height: number, random = Math.random) {
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) || 1
  // Quantize to 60 Hz, grouping tiles into independent static paths. This
  // avoids creating an SVG animation node for every square on large screens.
  const frames = Array.from({ length: 43 }, () => [] as string[])
  for (let top = 0; top < height; top += 48) {
    for (let left = 0; left < width; left += 48) {
      const distance = Math.hypot(left + 24 - x, top + 24 - y) / radius
      const delay = (.75 * distance + .25 * random()) * 700
      // Overlap the next cell by 1 CSS px so separately rasterized paths
      // cannot expose the old snapshot through antialiased shared edges.
      frames[Math.min(42, Math.ceil(delay / (1000 / 60)))].push(`M${left} ${top}h49v49h-49z`)
    }
  }
  const paths = frames.map((tiles, frame) => tiles.length
    ? `<path d="${tiles.join('')}" opacity="0"><set attributeName="opacity" to="1" begin="${(frame * 1000 / 60).toFixed(2)}ms" fill="freeze"/></path>`
    : '').join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">${paths}</svg>`
}
