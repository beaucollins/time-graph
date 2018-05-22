const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin'),
	path = require('path');

module.exports = {
	context: path.resolve(__dirname, 'src'),
	entry: {
		index: './index.js',
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	resolve: {
		extensions: [ '.js', '.jsx', '.css', '.scss' ],
		modules: ['src', 'node_modules'],
	},
	module: {
		rules: [
			{ test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' },
			{ test: /\.s?css$/, loader: ['style-loader', 'css-loader', 'sass-loader'] },
		],
	},
	plugins: [
		new webpack.ProvidePlugin({ React: 'react' }),
		new HtmlWebpackPlugin({ title: 'BlockGraph' }),
	],
};
