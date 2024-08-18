const withNextra = require('nextra')('nextra-theme-blog', './theme.config.js')


const cfg = {
  ...withNextra(),
  basePath: '/shawndeng_blogs',
  output: "export",
  images: {
    unoptimized: true,
  }

}

module.exports = cfg
