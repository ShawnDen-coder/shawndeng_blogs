import { brandMark, grounds, symbols } from './engraving'
import metadata, { locations } from './cards.yaml'

type CardPrint = {
  id: string
  name: string
  group: string
  role: string
  inscription: string
  paper: string
  ocean: string
  foil: string
  emblem: string
  ground: string
  placement?: 'lead' | 'behind' | 'aside' | 'outer'
}

function repeat(count: number, draw: (index: number) => string) {
  return Array.from({ length: count }, (_, index) => draw(index)).join('')
}

// All engraved motifs and the foil plate share the same print coordinates.
const wheel = `<g transform="translate(300 349)">
  <circle r="108" fill="none" stroke="currentColor" stroke-width="17"/>
  <circle r="108" fill="none" stroke="#23384c" stroke-width="2"/>
  ${repeat(7, i => `<g transform="rotate(${(360 / 7) * i})">
    <path d="M-8 -18 L-5 -87 Q-5 -95 -10 -102 L-9 -111 Q-5 -118 -5 -129 L-8 -137 Q-9 -145 0 -146 Q9 -145 8 -137 L5 -129 Q5 -118 9 -111 L10 -102 Q5 -95 5 -87 L8 -18 Z" fill="currentColor"/>
    <path d="M0 -30 V-97 M0 -119 V-140" stroke="#36586b" stroke-width="2"/>
  </g>`)}
  <circle r="30" fill="currentColor"/><circle r="19" fill="#173447"/><circle r="10" fill="currentColor"/>
</g>`

const sail = `<g transform="translate(300 350)" fill="currentColor" stroke="#214b4a" stroke-width="3" stroke-linejoin="round">
  <path d="M-104 56 Q-30 7 20 -143 Q40 -42 14 48 Z"/>
  <path d="M22 -131 Q72 -61 102 42 L33 47 Q53 -44 22 -131Z"/>
  <path d="M-136 76 L134 52 L97 91 L-80 109 Z"/>
  ${repeat(12, i => `<path d="M${-91 + i * 8} ${49 - i} Q4 -34 19 -113" fill="none" stroke-width="1.4"/>`)}
  <path d="M-88 86 L93 67" fill="none"/>
</g>`

// These tiles repeat in print space. The same plate registers the ink and foil.
const clusterGround = `<pattern id="ground" patternUnits="userSpaceOnUse" width="76" height="132">
  <g fill="none" stroke="currentColor" stroke-linejoin="round">
    <path stroke-width="2.3" d="M0 0l38 22v44L0 88l-38-22V22Z M76 0l38 22v44L76 88 38 66V22Z M38 66l38 22v44l-38 22L0 132V88Z"/>
    <path stroke-width="1.2" d="M0 44l38-22m0 44L0 44v44 M76 44L38 22m0 44l38-22v44 M38 110L0 88m76 0l-38 22v22"/>
    <circle cy="44" r="4"/><circle cx="76" cy="44" r="4"/><circle cx="38" cy="110" r="4"/>
  </g></pattern>`

const tideGround = `<pattern id="ground" patternUnits="userSpaceOnUse" width="96" height="48">
  <g fill="none" stroke="currentColor" stroke-width="1.8">
    ${[[-48, 24], [48, 24], [0, 48], [96, 48], [48, 72]].map(([x, y]) =>
      `<g transform="translate(${x} ${y})">${[12, 20, 28, 36, 44].map(r =>
        `<path d="M${-r} 0a${r} ${r} 0 0 1 ${r * 2} 0"/>`).join('')}</g>`
    ).join('')}
  </g></pattern>`

const emblems: Record<string, string> = { wheel, sail, ...Object.fromEntries(Object.entries(symbols).map(([key, value]) => [`symbol:${key}`, value])) }
const patterns: Record<string, string> = { cluster: clusterGround, tide: tideGround, ...grounds }

export const techCards: CardPrint[] = metadata.map((card, index) => {
  const emblem = card.emblem.startsWith('mark:')
    ? brandMark(card.emblem.slice(5))
    : Object.hasOwn(emblems, card.emblem) ? emblems[card.emblem] : undefined
  const ground = Object.hasOwn(patterns, card.ground) ? patterns[card.ground] : undefined
  const missing = (field: 'emblem' | 'ground') => {
    throw new Error(`src/components/tech-cards/cards.yaml:${locations[index][field]}: 卡片 ${index + 1}（${card.id}），${field}: 素材不存在：${card[field]}`)
  }
  return { ...card, emblem: emblem ?? missing('emblem'), ground: ground ?? missing('ground') }
})

export const cardGroups = [...new Set(techCards.map(card => card.group))]


// YAML copy is text inside SVG, never markup.
function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!)
}

function svg(body: string) {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">${body}</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup)
}

export function preparePrint(index: number, thumbnail = false) {
  const card = techCards[index]
  const serial = String(index + 1).padStart(2, '0')
  const rings = `<g transform="translate(300 349)" fill="none" stroke="currentColor">
    <circle r="178"/><circle r="183"/><circle r="205" stroke-dasharray="2 8"/>
    ${thumbnail ? '<circle r="187" stroke-width="6" stroke-dasharray="2 18"/>' : repeat(90, i => `<path transform="rotate(${i * 4})" d="M0 -184v${i % 5 === 0 ? -11 : -4}"/>`)}
  </g>`
  const waves = repeat(thumbnail ? 12 : 42, line => {
    const row = thumbnail ? line * 3.5 : line
    const points = Array.from({ length: thumbnail ? 21 : 71 }, (_, i) => {
      const x = i * (thumbnail ? 32 : 9) - 15
      const y = 483 + row * 3.3 + 22 * Math.sin(x / 85 + row * 0.073)
        + 13 * Math.sin(x / 43 - row * 0.11) + 0.28 * (180 - Math.min(x, 600 - x))
      return `${i ? 'L' : 'M'}${x} ${y.toFixed(1)}`
    }).join(' ')
    return `<path d="${points}"/>`
  })
  const engraving = `<g clip-path="url(#window)">
    ${rings}
    <g fill="none" stroke="currentColor" stroke-width="1.65" opacity=".73">${waves}</g>
    ${card.emblem}
  </g>`
  const defs = `<defs>
    <clipPath id="window"><rect x="34" y="112" width="532" height="480" rx="2"/></clipPath>
    <radialGradient id="sea" cx=".5" cy=".38" r=".8"><stop stop-color="${card.ocean}"/><stop offset="1" stop-color="${card.paper}"/></radialGradient>
    <linearGradient id="rim" x2=".85" y2="1"><stop stop-color="#a3adb2"/><stop offset=".22" stop-color="${card.foil}"/><stop offset=".45" stop-color="#587b8e"/><stop offset=".72" stop-color="#d8dfdc"/><stop offset="1" stop-color="#859199"/></linearGradient>
  </defs>`
  const borders = '<rect x="8" y="8" width="584" height="824" rx="27" fill="none" stroke="currentColor" stroke-width="7"/><rect x="19" y="19" width="562" height="802" rx="19" fill="none" stroke="currentColor"/>'
  const groundPlate = (color: string) => `<defs color="${color}">${card.ground}</defs>
    <rect x="34" y="112" width="532" height="480" fill="url(#ground)"/>`
  const face = svg(`${defs}<rect width="600" height="840" rx="34" fill="url(#rim)"/>
    <rect x="11" y="11" width="578" height="818" rx="23" fill="${card.paper}"/>
    <g color="${card.foil}">${borders}</g>
    <rect x="34" y="112" width="532" height="480" fill="url(#sea)" stroke="${card.foil}"/>
    <g opacity=".43">${groundPlate(card.foil)}</g>
    <circle cx="300" cy="349" r="166" fill="${card.paper}" opacity=".65"/>
    <g color="${card.foil}">${engraving}</g>
    <g fill="${card.foil}" font-family="Arial, sans-serif" font-size="19" letter-spacing="3">
      <text x="37" y="77">HOMELAB COLLECTION</text><text x="563" y="77" text-anchor="end">Nº ${serial}</text>
    </g>
    <text x="36" y="684" fill="#fff5df" font-family="Georgia, serif" font-size="${Math.min(77, 910 / card.name.length)}">${escapeXml(card.name)}</text>
    <text x="40" y="732" fill="${card.foil}" font-family="Arial, sans-serif" font-size="27">${escapeXml(card.inscription)}</text>
    <path d="M38 761 H562" stroke="${card.foil}" opacity=".6"/>
    <g fill="${card.foil}" font-family="Arial, sans-serif" font-size="17" letter-spacing="2">
      <text x="39" y="798">SHAWN DENG</text><text x="561" y="798" text-anchor="end">SD / ${serial}</text>
    </g>`)
  // R = polished metal, G = etched ground, B = the illustration window.
  const mask = thumbnail ? '' : svg(`${defs}<rect width="600" height="840" fill="black"/>
    <rect x="34" y="112" width="532" height="480" fill="blue"/>${groundPlate('#00ffff')}
    <circle cx="300" cy="349" r="166" fill="blue" opacity=".72"/>
    <g color="red">${borders}${engraving}</g>`)
  return { id: card.id, name: card.name, role: card.role, face, mask }
}

export type TechCard = ReturnType<typeof preparePrint>
