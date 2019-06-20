const webpack = require('webpack');
const path = require('path');
const { NODE_ENV } = process.env;

const config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: NODE_ENV == 'development' ? 'ezslider.js' : 'ezslider.min.js'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.sass$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: [
      '.tsx',
      '.ts',
      '.js'
    ]
  },
  
  devServer: {
    host: '0.0.0.0',
    contentBase: path.join(__dirname, 'dist'),
    port: 3000
  }
}

module.exports = config;