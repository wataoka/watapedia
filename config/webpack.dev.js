/**
 * @author: Yuki Takei <yuki@weseek.co.jp>
 */

/*
 * Webpack Plugins
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

const helpers = require('../src/lib/util/helpers');

/**
 * Webpack Constants
 */
const { ANALYZE } = process.env;

module.exports = require('./webpack.common')({
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: {
    'js/dev': './src/client/js/dev',
  },
  resolve: {
    modules: ['../node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true } },
        ],
        exclude: [
          helpers.root('src/client/styles/hackmd'),
          helpers.root('src/client/styles/scss/style-presentation.scss'),
        ],
      },
      { // Dump CSS for HackMD
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
        include: [
          helpers.root('src/client/styles/hackmd'),
          helpers.root('src/client/styles/scss/style-presentation.scss'),
        ],
      },
    ],
  },
  plugins: [

    new MiniCssExtractPlugin({
      filename: '[name].bundle.css',
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: ANALYZE ? 'server' : 'disabled',
    }),

    new HardSourceWebpackPlugin(),
    new HardSourceWebpackPlugin.ExcludeModulePlugin([
      {
        // see https://github.com/mzgoddard/hard-source-webpack-plugin/blob/master/README.md#excludemoduleplugin
        test: /mini-css-extract-plugin[\\/]dist[\\/]loader/,
      },
    ]),

  ],
  optimization: {},
  performance: {
    hints: false,
  },

});
