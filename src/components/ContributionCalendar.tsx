import { useRef, useState, type KeyboardEvent } from 'react'
import calendar from '../../content/github-contributions.json'
import { site } from '../lib/site'

const { days } = calendar
const firstDay = new Date(days[0].date).getUTCDay()
const weeks = Math.ceil((days.length + firstDay) / 7)
const months = days.flatMap((day, index) => {
  const week = Math.floor((index + firstDay) / 7)
  return day.date.endsWith('-01') && week <= weeks - 3
    ? [{ week, label: `${Number(day.date.slice(5, 7))}月` }]
    : []
})

export function ContributionCalendar() {
  const [selected, setSelected] = useState<number | null>(null)
  const [focusDay, setFocusDay] = useState(days.length - 1)
  const grid = useRef<HTMLDivElement>(null)
  const active = selected === null ? null : days[selected]
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offsets: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowUp: -1, ArrowDown: 1 }
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : index + offsets[event.key]
    if (!Number.isFinite(next)) return
    event.preventDefault()
    grid.current?.querySelectorAll('button')[Math.max(0, Math.min(days.length - 1, next))]?.focus()
  }
  return (
    <section className="contributions" aria-labelledby="contributions-heading">
      <div className="section-heading">
        <h2 id="contributions-heading" lang="en">GitHub</h2>
        <a href={site.github}>@{calendar.login} <span aria-hidden="true">↗</span></a>
      </div>
      <figure style={{ '--calendar-weeks': weeks } as React.CSSProperties}>
        <div className="calendar-months" aria-hidden="true">
          {months.map(month => <span key={month.week} style={{ gridColumn: month.week + 1 }}>{month.label}</span>)}
        </div>
        <div className="calendar-days" role="group" aria-label="每日贡献，可用方向键浏览" ref={grid}
          onPointerLeave={() => setSelected(grid.current?.contains(document.activeElement) ? focusDay : null)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSelected(null) }}>
          {days.map((day, index) => (
            <button type="button" key={day.date} data-level={day.level}
              style={index === 0 ? { gridRowStart: firstDay + 1 } : undefined}
              aria-label={`${day.date}，${day.count} 次贡献`}
              tabIndex={index === focusDay ? 0 : -1}
              onFocus={() => { setFocusDay(index); setSelected(index) }}
              onPointerEnter={() => setSelected(index)}
              onClick={() => setSelected(index)}
              onKeyDown={event => move(event, index)} />
          ))}
        </div>
        <figcaption>
          <span>{active ? `${active.date} · ${active.count} 次贡献` : `过去一年 · ${calendar.total.toLocaleString('en-US')} 次贡献`}</span>
          <span>截至 <time dateTime={days[days.length - 1].date}>{days[days.length - 1].date}</time></span>
        </figcaption>
      </figure>
    </section>
  )
}
