const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/main.single-spa.ts',
    mode: argv.mode || 'development',
    devServer: {
      port: 4200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      allowedHosts: 'all',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      ],
    },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'system',
      clean: true,
      publicPath: 'http://localhost:4200/',
    },
    externals: isProduction ? [] : [],
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        inject: false,
      }),
    ],
  };
};
