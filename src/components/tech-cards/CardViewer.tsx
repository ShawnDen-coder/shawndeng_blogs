import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { gallery } from '../../generated/card-gallery'
import type { TechCard } from './card-prints'

const loadScene = () => import('./CardScene')
const loadPrints = () => import('./card-prints')
const CardScene = lazy(loadScene)

// Both imports start together; rejected speculative imports leave the static card usable.
export function warmCardViewer() {
  void loadScene().catch(() => {})
  void loadPrints().catch(() => {})
}

class SceneBoundary extends Component<{ children: ReactNode; cardId: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidUpdate(previous: Readonly<{ children: ReactNode; cardId: string }>) {
    if (this.state.failed && previous.cardId !== this.props.cardId) this.setState({ failed: false })
  }
  render() { return this.state.failed ? null : this.props.children }
}

type Selection = { index: number }

export function CardViewer({ selection, opener, onDismiss, onStep }: {
  selection: Selection
  opener: HTMLButtonElement
  onDismiss: () => void
  onStep: (direction: number) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState<number | null>(null)
  const { index } = selection
  const entry = gallery[index]
  const [print, setPrint] = useState<{ index: number; card: TechCard } | null>(null)
  const card = print?.index === index ? print.card : null
  const activeIndex = useRef(index)
  const onReady = useCallback(() => {
    if (activeIndex.current === index) setReady(index)
  }, [index])

  useLayoutEffect(() => { activeIndex.current = index; setReady(null) }, [index])

  useEffect(() => {
    let active = true
    let frame: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    void loadPrints().then(({ preparePrint }) => {
      if (!active) return
      // Let the cached thumbnail paint before generating the detailed plates.
      frame = requestAnimationFrame(() => {
        timer = setTimeout(() => {
          if (active) setPrint({ index, card: preparePrint(index) })
        }, 0)
      })
    }).catch(() => { /* Keep the cached thumbnail if loading fails. */ })
    return () => {
      active = false
      if (frame !== undefined) cancelAnimationFrame(frame)
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [index])

  useLayoutEffect(() => {
    const viewer = dialog.current!
    const art = frame.current!
    const from = opener.getBoundingClientRect()
    viewer.showModal()
    let lift: Animation | undefined
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const to = art.getBoundingClientRect()
      const dx = from.left + from.width / 2 - to.left - to.width / 2
      const dy = from.top + from.height / 2 - to.top - to.height / 2
      lift = art.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${from.height / (to.height * .916)})` },
        { transform: 'none' },
      ], { duration: 380, easing: 'cubic-bezier(.22,.8,.25,1)' })
    }
    return () => {
      lift?.cancel()
      viewer.close()
      opener.focus({ preventScroll: true })
    }
  }, [opener])

  return (
    <dialog ref={dialog} className="tech-viewer" aria-labelledby="card-viewer-title"
      onCancel={event => { event.preventDefault(); onDismiss() }}
      onClick={event => { if (event.target === event.currentTarget) onDismiss() }}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          onDismiss()
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          onStep(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}>
      <div className="tech-inspect">
        <button className="tech-close" type="button" onClick={onDismiss} aria-label="关闭大图">×</button>
        <div className="tech-frame" ref={frame} role="img" aria-label={entry.name + ' 全息卡面'}>
          {ready !== index && <>
            <img className="tech-print" src={entry.thumbnail} alt="" />
            {card && <img className="tech-print" src={card.face} alt="" />}
          </>}
          <SceneBoundary cardId={entry.id}><Suspense fallback={null}>
            <CardScene card={card} visible={card !== null && ready === index} onReady={onReady} onTap={onDismiss} />
          </Suspense></SceneBoundary>
        </div>
        <div className="tech-pages">
          <button type="button" aria-label="上一张卡" onClick={() => onStep(-1)}>←</button>
          <div aria-live="polite">
            <h2 id="card-viewer-title">{entry.name}</h2>
            <p>{entry.role}</p>
          </div>
          <button type="button" aria-label="下一张卡" onClick={() => onStep(1)}>→</button>
        </div>
      </div>
    </dialog>
  )
}
