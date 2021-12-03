const path = require('path')

const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'production',
  // mode: "development",
  entry: './src/view/index.tsx',
  output: {
    path: path.resolve(__dirname, 'www/js'),
    filename: 'dist.bundle.js',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
      },
      {
        // Apply rule for .css files
        test: /\.css$/, // Set loaders to transform files.
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { sourceMap: true } },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              sourceMap: true,
              plugins: [require('tailwindcss'), require('autoprefixer')],
            },
          },
        ],
      },
      {
        // Apply rule for images
        test: /\.(png|jpe?g|gif|svg)$/,
        // Set loaders to transform files.
        use: [
          {
            loader: 'url-loader',
          },
        ],
      },
      {
        // Apply rule for fonts files
        test: /\.(woff|woff2|ttf|otf|eot)$/,
        // Set loaders to transform files.
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: '../css/fonts',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.jsx', '.json'],
  },
  plugins: [
    // new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '../css/dist.bundle.css',
    }),
  ],
}
