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
      alias: {
        '@eui/styles/dist/assets': path.resolve(__dirname, 'node_modules/@eui/styles/dist/assets'),
      },
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
        // Compile TS then inline component templates/styles for JIT
        {
          test: /\.ts$/,
          exclude: /node_modules\/(?!@eui|@angular|@ngx-translate|rxjs|zone\.js|tslib)/,
          use: [
            { loader: 'ts-loader', options: { transpileOnly: true } },
            { loader: 'angular2-template-loader' }
          ]
        },
        // Handle JavaScript and Module files from EUI packages
        {
          test: /\.m?js$/,
          include: /node_modules\/@eui/,
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

        // Handle EUI module files specifically
        {
          test: /\.mjs$/,
          include: /node_modules\/@eui/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false
          }
        },
        // Global string replacement for all JavaScript/TypeScript files to fix relative asset URLs
        {
          test: /\.(js|mjs|ts)$/,
          loader: 'string-replace-loader',
          options: {
            multiple: [
              {
                search: '/assets/icons/eui-internals/check.svg',
                replace: 'http://localhost:4300/assets/icons/eui-internals/check.svg'
              },
              {
                search: '/assets/icons/eui-internals/remove.svg',
                replace: 'http://localhost:4300/assets/icons/eui-internals/remove.svg'
              },
              {
                search: '/assets/icons/eui-internals/ellipse.svg',
                replace: 'http://localhost:4300/assets/icons/eui-internals/ellipse.svg'
              },
              {
                search: '/assets/icons/eui-internals/external.svg',
                replace: 'http://localhost:4300/assets/icons/eui-internals/external.svg'
              },
              {
                search: '/assets/icons/eui-internals/chevron-down.svg',
                replace: 'http://localhost:4300/assets/icons/eui-internals/chevron-down.svg'
              }
            ]
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
        // Global CSS from imports (EUI styles)
        {
          test: /\.css$/,
          include: /node_modules\/@eui/,
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
                      // Custom PostCSS plugin to rewrite EUI asset URLs to standard /assets path
                      root.walkDecls(decl => {
                        if (decl.value.includes('@eui/styles/dist/assets/')) {
                          // Rewrite to standard /assets path (served by webpack dev server)
                          decl.value = decl.value.replace(/@eui\/styles\/dist\/assets\//g, '/assets/');
                        }
                      });
                    }
                  ]
                }
              }
            }
          ]
        },
        // Component CSS/SCSS referenced via styleUrls (inlined)
        {
          test: /\.css$/,
          exclude: /node_modules\/@eui/,
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
        // Serve EUI assets from dist-mfe/assets (copied by angular.json)
        {
          directory: path.resolve(__dirname, 'dist-mfe', 'assets'),
          publicPath: '/assets',
        }
      ],
      client: {
        webSocketURL: 'ws://localhost:4300/ws',
      },
      setupMiddlewares: (middlewares, devServer) => {
        // Add EUI asset redirect middleware
        devServer.app.use((req, res, next) => {
          // Redirect @eui/styles paths to /assets (copied by angular.json)
          if (req.url.includes('@eui/styles/dist/assets/')) {
            const newUrl = req.url.replace(/@eui\/styles\/dist\/assets\//g, '/assets/');
            console.log(`🔄 Windows Debug: Redirecting ${req.url} to ${newUrl}`);
            return res.redirect(301, newUrl);
          }
          next();
        });

        // Add custom CORS middleware
        devServer.app.use((req, res, next) => {
          res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
          res.header('Access-Control-Allow-Credentials', 'true');
          res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
          res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Csrf-Token, Cache-Control, Pragma, Expires');
          
          if (req.method === 'OPTIONS') {
            res.sendStatus(200);
          } else {
            next();
          }
        });
        
        return middlewares;
      },
    },
    plugins: [
      new AssetUrlReplacerPlugin()
    ],
  };
};


