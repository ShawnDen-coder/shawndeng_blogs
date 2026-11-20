import path from 'node:path'
import { parseDocument, LineCounter } from 'yaml'

const keys = ['id', 'name', 'group', 'role', 'inscription', 'paper', 'ocean', 'foil', 'emblem', 'ground']

export function cardDataPlugin() {
  const file = path.resolve('src/components/tech-cards/cards.yaml')
  return {
    name: 'tech-card-data',
    enforce: 'pre',
    transform(source, id) {
      if (id.split('?')[0] !== file) return
      const lines = new LineCounter()
      const doc = parseDocument(source, { lineCounter: lines, uniqueKeys: true })
      if (doc.errors.length) throw new Error(`${file}: ${doc.errors.map(error => error.message).join('\n')}`)
      const entries = doc.toJS()
      const fail = (index, key, message) => {
        const node = doc.getIn([index, key], true) || doc.getIn([index], true)
        const pos = node?.range ? lines.linePos(node.range[0]) : { line: 1, col: 1 }
        throw new Error(`${file}:${pos.line}:${pos.col}: 卡片 ${index + 1}${key ? `，${key}` : ''}: ${message}`)
      }
      if (!Array.isArray(entries) || !entries.length) throw new Error(`${file}: 需要非空卡片列表`)
      const seen = new Set()
      const placements = new Set()
      entries.forEach((card, index) => {
        if (!card || typeof card !== 'object' || Array.isArray(card)) fail(index, '', '需要字段映射')
        for (const key of Object.keys(card)) if (!keys.includes(key) && key !== 'placement') fail(index, key, '未知字段')
        for (const key of keys) if (typeof card[key] !== 'string' || !card[key].trim()) fail(index, key, '需要非空字符串')
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.id)) fail(index, 'id', '请使用小写字母、数字和连字符')
        if (seen.has(card.id)) fail(index, 'id', 'ID 重复')
        seen.add(card.id)
        if (Object.hasOwn(card, 'placement')) {
          if (!['lead', 'behind', 'aside', 'outer'].includes(card.placement)) fail(index, 'placement', '可选值为 lead、behind、aside、outer')
          if (placements.has(card.placement)) fail(index, 'placement', `首页槽位重复：${card.placement}`)
          placements.add(card.placement)
        }
        for (const key of ['paper', 'ocean', 'foil']) if (!/^#[0-9a-f]{6}$/i.test(card[key])) fail(index, key, '请使用六位十六进制颜色，例如 "#123abc"')
      })
      const locations = entries.map((_, index) => Object.fromEntries(['emblem', 'ground'].map(key => {
        const node = doc.getIn([index, key], true)
        const pos = lines.linePos(node.range[0])
        return [key, `${pos.line}:${pos.col}`]
      })))
      return { code: `export const locations = ${JSON.stringify(locations)}; export default ${JSON.stringify(entries)};`, map: null }
    },
  }
}
