const withNextra = require('nextra')('nextra-theme-blog', './theme.config.js')


const cfg = {
  ...withNextra(),
  output: "export",
  images: {
    unoptimized: true,
  }

}

module.exports = cfg
