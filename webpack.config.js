const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: './lib/index',
  context: __dirname,
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: 'atom.js'
  },
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
}