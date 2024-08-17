const withNextra = require('nextra')('nextra-theme-blog', './theme.config.js')


const cfg = {
  ...withNextra(),
  images: {
    unoptimized: true,
  },
  distDir: 'docs',
}

module.exports = cfg