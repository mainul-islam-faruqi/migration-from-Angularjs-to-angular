### From scratch: build this setup A→Z

The steps below let you reproduce the entire integration in a clean environment.

#### A) Create a fresh EUI Angular skeleton (MFE)
1) Create folder `eui-ng-microfrontend/` and eUI Skeleton App by eui-cli command. (You can keep this folder outside of the AngularJS app, or inside the AngularJs app):
   - `package.json` (single-spa + dev server scripts)
   - `webpack.single-spa.config.js` (outputs SystemJS bundle, serves assets, enables CORS)
   - `src/main.single-spa.ts` (single-spa lifecycle: bootstrap/mount/unmount)
   - `src/app/app.component.ts` (standalone minimal component)
   - `src/app/app.config.ts` (disable Angular router initial navigation)
   - `src/assets/` (i18n, icons, styles)

2) Example scripts (package.json)
```json
{
  "name": "eui-angular-app",
  "private": true,
  "scripts": {
    "mfe:start": "webpack serve --config webpack.single-spa.config.js --mode development",
    "mfe:build": "webpack --config webpack.single-spa.config.js --mode production"
  }
}
```

3) Example webpack (webpack.single-spa.config.js)
```js
const path = require('path');
module.exports = (_env, argv) => ({
  entry: './src/main.single-spa.ts',
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [
      { test: /\.ts$/, exclude: /node_modules/, use: [{ loader: 'ts-loader', options: { transpileOnly: true } }, 'angular2-template-loader'] },
      { test: /\.html$/, use: [{ loader: 'raw-loader', options: { esModule: false } }] },
      { test: /\.s?css$/, use: ['to-string-loader', 'css-loader', 'sass-loader'] }
    ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist-mfe'),
    libraryTarget: 'system',
    publicPath: 'http://localhost:4300/'
  },
  devServer: {
    port: 4300,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:8000',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Csrf-Token, Cache-Control, Pragma, Expires'
    },
    static: [
      { directory: path.resolve(__dirname, 'dist-mfe') },
      { directory: path.resolve(__dirname, 'src/assets'), publicPath: '/assets' }
    ],
    historyApiFallback: true,
    hot: true,
    liveReload: false,
    allowedHosts: 'all'
  }
});
```

4) Example single-spa entry (src/main.single-spa.ts)
```ts
import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

let appRef: any;
export async function bootstrap() {}
export async function mount(props: any) {
  const dom = props?.domElementGetter ? props.domElementGetter() : document.getElementById('eui-mfe-container');
  if (!dom) throw new Error('EUI MFE: container not found');
  const base = (document.querySelector('base') as HTMLBaseElement) ?? document.head.appendChild(document.createElement('base')) as HTMLBaseElement;
  const originalHref = base.href; base.href = 'http://localhost:4300/';
  dom.innerHTML = '<app-root></app-root>';
  appRef = await bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [ ...(appConfig as any).providers, { provide: LocationStrategy, useClass: HashLocationStrategy } ],
    rootElement: dom.querySelector('app-root') as Element
  });
  (appRef as any).__originalBaseHref = originalHref;
}
export async function unmount() {
  if (appRef) {
    const orig = (appRef as any).__originalBaseHref; const b = document.querySelector('base') as HTMLBaseElement | null;
    if (orig && b) b.href = orig; appRef.destroy(); appRef = null;
  }
}
```

5) Minimal Angular app files (You can keep using the generated files from the eui-cli command)
```ts
// src/app/app.component.ts
import { Component } from '@angular/core';
@Component({ selector: 'app-root', standalone: true, template: `<div>EUI MFE works</div>` })
export class AppComponent {}

// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
export const appConfig: ApplicationConfig = {
  providers: [ provideHttpClient(withInterceptorsFromDi()), provideRouter([], withDisabledInitialNavigation()) ]
};
```

6) Assets (served by packages via devServer)
- No action required if you use the provided `webpack.single-spa.config.js`:
  - It already maps `node_modules/@eui/styles/dist` → `/eui-styles`
  - And `src/assets` → `/assets`
  - EUI CSS can be loaded from `/eui-styles/*` and i18n/icons from `/assets/*`

7) Install & run the MFE
```bash
cd eui-ng-microfrontend
npm install
npm run mfe:start
```

#### B) Wire the AngularJS host (Here every file path reffers to the AngularJS app folder.)
1) In `angularJs/app/index.html`, include SystemJS + import map and add the container:
```html
<script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/system.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/extras/named-register.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/extras/amd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/extras/use-default.min.js"></script>
<script type="systemjs-importmap">{"imports":{ "single-spa":"https://cdn.jsdelivr.net/npm/single-spa@5.9.5/lib/system/single-spa.min.js", "eui-desktop":"http://localhost:4300/main.js" }}</script>
<div id="eui-mfe-container"></div>
```
2) Register the app in `angularJs/app/microfrontend-config.js`:
```js
System.import('single-spa').then(({ registerApplication, start }) => {
  registerApplication({
    name: 'eui-desktop',
    app: () => System.import('eui-desktop'),
    activeWhen: (loc) => (loc.hash || window.location.hash).includes('eui'),
    customProps: () => ({ domElementGetter: () => document.getElementById('eui-mfe-container') })
  });
  start({ urlRerouteOnly: true });
});
```
3) Add an AngularJS route (e.g. `/eui`) with an empty template so only the MFE renders.

   File: `angularJs/app/app.config.js`
   ```js
   // ... inside $routeProvider chain
   when('/eui', {
     template: '' // empty so AngularJS host renders nothing; MFE owns the DOM
   }).
   // ... keep other routes
   ```


#### C) Validate & go to browser
- Open `http://localhost:8000/#!/eui` → MFE mounts; assets & CSS load from 4300


