import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import avatar from '../../assets/shawn-cat.jpg'
import { gallery } from '../../generated/card-gallery'
import { flyDeck } from './deck-flight'
import CardGallery from './CardGallery'

const featured = gallery.filter(card => card.placement)
let warmedImages: HTMLImageElement[] | undefined
function warmGallery() {
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return
  // Keep the images alive while the dialog opens; the browser reuses its cache.
  warmedImages ??= gallery.slice(0, 3).map(card => {
    const image = new Image()
    image.src = card.thumbnail
    return image
  })
}

export function HomeCards() {
  const [expanded, setExpanded] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const portrait = useRef<HTMLImageElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const grid = useRef<HTMLUListElement | null>(null)
  const mountGrid = useCallback((list: HTMLUListElement | null) => {
    grid.current = list
    if (!list || !portrait.current) return
    const flights = flyDeck(list, portrait.current, false)
    return () => {
      grid.current = null
      flights.forEach(flight => flight.cancel())
    }
  }, [])

  function resetDeck(layer: HTMLDialogElement) {
    layer.querySelector<HTMLElement>('.deck-sheet')!.inert = false
    delete layer.dataset.closing
    // Remove the filtered grid before the trigger can open the deck again.
    flushSync(() => setExpanded(false))
    trigger.current?.focus({ preventScroll: true })
  }

  async function closeDeck() {
    const layer = dialog.current
    if (!layer?.open || layer.dataset.closing) return
    layer.dataset.closing = 'true'
    const sheet = layer.querySelector<HTMLElement>('.deck-sheet')!
    sheet.inert = true
    const flights = grid.current && portrait.current ? flyDeck(grid.current, portrait.current, true) : []
    await Promise.allSettled(flights.map(flight => flight.finished))
    if (!layer.isConnected) return
    layer.close()
    resetDeck(layer)
  }

  return <>
    <button ref={trigger} className="home-deck" type="button" aria-expanded={expanded} aria-controls="home-card-gallery"
      aria-haspopup="dialog" aria-label="展开技术卡册" title="展开技术卡册"
      onPointerEnter={warmGallery} onFocus={warmGallery} onPointerDown={warmGallery}
      onClick={() => { dialog.current?.showModal(); dialog.current?.scrollTo(0, 0); setExpanded(true) }}>
      <span className="deck-art">
        <span className="deck-outline" aria-hidden="true">
          {featured.map(card => <span key={card.placement} className={`deck-print deck-print--${card.placement}`} />)}
          <span className="deck-portrait" />
          <span className="deck-expand" />
        </span>
        {featured.map(card => <img key={card.placement} className={`deck-print deck-print--${card.placement}`}
          src={card.thumbnail} alt="" width="600" height="840" />)}
        <img ref={portrait} className="deck-portrait" src={avatar} width="480" height="480" alt="" />
        <span className="deck-expand" aria-hidden="true">+</span>
      </span>
    </button>
    <dialog ref={dialog} id="home-card-gallery" className="deck-overlay" aria-labelledby="deck-title"
      onClose={event => {
        if (event.target === event.currentTarget && !event.currentTarget.open && expanded) resetDeck(event.currentTarget)
      }}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          void closeDeck()
        }
      }}
      onCancel={event => { if (event.target === event.currentTarget) { event.preventDefault(); void closeDeck() } }}
      onClick={event => { if (event.target === event.currentTarget) void closeDeck() }}>
      <div className="deck-sheet">
        <header className="deck-heading">
          <h2 id="deck-title" lang="en">Tech cards</h2>
          <button type="button" className="deck-dismiss" aria-label="收起技术卡册" onClick={closeDeck}>×</button>
        </header>
        {expanded && <CardGallery gridRef={mountGrid} />}
      </div>
    </dialog>
  </>
}
