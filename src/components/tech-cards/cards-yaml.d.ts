declare module '*.yaml' {
  const cards: Array<{
    id: string; name: string; group: string; role: string; inscription: string
    paper: string; ocean: string; foil: string; emblem: string; ground: string
    placement?: 'lead' | 'behind' | 'aside' | 'outer'
  }>
  export const locations: Array<{ emblem: string; ground: string }>
  export default cards
}
