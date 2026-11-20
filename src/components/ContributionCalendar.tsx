import { memo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import calendar from '../../content/github-contributions.json'

const { days } = calendar
const firstDay = new Date(days[0].date).getUTCDay()
const weeks = Math.ceil((days.length + firstDay) / 7)
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const months = days.flatMap((day, index) => {
  const week = Math.floor((index + firstDay) / 7)
  return day.date.endsWith('-01') && week <= weeks - 3
    ? [{ week, label: monthNames[Number(day.date.slice(5, 7)) - 1] }]
    : []
})

const CalendarGrid = memo(function CalendarGrid({ setSelected }: { setSelected: Dispatch<SetStateAction<number | null>> }) {
  const grid = useRef<HTMLDivElement>(null)
  const focusDay = useRef(days.length - 1)
  const dayIndex = (target: EventTarget) => target instanceof HTMLButtonElement ? Number(target.dataset.index) : NaN
  return (
    <div className="calendar-days" role="group" aria-label="每日贡献，可用方向键浏览" ref={grid}
      onPointerLeave={event => { if (event.pointerType !== 'touch') setSelected(grid.current?.contains(document.activeElement) ? focusDay.current : null) }}
      onPointerOver={event => { const index = dayIndex(event.target); if (event.pointerType !== 'touch' && Number.isFinite(index)) setSelected(index) }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSelected(null) }}
      onFocus={event => {
        const index = dayIndex(event.target)
        if (!Number.isFinite(index)) return
        const buttons = event.currentTarget.querySelectorAll('button')
        buttons[focusDay.current].tabIndex = -1
        buttons[index].tabIndex = 0
        focusDay.current = index
        setSelected(index)
      }}
      onClick={event => { const index = dayIndex(event.target); if (Number.isFinite(index)) setSelected(index) }}
      onKeyDown={event => {
        const index = dayIndex(event.target)
        const offsets: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowUp: -1, ArrowDown: 1 }
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : index + offsets[event.key]
        if (!Number.isFinite(next)) return
        event.preventDefault()
        event.currentTarget.querySelectorAll('button')[Math.max(0, Math.min(days.length - 1, next))]?.focus()
      }}>
      {days.map((day, index) => (
        <button type="button" key={day.date} data-level={day.level} data-index={index}
          style={index === 0 ? { gridRowStart: firstDay + 1 } : undefined}
          aria-label={`${day.date}，${day.count} 次贡献`}
          tabIndex={index === days.length - 1 ? 0 : -1} />
      ))}
    </div>
  )
})

export function ContributionCalendar() {
  const [selected, setSelected] = useState<number | null>(null)
  const active = selected === null ? null : days[selected]
  return (
    <section className="contributions" aria-label="GitHub 贡献日历">
      <figure style={{ '--calendar-weeks': weeks } as React.CSSProperties}>
        <div className="calendar-months" aria-hidden="true">
          {months.map(month => <span key={month.week} style={{ gridColumn: month.week + 1 }}>{month.label}</span>)}
        </div>
        <CalendarGrid setSelected={setSelected} />
        <figcaption className="calendar-detail" aria-live="polite">
          {active ? `${active.date} · ${active.count} 次贡献` : null}
        </figcaption>
      </figure>
    </section>
  )
}
