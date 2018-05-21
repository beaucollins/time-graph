const webpack = require('webpack');
const HtmlWebpackPlugin = require( 'html-webpack-plugin' ),
    path = require( 'path' );

module.exports = {
  devtool: 'source-map',
  context: path.resolve( __dirname, 'src' ),
  entry: './index.js',
  output: {
    filename: '[name]-[chunkhash].bundle.js',
  	path: path.resolve( __dirname, 'dist' ) 
  },
  resolve: {
    extensions: [ '.js', '.jsx', '.css', '.scss' ],
    modules: ['src', 'node_modules']
  },
  mode: 'development',
  module: {
    rules: [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.s?css$/, loader: ['style-loader', 'css-loader', 'sass-loader'] }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({ React: 'react' }),
    new HtmlWebpackPlugin( { title: 'BlockGraph' } )
  ]
};