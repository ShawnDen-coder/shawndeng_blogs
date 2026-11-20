// Local brand marks from Simple Icons v13.21.0 (CC0):
// https://github.com/simple-icons/simple-icons/tree/13.21.0/icons
const marks = import.meta.glob<string>('./marks/*.svg', { eager: true, query: '?raw', import: 'default' })

export function brandMark(slug: string) {
  return marks[`./marks/${slug}.svg`]?.replace('<svg ', '<svg x="182" y="231" width="236" height="236" fill="currentColor" ')
}

// Concept illustrations use the same monochrome printing plate as the brand marks.
function engraving(shapes: string) {
  return `<g transform="translate(300 349)" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`
}

export const symbols = {
  kustomize: engraving('<path d="M-112 -45 0 -105 112 -45 0 15Z M-112 -6 0 54 112 -6 M-112 34 0 94 112 34"/><path d="M-47 -48 -8 -27 54 -61" stroke-width="5"/>'),
  sops: engraving('<rect x="-82" y="-22" width="164" height="120" rx="15"/><path d="M-53 -22v-36a53 53 0 0 1 106 0v36"/><circle cy="23" r="13"/><path d="M0 36v25"/>'),
  external: engraving('<path d="M-94 -29v-47h65 M94 28v48H30 M-45 -94l18 18-18 18 M46 59l-18 17 18 18"/><circle cx="-26" cy="-2" r="33"/><path d="M8 -2h67v19 M48 -2v17"/>'),
  agents: engraving('<rect x="-78" y="-61" width="156" height="128" rx="28"/><path d="M0 -61v-27 M-78 -4h-16 M78 -4h16 M-28 37h56"/><circle cy="-101" r="11"/><g fill="currentColor" stroke="none"><circle cx="-32" cy="-8" r="12"/><circle cx="32" cy="-8" r="12"/></g>'),
  r3f: engraving('<path d="M0 -110 97 -54v110L0 111-97 56V-54Z M-97 -54 0 3l97-57 M0 3v108"/><ellipse rx="132" ry="37" transform="rotate(-26)" stroke-width="5"/>'),
  gitops: engraving('<path d="M-66 -58a88 88 0 0 1 151 53l-19 -19m19 19 15-22 M66 58A88 88 0 0 1 -85 5l-15 22m15-22 19 19"/><path d="M-19 -36v66m0-24q55 0 55-38" stroke-width="6"/><circle cx="-19" cy="-42" r="10"/><circle cx="-19" cy="42" r="10"/><circle cx="36" cy="-42" r="10"/>'),
  devops: engraving('<path d="M0 0C-38 -59 -73 -75 -102 -46C-151 2 -96 88 -39 43L39 -43C96 -88 151 -2 102 46C73 75 38 59 0 0Z" stroke-width="18"/><path d="m-83 -65 20 7-17 13 M83 65l-20-7 17-13" />'),
  pipeline: engraving('<path d="M-93 -55h73q20 0 20 20v70q0 20 20 20h67"/><circle cx="-97" cy="-55" r="18" fill="currentColor"/><path d="M0 -27 27 0 0 27-27 0Z" fill="currentColor"/><circle cx="90" cy="55" r="27"/><path d="m76 55 10 9 17-21" stroke-width="5"/>'),
  iac: engraving('<path d="M-37 -93q-28 0-28 28v32q0 25-25 30 25 5 25 30v38q0 28 28 28 M37 -93q28 0 28 28v32q0 25 25 30-25 5-25 30v38q0 28-28 28"/><path d="M-37 -19 0 -41 37 -19v42L0 44l-37-21Z M-37 -19 0 3l37-22 M0 3v41" stroke-width="4"/>'),
}

function tile(width: number, height: number, lines: string) {
  return `<pattern id="ground" patternUnits="userSpaceOnUse" width="${width}" height="${height}"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${lines}</g></pattern>`
}

export const grounds = {
  traces: tile(80, 72, '<path d="M0 12h21l17 18h42 M0 24h16l18 18h46 M0 58h46l12-12h22"/><circle cx="57" cy="12" r="4"/><path d="M61 12h19"/>'),
  stack: tile(84, 60, '<path d="m0 0 42 18L84 0 M0 9l42 18L84 9 M0 18l42 18 42-18 M0 36l42 18 42-18"/>'),
  lattice: tile(64, 88, '<path d="m0 0 32 44L64 0 M0 88l32-44 32 44 M8 0l24 33L56 0 M8 88l24-33 24 33"/><circle cx="32" cy="44" r="5"/>'),
  cipher: tile(72, 72, '<path d="M6 11h20v17H7v18h39V28h20v33H28 M38 10h28 M8 61h9"/><circle cx="35" cy="61" r="3"/>'),
  flow: tile(96, 60, '<path d="M0 12h25q17 0 23 18t23 18h25 M0 48h25q17 0 23-18t23-18h25"/><circle cx="48" cy="30" r="4"/>'),
  orbit: tile(76, 76, '<g transform="translate(38 38) rotate(-30)"><ellipse rx="35" ry="12"/><ellipse rx="12" ry="35"/><circle r="3"/></g>'),
  facets: tile(84, 72, '<path d="M0 72 42 0l42 72Z M0 0l42 72L84 0 M22 36h40"/>'),
  coils: tile(72, 48, '<path d="M0 0q18 0 18 24t18 24 M36 0q18 0 18 24t18 24 M0 9q10 0 10 15t17 24 M36 9q10 0 10 15t17 24"/>'),
}
