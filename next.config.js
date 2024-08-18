const withNextra = require('nextra')('nextra-theme-blog', './theme.config.js')

const isProd = process.env.NODE_ENV === 'production'

const cfg = {
  ...withNextra(),
  basePath: isProd ? '/shawndeng_blogs' : "",
  output: "export",
  images: {
    unoptimized: true,
  }

}

module.exports = cfg
