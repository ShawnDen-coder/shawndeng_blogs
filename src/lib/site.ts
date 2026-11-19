export const site = {
  name: 'Shawn Deng',
  origin: 'https://shawnden-coder.github.io',
  x: 'https://x.com/shawndeng1109',
  github: 'https://github.com/ShawnDen-coder'
}

export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
