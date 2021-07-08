/* eslint-disable no-undef */
const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const { extendDefaultPlugins } = require("svgo");


const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
const filename = (ext) => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

const optimization = () => {
  const configObj = {
    splitChunks: {
      chunks: 'all'
    }
  }
  
  if (isProd) {
    configObj.minimize = true;
    configObj.minimizer = [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ]
  }
  
  return configObj;
}

const plugins = () => {
  const basePlugins = [
    new HTMLWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html',
      minify: {
        collapseWhitespace: isProd 
      },
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `./css/${filename('css')}`
    }),
    new CopyWebpackPlugin({
      patterns: [{
        from: path.resolve(__dirname, 'src/assets'),
        to: path.resolve(__dirname, 'app/assets')
      }]      
    }),
  ]
  
  if (isProd) {
    basePlugins.push(

      // <-- Image minimaizer here --> 
      new ImageMinimizerPlugin({
        minimizerOptions: {
          // Lossless optimization with custom option
          // Feel free to experiment with options for better result for you
          plugins: [
            ["gifsicle", { interlaced: true }],
            ["jpegtran", { progressive: true }],
            ["optipng", { optimizationLevel: 5 }],
            // Svgo configuration here https://github.com/svg/svgo#configuration
            [
              "svgo",
              {
                plugins: extendDefaultPlugins([
                  {
                    name: "removeViewBox",
                    active: false,
                  },
                  {
                    name: "addAttributesToSVGElement",
                    params: {
                      attributes: [{ xmlns: "http://www.w3.org/2000/svg" }],
                    },
                  },
                ]),
              },
            ],
          ],
        },
      }),


    )
  }

  return basePlugins
}

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: './js/main.js',
  output: {
    path: path.resolve(__dirname, 'app'),
    filename: `./js/${filename('js')}`,
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'app'),
    compress: true,
    port: 9000,
    open: true,
    hot: true,
    historyApiFallback: true,
  },
  plugins: plugins(),
  devtool: isProd ? false : 'source-map',
  optimization: optimization(),
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", 'sass-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: () => {
            return isDev ? 'img/[name][ext]' : 'img/[name].[contenthash][ext]';
          }
        }
      },
      {
        test: /\.(?:|woff|eot|woff2|ttf|otf|fnt|fon)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./fonts/${filename('[ext]')}`
          }
        }],
      },
    ],
  },
};
