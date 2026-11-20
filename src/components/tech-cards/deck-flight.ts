// Measure both ends in viewport coordinates so a scrolled or filtered deck returns to the portrait.
export function flyDeck(grid: HTMLUListElement, portrait: HTMLElement, closing: boolean) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return []
  const origin = portrait.getBoundingClientRect()
  const tiles = Array.from(grid.children)
  const current = tiles.map(tile => {
    const style = getComputedStyle(tile)
    return { transform: style.transform, opacity: style.opacity }
  })
  tiles.forEach(tile => tile.getAnimations().forEach(flight => flight.cancel()))
  const positions = tiles.map(tile => tile.getBoundingClientRect())
  return tiles.map((tile, index) => {
    const rect = positions[index]
    const dx = origin.x + origin.width / 2 - rect.x - rect.width / 2
    const dy = origin.y + origin.height / 2 - rect.y - rect.height / 2
    const stacked = {
      transform: `translate(${dx}px, ${dy}px) rotate(${(index % 4 - 1.5) * 19}deg) scale(${origin.width / rect.width})`,
      opacity: 0,
    }
    const order = closing ? tiles.length - index - 1 : index
    return tile.animate(closing ? [current[index], stacked] : [stacked, { transform: 'none', opacity: 1 }], {
      duration: closing ? 360 : 500, delay: Math.min(order, 10) * 16,
      easing: closing ? 'cubic-bezier(.48,.02,.75,.66)' : 'cubic-bezier(.2,.7,.23,1)',
      fill: closing ? 'both' : 'backwards',
    })
  })
}
