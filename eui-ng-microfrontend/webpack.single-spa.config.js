const path = require('path');
const AssetUrlReplacerPlugin = require('./webpack-plugins/asset-url-replacer.plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.single-spa.ts',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      extensions: ['.ts', '.js', '.mjs', '.json'],
      mainFields: ['es2020', 'es2015', 'module', 'main'],

      // Windows-compatible ESM module resolution
      fullySpecified: false,
      fallback: {
        "path": false,
        "fs": false,
        "crypto": false
      }
    },
    module: {
      rules: [
        // Compile TS then inline component templates/styles for JIT (Windows-compatible)
        {
          test: /\.ts$/,
          exclude: (input) => {
            const nodeModulesPath = path.resolve(__dirname, 'node_modules');
            const euiPath = path.resolve(nodeModulesPath, '@eui');
            const angularPath = path.resolve(nodeModulesPath, '@angular');
            const ngxTranslatePath = path.resolve(nodeModulesPath, '@ngx-translate');
            const rxjsPath = path.resolve(nodeModulesPath, 'rxjs');
            const zoneJsPath = path.resolve(nodeModulesPath, 'zone.js');
            const tslibPath = path.resolve(nodeModulesPath, 'tslib');
            
            return input.includes(nodeModulesPath) && 
                   !input.includes(euiPath) && 
                   !input.includes(angularPath) && 
                   !input.includes(ngxTranslatePath) && 
                   !input.includes(rxjsPath) && 
                   !input.includes(zoneJsPath) && 
                   !input.includes(tslibPath);
          },
          use: [
            { loader: 'ts-loader', options: { transpileOnly: true } },
            { loader: 'angular2-template-loader' }
          ]
        },
        // Handle JavaScript and Module files from EUI packages (Windows-compatible)
        {
          test: /\.m?js$/,
          include: path.resolve(__dirname, 'node_modules', '@eui'),
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                cacheDirectory: true
              }
            }
          ]
        },

        // Handle EUI module files specifically (Windows-compatible)
        {
          test: /\.mjs$/,
          include: path.resolve(__dirname, 'node_modules', '@eui'),
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false
          }
        },

        // Inline component HTML templates referenced via templateUrl
        { test: /\.html$/, use: [{ loader: 'raw-loader', options: { esModule: false } }] },
        // Handle assets: fonts, images, icons
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash][ext]'
          }
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext]'
          }
        },
        // Global CSS from imports (EUI styles) (Windows-compatible)
        {
          test: /\.css$/,
          include: path.resolve(__dirname, 'node_modules', '@eui'),
          use: [
            'style-loader', 
            {
              loader: 'css-loader',
              options: {
                url: false // Disable URL processing since we'll serve assets via webpack devServer
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    function(root) {
                      // Simple PostCSS plugin to fix remaining EUI asset URLs
                      root.walkDecls(decl => {
                        if (decl.value.includes('@eui/styles/dist/assets/')) {
                          // Rewrite to simple assets path served by webpack
                          decl.value = decl.value.replace(/@eui\/styles\/dist\/assets\//g, 'http://localhost:4300/assets/');
                        }
                      });
                    }
                  ]
                }
              }
            }
          ]
        },
        // Component CSS/SCSS referenced via styleUrls (inlined) (Windows-compatible)
        {
          test: /\.css$/,
          exclude: path.resolve(__dirname, 'node_modules', '@eui'),
          use: ['to-string-loader', 'css-loader']
        },
        { test: /\.scss$/, use: ['to-string-loader', 'css-loader', 'sass-loader'] }
      ],
    },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist-mfe'),
      libraryTarget: 'system',
      // Set publicPath to microfrontend server for asset loading
      publicPath: 'http://localhost:4300/',
      clean: true, // Clean dist-mfe folder before each build
    },

    devServer: {
      port: 4300,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:8000',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Csrf-Token, Cache-Control, Pragma, Expires',
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
        // Serve EUI assets directly from node_modules (simple approach)
        {
          directory: path.resolve(__dirname, 'node_modules', '@eui', 'styles', 'dist', 'assets'),
          publicPath: '/assets',
        },
      ],
      client: {
        webSocketURL: 'ws://localhost:4300/ws',
      },

    },
    plugins: [
      new AssetUrlReplacerPlugin()
    ],
  };
};


