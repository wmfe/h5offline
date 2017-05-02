var path = require('path')
var utils = require('./utils')
var webpack = require('webpack')
var config = require('../config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var BdwmOfflineConfig = require('bdwm-offline-config')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

var buildConfig = process.env.BUILD_FOR === 'offline'
  ? config.offline
  : config.build

var env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : buildConfig.env

Object.keys(baseWebpackConfig.entry).forEach(function (name) {
  baseWebpackConfig.entry[name] = [
    // 'vconsole/dist/vconsole.min.js', // 虚拟控制台
    './src/utils/wmlog.js'
  ].concat(baseWebpackConfig.entry[name])
})

var webpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({
      sourceMap: buildConfig.productionSourceMap,
      extract: true
    })
  },
  devtool: buildConfig.productionSourceMap ? '#source-map' : false,
  output: {
    path: buildConfig.assetsRoot,
    filename: utils.assetsPath(
      buildConfig.assetsHash ? '[name].[chunkhash:5].js' : '[name].js'
    ),
    chunkFilename: utils.assetsPath(
      buildConfig.assetsHash ? '[id].[chunkhash:5].js' : '[id].js'
    )
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    }),
    new ExtractTextPlugin({
      filename: utils.assetsPath(
        buildConfig.assetsHash ? '[name].[contenthash:5].css' : '[name].css'
      )
    }),
    new OptimizeCSSPlugin(),
    // see https://github.com/ampedandwired/html-webpack-plugin
    ...['index'].map(
      v =>
        new HtmlWebpackPlugin({
          statPrefix: buildConfig.statPrefix,
          filename: process.env.NODE_ENV === 'testing'
            ? 'index.html'
            : v + '.html',
          template: 'src/index.html',
          chunks: ['common', v],
          inject: true,
          minify: {
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: false
          },
          chunksSortMode: 'dependency'
        })
    ),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2
    }),
    new BdwmOfflineConfig({
      id: 'bdwm.plugin.offlinetest',
      output: 'config.json'
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: buildConfig.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})

if (buildConfig.productionGzip) {
  var CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' + buildConfig.productionGzipExtensions.join('|') + ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (buildConfig.bundleAnalyzerReport) {
  var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
