import { assetUrl, site } from './site'

export function pageHead(title: string, description: string, path: string) {
  const fullTitle = `${title} — ${site.name}`
  const url = `${site.origin}${assetUrl(path)}`
  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: `${site.origin}${assetUrl('og.svg')}` }
    ],
    links: [{ rel: 'canonical', href: url }]
  }
}
