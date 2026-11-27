import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { photos } from '../lib/photos'
import { pageHead } from '../lib/seo'
import { assetUrl } from '../lib/site'
import '../styles/photos.css'

export const Route = createFileRoute('/photos')({
  head: () => pageHead('摄影', '摄影页面与开放授权的示例照片。', '/photos'),
  component: Photos
})

function Photos() {
  const [active, setActive] = useState<number | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const element = dialog.current
    if (active === null || !element) return
    const scrollY = window.scrollY
    const body = document.body
    const previous = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width }
    Object.assign(body.style, { overflow: 'hidden', position: 'fixed', top: `-${scrollY}px`, width: '100%' })
    element.showModal()
    closeButton.current?.focus()
    return () => {
      element.close()
      Object.assign(body.style, previous)
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      opener.current?.focus({ preventScroll: true })
    }
  }, [active !== null])

  const close = () => { setShowInfo(false); setActive(null) }
  const move = (direction: number) => setActive(current => current === null ? null : (current + direction + photos.length) % photos.length)
  const photo = active === null ? null : photos[active]

  return (
    <section className="photos-page">
      <div className="photos-intro">
        <h1>摄影</h1>
        <p>这里暂时展示开放授权的示例照片，个人作品将在日后加入。</p>
      </div>
      <div className="photo-grid" aria-label="示例照片">
        {photos.map((item, index) => (
          <button className="photo-tile" type="button" key={item.file}
            aria-label={`查看照片：${item.title}`}
            onClick={event => { opener.current = event.currentTarget; setActive(index) }}>
            <img src={assetUrl(`photos/thumbs/${item.file}`)} width={item.width} height={item.height}
              alt={item.title} loading={index < 4 ? 'eager' : 'lazy'} decoding="async" />
          </button>
        ))}
      </div>
      <p className="photos-credit">示例照片来自 Wikimedia Commons，均以 CC0 发布。点击照片查看作者与来源。</p>
      <dialog ref={dialog} className="photo-lightbox" aria-label="照片查看器"
        onCancel={event => { event.preventDefault(); close() }}
        style={photo ? { '--photo-ratio': photo.width / photo.height } as CSSProperties : undefined}
        onClick={event => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
          if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
        }}
        onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } }}
        onTouchEnd={event => {
          const start = touchStart.current
          touchStart.current = null
          if (!start) return
          const touch = event.changedTouches[0]
          const dx = touch.clientX - start.x
          const dy = touch.clientY - start.y
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1)
        }}>
        {photo && <>
          <div className="lightbox-controls">
            <button type="button" aria-label="照片来源" aria-expanded={showInfo} aria-controls="photo-info" onClick={() => setShowInfo(value => !value)}><span aria-hidden="true">ⓘ</span></button>
            <button ref={closeButton} type="button" aria-label="关闭照片查看器" onClick={close}><span aria-hidden="true">×</span></button>
          </div>
          <div className="lightbox-stage">
            <img src={assetUrl(`photos/${photo.file}`)} width={photo.width} height={photo.height} alt={photo.title} />
          </div>
          {showInfo && <p id="photo-info" className="lightbox-info">摄影：{photo.author} · <a href={photo.source} target="_blank" rel="noreferrer">Wikimedia Commons</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a></p>}
        </>}
      </dialog>
    </section>
  )
}
