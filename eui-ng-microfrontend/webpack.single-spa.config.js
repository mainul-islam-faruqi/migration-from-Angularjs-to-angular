const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.single-spa.ts',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      rules: [
        // Compile TS then inline component templates/styles for JIT
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            { loader: 'ts-loader', options: { transpileOnly: true } },
            { loader: 'angular2-template-loader' }
          ]
        },
        // Inline component HTML templates referenced via templateUrl
        { test: /\.html$/, use: [{ loader: 'raw-loader', options: { esModule: false } }] },
        // Inline component CSS/SCSS referenced via styleUrls
        { test: /\.css$/, use: ['to-string-loader', 'css-loader'] },
        { test: /\.scss$/, use: ['to-string-loader', 'css-loader', 'sass-loader'] }
      ],
    },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist-mfe'),
      libraryTarget: 'system',
      publicPath: 'http://localhost:4300/',
    },
    devServer: {
      port: 4300,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:8000',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Csrf-Token',
      },
      allowedHosts: 'all',
      historyApiFallback: true,
      hot: true,
      liveReload: false,
      static: [
        {
          directory: path.resolve(__dirname, 'dist-mfe'),
        },
        {
          directory: path.resolve(__dirname, 'src/assets'),
          publicPath: '/assets',
        },
        {
          directory: path.resolve(__dirname, 'node_modules/@eui/styles/dist'),
          publicPath: '/eui-styles',
        }
      ],
      client: {
        webSocketURL: 'ws://localhost:4300/ws',
      },
    },
  };
};


