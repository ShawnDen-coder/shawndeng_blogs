function normalizeTags(tags, tag) {
  const value = tags ?? tag
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

module.exports = {normalizeTags}
