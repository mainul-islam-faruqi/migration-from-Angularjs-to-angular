# Angular-in-AngularJS Migration Guide
**Complete A-Z Setup Guide for Running Modern Angular Components in Legacy AngularJS Applications**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Configuration Files](#configuration-files)
6. [Component Development](#component-development)
7. [Integration Points](#integration-points)
8. [Testing & Debugging](#testing--debugging)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide demonstrates how to integrate modern Angular (15+) components into an existing AngularJS (1.8.x) application using single-spa micro-frontend architecture. This approach allows gradual migration without rewriting the entire application.

### Key Benefits
- ✅ **Gradual Migration** - Migrate one component at a time
- ✅ **Zero Downtime** - Keep existing AngularJS functionality intact
- ✅ **Modern Development** - Use latest Angular features and TypeScript
- ✅ **Independent Deployment** - Angular components can be developed separately
- ✅ **Future-Proof** - Clear path for complete migration

---

## 🔧 Prerequisites

### Required Software
- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Angular CLI** 15.x or higher
- **TypeScript** 4.8.x or higher

### Required Knowledge
- AngularJS 1.x development
- Modern Angular (2+) development
- Basic understanding of micro-frontends
- Webpack configuration basics

---

## 📁 Project Structure

```
angular-phonecat/                     # Root project directory
├── app/                              # AngularJS Host Application
│   ├── index.html                    # Main HTML with single-spa setup
│   ├── app.module.js                 # AngularJS root module
│   ├── app.config.js                 # Route configuration
│   ├── microfrontend-config.js       # Single-spa root config
│   ├── core/                         # AngularJS core modules
│   ├── phone-list/                   # Existing AngularJS components
│   ├── phone-detail/                 # Existing AngularJS components
│   ├── phones/                       # JSON data files
│   └── lib/                          # AngularJS dependencies
│
├── angular-mfe/                      # Angular Micro-Frontend
│   ├── package.json                  # Angular dependencies
│   ├── webpack.config.js             # Webpack configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── src/
│   │   ├── main.single-spa.ts        # Single-spa lifecycle functions
│   │   ├── app/
│   │   │   ├── app.component.ts      # Root Angular component
│   │   │   ├── phone-list/           # Modern Angular components
│   │   │   ├── services/             # Angular services
│   │   │   └── components/           # Shared Angular components
│   │   └── environments/             # Environment configurations
│   └── dist/                         # Built Angular assets
│
├── package.json                      # Root dependencies
└── README.md                         # Project documentation
```

---

## 🚀 Step-by-Step Implementation

### Step 1: Prepare AngularJS Host Application

#### 1.1 Install Single-SPA Dependencies
```bash
cd angular-phonecat
npm install single-spa@^5.9.5 systemjs@^6.14.1
```

#### 1.2 Update AngularJS index.html
Add SystemJS and single-spa to your main HTML file:

```html
<!doctype html>
<html lang="en" ng-app="phonecatApp">
<head>
  <meta charset="utf-8">
  <title>PhoneCat App with Angular MFE</title>
  <!-- Existing CSS links -->
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar navbar-default">
    <div class="container">
      <div class="navbar-header">
        <a class="navbar-brand" href="#!/phones">PhoneCat with MFE</a>
      </div>
      <div class="navbar-nav navbar-right">
        <a class="navbar-link" href="#!/phones">AngularJS Phones</a>
        <a class="navbar-link" href="#!/angular-phone-list">Angular Phone List</a>
      </div>
    </div>
  </nav>

  <!-- AngularJS App Container -->
  <div class="view-container">
    <div ng-view class="view-frame"></div>
  </div>

  <!-- Micro-frontend Container -->
  <div id="angular-mfe-container"></div>

  <!-- SystemJS -->
  <script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/system.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/extras/amd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/extras/named-exports.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/systemjs@6.14.1/dist/extras/use-default.min.js"></script>

  <!-- SystemJS Import Map -->
  <script type="systemjs-importmap">
    {
      "imports": {
        "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5.9.5/lib/system/single-spa.min.js",
        "angular-mfe": "http://localhost:4200/main.js"
      }
    }
  </script>
  
  <!-- Existing AngularJS Scripts -->
  <!-- ... -->
  
  <!-- Single-SPA Root Config -->
  <script src="app/microfrontend-config.js"></script>
</body>
</html>
```

#### 1.3 Configure AngularJS Routes
Update `app.config.js` to include routes for Angular components:

```javascript
angular.
  module('phonecatApp').
  config(['$routeProvider',
    function config($routeProvider) {
      $routeProvider.
        when('/phones', {
          template: '<phone-list></phone-list>'
        }).
        when('/phones/:phoneId', {
          template: '<phone-detail></phone-detail>'
        }).
        when('/angular-phone-list', {
          template: '<div id="angular-mfe-container"></div>'
        }).
        otherwise('/phones');
    }
  ]);
```

#### 1.4 Add Cross-Framework Communication
Update `app.module.js` to handle communication between frameworks:

```javascript
angular.module('phonecatApp', [
  'ngAnimate',
  'ngRoute',
  'core',
  'phoneDetail',
  'phoneList'
]).run(function($rootScope, $location) {
  // Listen for messages from Angular micro-frontend
  window.addEventListener('angular-to-angularjs', function(event) {
    console.log('Message received from Angular MFE:', event.detail);
    
    if (event.detail.action === 'navigate' && event.detail.route) {
      $location.url(event.detail.route.replace('#!', ''));
      $rootScope.$apply();
    }
  });
  
  console.log('AngularJS host application initialized with MFE support');
});
```

#### 1.5 Create Single-SPA Root Configuration
Create `app/microfrontend-config.js`:

```javascript
// Single-SPA Root Configuration for AngularJS Host Application
System.import('single-spa').then(singleSpa => {
  const { registerApplication, start } = singleSpa;

  // Register the Angular micro-frontend
  registerApplication({
    name: 'angular-mfe',
    app: () => System.import('angular-mfe'),
    activeWhen: location => {
      console.log('Checking route:', location.hash);
      return location.hash.includes('angular-phone-list');
    },
    customProps: (name, location) => ({
      domElementGetter: () => document.getElementById('angular-mfe-container')
    })
  });

  // Start single-spa
  start({
    urlRerouteOnly: true
  });

  console.log('Single-SPA Root Config loaded for AngularJS host');
}).catch(err => {
  console.error('Failed to load single-spa:', err);
});
```

### Step 2: Create Angular Micro-Frontend

#### 2.1 Initialize Angular MFE Directory
```bash
mkdir angular-mfe
cd angular-mfe
```

#### 2.2 Create Package Configuration
Create `package.json`:

```json
{
  "name": "angular-mfe",
  "version": "0.0.0",
  "scripts": {
    "start": "webpack serve --mode=development --port 4200",
    "build": "webpack --mode=production"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^15.0.0",
    "@angular/common": "^15.0.0",
    "@angular/compiler": "^15.0.0",
    "@angular/core": "^15.0.0",
    "@angular/forms": "^15.0.0",
    "@angular/platform-browser": "^15.0.0",
    "@angular/platform-browser-dynamic": "^15.0.0",
    "@angular/router": "^15.0.0",
    "rxjs": "~7.5.0",
    "single-spa": "^5.9.5",
    "tslib": "^2.3.0",
    "zone.js": "~0.11.4"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^15.0.0",
    "@angular/cli": "^15.0.0",
    "@angular/compiler-cli": "^15.0.0",
    "html-webpack-plugin": "^5.5.0",
    "ts-loader": "^9.3.0",
    "typescript": "~4.8.2",
    "webpack": "^5.74.0",
    "webpack-cli": "^4.10.0",
    "webpack-dev-server": "^4.11.1"
  }
}
```

#### 2.3 Configure Webpack
Create `webpack.config.js`:

```javascript
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
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
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
      publicPath: isProduction ? '/dist/' : 'http://localhost:4200/',
    },
    devServer: {
      port: 4200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
      hot: true,
      liveReload: true,
    },
    externals: {
      'zone.js': 'zone.js',
    },
  };
};
```

#### 2.4 Configure TypeScript
Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["es2020", "dom"],
    "module": "es2020",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "skipLibCheck": true,
    "outDir": "./dist/out-tsc",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### Step 3: Implement Single-SPA Lifecycle

#### 3.1 Create Single-SPA Entry Point
Create `src/main.single-spa.ts`:

```typescript
import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

let appRef: any;

export async function bootstrap() {
  // Bootstrap is called once when the app is first loaded
  console.log('Angular MFE: bootstrap');
}

export async function mount(props: any) {
  // Mount is called every time the app becomes active
  console.log('Angular MFE: mount', props);
  
  try {
    // Get the DOM element where Angular should mount
    const domElement = props.domElementGetter ? props.domElementGetter() : document.getElementById('angular-mfe-container');
    
    if (!domElement) {
      throw new Error('Could not find DOM element to mount Angular app');
    }
    
    // Clear any existing content and create app-root element
    domElement.innerHTML = '<app-root></app-root>';
    
    // Bootstrap Angular application to the specific app-root element
    appRef = await bootstrapApplication(AppComponent, {
      providers: [
        provideHttpClient() // Provide HttpClient for the app
      ],
      // Specify the root element selector
      rootElement: domElement.querySelector('app-root')
    });
    
    console.log('Angular MFE: mounted successfully');
  } catch (error) {
    console.error('Angular MFE: mount error', error);
  }
}

export async function unmount() {
  // Unmount is called every time the app becomes inactive
  console.log('Angular MFE: unmount');
  
  if (appRef) {
    appRef.destroy();
    appRef = null;
  }
}
```

#### 3.2 Create Root Angular Component
Create `src/app/app.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhoneListTestComponent } from './phone-list/phone-list-test.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PhoneListTestComponent],
  template: `
    <div style="padding: 20px; border: 2px solid #dd1b16; margin: 20px;">
      <div *ngIf="currentView === 'home'">
        <h2 style="color: #dd1b16;">Angular Component Running in AngularJS</h2>
        <p>This is a modern Angular component integrated via single-spa micro-frontend.</p>
        <button (click)="showPhoneList()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">
          Show Phone List
        </button>
      </div>

      <div *ngIf="currentView === 'phone-list'">
        <div style="margin-bottom: 15px;">
          <button (click)="goHome()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px;">
            ← Back to Home
          </button>
        </div>
        <app-phone-list-test></app-phone-list-test>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  currentView: 'home' | 'phone-list' = 'home';

  ngOnInit() {
    console.log('Angular MFE: AppComponent initialized');
    
    // Check URL to determine initial view
    if (window.location.hash.includes('angular-phone-list')) {
      this.currentView = 'phone-list';
    }
  }

  showPhoneList() {
    this.currentView = 'phone-list';
  }

  goHome() {
    this.currentView = 'home';
  }

  navigateToAngularJS(route: string) {
    // Send message to AngularJS app
    window.dispatchEvent(new CustomEvent('angular-to-angularjs', {
      detail: { action: 'navigate', route: route }
    }));
  }
}
```

### Step 4: Create Angular Components

#### 4.1 Create Loading Component
Create `src/app/components/loading/loading.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" style="text-align: center; padding: 40px;">
      <div class="spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #dd1b16; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 15px; color: #666;">Loading phones...</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `
})
export class LoadingComponent {}
```

#### 4.2 Create Phone List Component
Create `src/app/phone-list/phone-list-test.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '../components/loading/loading.component';

interface Phone {
  age: number;
  id: string;
  imageUrl: string;
  name: string;
  snippet: string;
  carrier?: string;
}

@Component({
  selector: 'app-phone-list-test',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  template: `
    <div class="container-fluid" style="padding: 20px;">
      <h2 style="color: #dd1b16; margin-bottom: 20px;">Angular Phone List Component</h2>
      
      <div class="row">
        <div class="col-md-2">
          <!-- Sidebar content -->
          <div style="margin-bottom: 15px;">
            <label for="search"><strong>Search:</strong></label>
            <input 
              id="search"
              [(ngModel)]="query" 
              class="form-control" 
              placeholder="Search phones..."
              style="margin-top: 5px;"
            />
          </div>

          <div>
            <label for="sort"><strong>Sort by:</strong></label>
            <select 
              id="sort"
              [(ngModel)]="orderProp" 
              class="form-control"
              style="margin-top: 5px;"
            >
              <option value="name">Alphabetical</option>
              <option value="age">Newest</option>
            </select>
          </div>
        </div>

        <div class="col-md-10">
          <!-- Loading state -->
          <app-loading *ngIf="loading"></app-loading>

          <!-- Phone list -->
          <div *ngIf="!loading">
            <div style="margin-bottom: 15px; color: #666;">
              <small>Showing {{filteredAndSortedPhones.length}} of {{phones.length}} phones</small>
            </div>

            <ul class="phones" style="list-style: none; padding: 0;">
              <li 
                *ngFor="let phone of filteredAndSortedPhones" 
                class="thumbnail phone-list-item"
                style="display: flex; margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;"
              >
                <div style="margin-right: 15px;">
                  <div 
                    style="width: 100px; height: 100px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;"
                  >
                    📱
                  </div>
                </div>
                <div>
                  <h4 style="margin: 0 0 10px 0; color: #333;">
                    <a 
                      (click)="viewPhone(phone.id)" 
                      style="text-decoration: none; color: #dd1b16; cursor: pointer;"
                    >
                      {{phone.name}}
                    </a>
                  </h4>
                  <p style="margin: 0; color: #666; line-height: 1.4;">{{phone.snippet}}</p>
                  <div *ngIf="phone.carrier" style="margin-top: 5px;">
                    <small style="color: #999;"><strong>Carrier:</strong> {{phone.carrier}}</small>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PhoneListTestComponent implements OnInit {
  phones: Phone[] = [];
  query: string = '';
  orderProp: string = 'age';
  loading: boolean = true;

  constructor() {}

  ngOnInit() {
    this.loadPhones();
  }

  private loadPhones() {
    // Simulate loading with mock data
    setTimeout(() => {
      this.phones = [
        {
          age: 0,
          id: "motorola-xoom-with-wi-fi",
          imageUrl: "img/phones/motorola-xoom-with-wi-fi.0.jpg",
          name: "Motorola XOOM™ with Wi-Fi",
          snippet: "The Next, Next Generation. Experience the future with Motorola XOOM with Wi-Fi.",
          carrier: "Verizon"
        },
        // ... more phone data
      ];
      this.loading = false;
    }, 1000);
  }

  get filteredAndSortedPhones(): Phone[] {
    let filtered = this.phones;

    // Apply search filter
    if (this.query) {
      const queryLower = this.query.toLowerCase();
      filtered = filtered.filter(phone => 
        phone.name.toLowerCase().includes(queryLower) ||
        phone.snippet.toLowerCase().includes(queryLower) ||
        (phone.carrier && phone.carrier.toLowerCase().includes(queryLower))
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (this.orderProp === 'name') {
        return a.name.localeCompare(b.name);
      } else if (this.orderProp === 'age') {
        return a.age - b.age;
      }
      return 0;
    });
  }

  viewPhone(phoneId: string) {
    console.log('Clicked phone:', phoneId);
    alert(`Phone clicked: ${phoneId}`);
  }
}
```

### Step 5: Install Dependencies and Build

#### 5.1 Install Angular MFE Dependencies
```bash
cd angular-mfe
npm install
```

#### 5.2 Install AngularJS Dependencies
```bash
cd ..
npm install
```

#### 5.3 Start Development Servers

**Terminal 1 - Angular MFE:**
```bash
cd angular-mfe
npm start
```

**Terminal 2 - AngularJS Host:**
```bash
cd ..
npm start
```

---

## 🧪 Testing & Debugging

### Testing the Integration

1. **Start both servers** (Angular MFE on :4200, AngularJS on :8000)
2. **Navigate to** `http://localhost:8000`
3. **Click "Angular Phone List"** in navigation
4. **Verify** Angular component loads without errors
5. **Test functionality** (search, sort, click events)

### Common Debug Steps

1. **Check browser console** for errors
2. **Verify SystemJS import map** is correct
3. **Confirm webpack dev server** is running on :4200
4. **Test single-spa registration** in browser dev tools
5. **Check network tab** for failed module loads

---

## 🚀 Deployment

### Production Build
```bash
cd angular-mfe
npm run build
```

### Serve Built Files
Update SystemJS import map to point to production builds:
```javascript
{
  "imports": {
    "angular-mfe": "/angular-mfe/dist/main.js"
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Zone.js` errors | Ensure `zone.js` is imported first in `main.single-spa.ts` |
| DI injection errors | Use `inject()` function instead of constructor injection |
| Module not found | Check SystemJS import map and webpack public path |
| CORS errors | Configure webpack dev server headers |
| Component not mounting | Verify DOM element exists before mounting |

### Performance Optimization

- **Lazy load** Angular components only when needed
- **Use OnPush** change detection strategy
- **Implement proper** cleanup in unmount lifecycle
- **Share common dependencies** between micro-frontends

---

## ✅ Next Steps

1. **Add HTTP services** to fetch real data from AngularJS backend
2. **Implement routing** between Angular and AngularJS
3. **Create shared state management** for cross-framework communication
4. **Add more Angular components** gradually
5. **Set up CI/CD pipeline** for independent deployments

---

*This guide provides a complete foundation for integrating modern Angular components into legacy AngularJS applications using micro-frontend architecture.*
