// GitHub's public profile calendar uses its own contribution counts and levels.
import { readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const login = 'ShawnDen-coder'
const url = `https://github.com/users/${login}/contributions`
const destination = new URL('../content/github-contributions.json', import.meta.url)

function parseCalendar(html) {
  const counts = new Map()
  for (const [, attributes, label] of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
    const id = attributes.match(/\bfor="([^"]+)"/)?.[1]
    const count = label.trim().match(/^(No|[\d,]+) contributions? on\b/i)?.[1]
    if (id && count) counts.set(id, count === 'No' ? 0 : Number(count.replaceAll(',', '')))
  }
  const days = []
  for (const [cell] of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/g)) {
    const date = cell.match(/\bdata-date="(\d{4}-\d\d-\d\d)"/)?.[1]
    const level = cell.match(/\bdata-level="([0-4])"/)?.[1]
    const count = counts.get(cell.match(/\bid="([^"]+)"/)?.[1])
    if (!date || level === undefined || count === undefined) throw Error('Incomplete contribution day')
    days.push({ date, count, level: Number(level) })
  }
  days.sort((a, b) => a.date.localeCompare(b.date))
  const total = html.match(/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions?\b/i)?.[1]
  if (!total || days.length < 365 || days.length > 378 || days.some((day, i) =>
    i > 0 && Date.parse(day.date) - Date.parse(days[i - 1].date) !== 86400000
  )) throw Error('Invalid annual contribution calendar')
  return { login, total: Number(total.replaceAll(',', '')), days }
}

const response = await fetch(url, {
  headers: { 'Accept-Language': 'en', 'User-Agent': 'shawndeng-blogs' },
  signal: AbortSignal.timeout(15000)
})
if (!response.ok) throw Error(`GitHub calendar returned ${response.status}`)
const calendar = parseCalendar(await response.text())
const previous = await readFile(destination, 'utf8').catch(error => {
  if (error.code !== 'ENOENT') throw error
})
if (previous && JSON.parse(previous).days.at(-1).date > calendar.days.at(-1).date)
  throw Error('GitHub returned an older calendar')
const file = `{"login":"${login}","total":${calendar.total},"days":[\n${calendar.days.map(day => JSON.stringify(day)).join(',\n')}\n]}\n`
const temporary = new URL(`./.calendar-${randomUUID()}.tmp`, destination)
await writeFile(temporary, file)
await rename(temporary, destination)
console.log(`Updated ${login}: ${calendar.days.length} days through ${calendar.days.at(-1).date}`)
