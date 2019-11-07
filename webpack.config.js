const path = require('path');
var webpack = require("webpack");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TSLintPlugin = require('tslint-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  entry: {
    bundle: path.join(__dirname, '/src/Main.ts'),
  },
  output: {
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      'index': path.resolve(__dirname, './index')
    }
  },
  plugins: [
    new TSLintPlugin({
      files: ['./src/**/*.ts']
    }),
    new CleanWebpackPlugin(),
  ]
};
