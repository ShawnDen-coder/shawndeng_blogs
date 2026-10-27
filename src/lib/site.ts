export const site = {
  name: 'Shawn Deng',
  origin: 'https://shawnden-coder.github.io',
  github: 'https://github.com/ShawnDen-coder'
}

export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
