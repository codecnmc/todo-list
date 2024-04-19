"use strict";

process.env.BABEL_ENV = "renderer";

const path = require("path");
const { dependencies } = require("../../package.json");
const webpack = require("webpack");

const MinifyPlugin = require("babel-minify-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = ["vue", "vuetify", "vue-contextmenujs"];

let rendererConfig = {
  devtool: "#cheap-module-eval-source-map",
  entry: {
    renderer: path.join(__dirname, "../../src/renderer/main.js"),
  },
  externals: [...Object.keys(dependencies || {}).filter((d) => !whiteListedModules.includes(d))],
  module: {
    rules: [
      {
        test: /\.s(c|a)ss$/,
        use: ["vue-style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.css$/,
        use: ["vue-style-loader", "css-loader"],
      },
      {
        test: /\.html$/,
        use: "vue-html-loader",
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@vue/cli-plugin-babel/preset"],
          },
        },
      },
      {
        test: /\.node$/,
        use: "node-loader",
      },
      {
        test: /\.vue$/,
        use: {
          loader: "vue-loader",
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: "url-loader",
          query: {
            limit: 10000,
            name: "imgs/[name]--[folder].[ext]",
          },
        },
      },
    ],
  },
  node: {
    __dirname: process.env.NODE_ENV !== "production",
    __filename: process.env.NODE_ENV !== "production",
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({ filename: "styles.css" }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.resolve(__dirname, "../../src/index.ejs"),
      title: require("../../package.json").name,
      templateParameters(compilation, assets, options) {
        return {
          compilation: compilation,
          webpack: compilation.getStats().toJson(),
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            files: assets,
            options: options,
          },
          process,
        };
      },
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
      nodeModules: process.env.NODE_ENV !== "production" ? path.resolve(__dirname, "../../node_modules") : false,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      __static: `"${path.join(__dirname, "../../static").replace(/\\/g, "\\\\")}"`,
    }),
  ],
  output: {
    filename: "[name].js",
    libraryTarget: "commonjs2",
    path: path.join(__dirname, "../../dist/electron"),
  },
  resolve: {
    alias: {
      "@": path.join(__dirname, "../../src/renderer"),
      vue$: "vue/dist/vue.esm.js",
    },
    extensions: [".js", ".vue", ".json", ".css", ".node"],
  },
  target: "electron-renderer",
};

module.exports = rendererConfig;