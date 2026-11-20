import { Component, lazy, Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { preparePrint } from './card-prints'

const CardScene = lazy(() => import('./CardScene'))

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
  const card = useMemo(() => preparePrint(index), [index])
  const onReady = useCallback(() => setReady(index), [index])

  useLayoutEffect(() => { setReady(null) }, [index])

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
        <div className="tech-frame" ref={frame} role="img" aria-label={card.name + ' 全息卡面'}>
          {ready !== index && <img className="tech-print" src={card.face} alt="" />}
          <SceneBoundary cardId={card.id}><Suspense fallback={null}>
            <CardScene card={card} onReady={onReady} onTap={onDismiss} />
          </Suspense></SceneBoundary>
        </div>
        <div className="tech-pages">
          <button type="button" aria-label="上一张卡" onClick={() => onStep(-1)}>←</button>
          <div aria-live="polite">
            <h2 id="card-viewer-title">{card.name}</h2>
            <p>{card.role}</p>
          </div>
          <button type="button" aria-label="下一张卡" onClick={() => onStep(1)}>→</button>
        </div>
      </div>
    </dialog>
  )
}
