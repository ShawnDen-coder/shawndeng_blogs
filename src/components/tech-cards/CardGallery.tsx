import { useRef, useState, type RefCallback } from 'react'
import { CardViewer } from './CardViewer'
import { cardGroups, preparePrint, techCards } from './card-prints'

const gallery = techCards.map((entry, index) => ({
  ...entry, index, thumbnail: preparePrint(index, true).face,
}))

export default function CardGallery({ gridRef }: { gridRef: RefCallback<HTMLUListElement> }) {
  const [group, setGroup] = useState('All')
  const [selection, setSelection] = useState<{ index: number } | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
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
    <ul ref={gridRef} className="tech-grid">
      {visible.map(entry => <li key={entry.id}>
        <button type="button" className="tech-tile" aria-haspopup="dialog" aria-label={`查看 ${entry.name}，${entry.role}`}
          onClick={event => { opener.current = event.currentTarget; show(entry.index) }}>
          <img src={entry.thumbnail} alt="" width="600" height="840" decoding="async" />
        </button>
      </li>)}
    </ul>
    {selection && opener.current &&
      <CardViewer selection={selection} opener={opener.current} onDismiss={() => setSelection(null)} onStep={step} />}
  </>
}
