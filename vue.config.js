const path = require('path')
const fs = require('fs')
// var Components = require('./components.json');

function resolve (dir) {
  return path.join(__dirname, './', dir)
}

module.exports = {
  productionSourceMap: process.env.Component === 'component' ? false : true,
  outputDir: process.env.Component === 'component' ? 'lib' : 'dist',
  configureWebpack: config => {
    if (process.env.Component === 'component') {
      config.plugins = config.plugins.filter(item  => {
        return ['HtmlWebpackPlugin', 'CopyPlugin', 'ESLintWebpackPlugin', 'PreloadPlugin'].indexOf(item.constructor.name) === -1
      })
      config.performance = {
        hints: false
      }
      config.stats = {
        children: false
      }
      config.optimization = {
        minimize: true
      }
      /*
      var Components = {
        "index": "./packages"
      }
      var ComponentsPath = './packages'
      const files = fs.readdirSync(ComponentsPath)
      files.forEach(function (item) {
          let p = ComponentsPath + "/" + item
          let stat = fs.lstatSync(p)
          if (stat.isDirectory() === true && ['style'].indexOf(item) == -1) { 
            Components[item] = p
          }
      })
      */
      config.entry = {
        'index': './packages/index.vue'
      }

      config.externals = {
        vue: 'vue',
        ...config.externals
      }
      config.output.filename = '[name].js'
      config.output.chunkFilename = '[id].js'
      config.output.libraryTarget = 'commonjs2'
    }
    // console.log('plugins', config.module.rules)
  }
}