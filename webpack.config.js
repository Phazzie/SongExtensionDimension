/**
 * @fileoverview Webpack Configuration for VSCode Extension
 * @purpose Bundle extension code for better performance and smaller package size
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

/** @type {import('webpack').Configuration} */
const config = {
  target: 'node', // VSCode extensions run in a Node.js context

  entry: './src/extension.ts', // Entry point of the extension

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },

  devtool: 'source-map',

  externals: {
    vscode: 'commonjs vscode' // The vscode-module is created on-the-fly and must be excluded
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@contracts': path.resolve(__dirname, 'src/contracts'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@ui': path.resolve(__dirname, 'src/ui')
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                module: 'esnext' // Override module for webpack
              }
            }
          }
        ]
      }
    ]
  }
}

module.exports = config
