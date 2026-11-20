import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefCallback } from 'react'
import { CardViewer, warmCardViewer } from './CardViewer'
import { cardGroups, gallery as cards } from '../../generated/card-gallery'

const gallery = cards.map((entry, index) => ({ ...entry, index }))

export default function CardGallery({ gridRef }: { gridRef: RefCallback<HTMLUListElement> }) {
  const [group, setGroup] = useState('All')
  const [selection, setSelection] = useState<{ index: number } | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const grid = useRef<HTMLUListElement | null>(null)
  const attachGrid = useCallback<RefCallback<HTMLUListElement>>(element => {
    grid.current = element
    const cleanup = gridRef(element)
    return () => { grid.current = null; if (typeof cleanup === 'function') cleanup() }
  }, [gridRef])

  useLayoutEffect(() => {
    const tiles = Array.from(grid.current?.children ?? []) as HTMLElement[]
    const firstTop = tiles[0]?.offsetTop
    // offsetTop ignores the fly-in transforms and identifies the actual first row.
    for (const tile of tiles) {
      tile.querySelector('img')?.setAttribute('fetchpriority', tile.offsetTop === firstTop ? 'high' : 'low')
    }
  }, [group])

  useEffect(() => {
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return
    // Let the committed thumbnails start fetching and paint once before warming 3D.
    let nextFrame: number | undefined
    const firstFrame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(warmCardViewer)
    })
    return () => {
      cancelAnimationFrame(firstFrame)
      if (nextFrame !== undefined) cancelAnimationFrame(nextFrame)
    }
  }, [])
  const visible = group === 'All' ? gallery : gallery.filter(entry => entry.group === group)
  function show(index: number) {
    setSelection({ index })
  }
  function step(direction: number) {
    const position = visible.findIndex(entry => entry.index === selection?.index)
    show(visible[(position + direction + visible.length) % visible.length].index)
  }
  return <>
    <div className="tech-filters" lang="en" role="group" aria-label="筛选技术卡">
      {['All', ...cardGroups].map(label =>
        <button key={label} type="button" aria-pressed={group === label} onClick={() => setGroup(label)}>
          {label}{label === 'All' && <span> {gallery.length}</span>}
        </button>
      )}
    </div>
    <ul ref={attachGrid} className="tech-grid">
      {visible.map((entry, position) => <li key={entry.id}>
        <button type="button" className="tech-tile" style={{ background: entry.paper, color: entry.foil } as CSSProperties} aria-haspopup="dialog" aria-label={`查看 ${entry.name}，${entry.role}`}
          onClick={event => { warmCardViewer(); opener.current = event.currentTarget; show(entry.index) }}>
          <span className="tech-tile-placeholder" aria-hidden="true">{entry.name}</span>
          <img src={entry.thumbnail} alt="" width="600" height="840" decoding="async" fetchPriority={position < 3 ? 'high' : 'low'} />
        </button>
      </li>)}
    </ul>
    {selection && opener.current &&
      <CardViewer selection={selection} opener={opener.current} onDismiss={() => setSelection(null)} onStep={step} />}
  </>
}
