# POC Plan v2: Official Single-SPA Architecture

## 🎯 **Objective**
Create a **production-ready microfrontend architecture** following [official single-spa patterns](https://single-spa.js.org/docs/microfrontends-concept) with proper path-based routing.

---

## 📦 **Architecture Overview**

```
┌─────────────────────────────────────────────────┐
│         Root Config (Shell Application)         │
│              Port: 9000                         │
│  - Import maps                                  │
│  - Application registration                     │
│  - Global navigation                            │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  AngularJS MFE   │      │  Angular EUI MFE │
│   Port: 8080     │      │   Port: 4300     │
│   Routes:        │      │   Routes:        │
│   /phones        │      │   /eui/*         │
│   /dashboard     │      │                  │
└──────────────────┘      └──────────────────┘
```

---

## 🚀 **Phase 1: Setup Root Config**

### **Step 1.1: Create Root Config Application**

```bash
# Install single-spa CLI globally
npm install -g create-single-spa

# Create root config
mkdir angular-phonecat-v2
cd angular-phonecat-v2
create-single-spa --moduleType root-config
# Name: @your-org/root-config
# Organization: your-org
```

**Expected structure:**
```
root-config/
├── src/
│   ├── index.ejs              # HTML template
│   ├── root-config.js         # Application registration
│   └── microfrontend-layout.html  # Layout (optional)
├── package.json
└── webpack.config.js
```

### **Step 1.2: Configure Import Maps**

Edit `src/index.ejs`:

```html
<% if (isLocal) { %>
  <script type="systemjs-importmap">
    {
      "imports": {
        "@your-org/root-config": "//localhost:9000/your-org-root-config.js",
        "@your-org/angularjs-app": "//localhost:8080/your-org-angularjs-app.js",
        "@your-org/angular-eui": "//localhost:4300/main.js"
      }
    }
  </script>
<% } %>
```

### **Step 1.3: Register Applications**

Edit `src/root-config.js`:

```javascript
import { registerApplication, start } from "single-spa";

// AngularJS MFE - handles legacy routes
registerApplication({
  name: "@your-org/angularjs-app",
  app: () => System.import("@your-org/angularjs-app"),
  activeWhen: ["/phones", "/dashboard", "/reports"]
});

// Angular EUI MFE - modern Angular application
registerApplication({
  name: "@your-org/angular-eui",
  app: () => System.import("@your-org/angular-eui"),
  activeWhen: (location) => location.pathname.startsWith("/eui")
});

start({
  urlRerouteOnly: true,
});
```

---

## 📱 **Phase 2: Setup AngularJS MFE**

### **Step 2.1: Clone and Prepare**

```bash
cd angular-phonecat-v2
git clone https://github.com/angular/angular-phonecat.git angularjs-app
cd angularjs-app
npm install
```

### **Step 2.2: Convert to Single-SPA Application**

```bash
npm install single-spa-angularjs
```

Create `src/single-spa-setup.js`:

```javascript
import singleSpaAngularJS from 'single-spa-angularjs';
import angular from 'angular';
import './app/app.module.js';

const angularLifecycles = singleSpaAngularJS({
  angular,
  mainAngularModule: 'phonecatApp',
  uiRouter: false, // We're using ngRoute
  preserveGlobal: false,
  template: '<div ng-view class="view-container"></div>',
});

export const bootstrap = angularLifecycles.bootstrap;
export const mount = angularLifecycles.mount;
export const unmount = angularLifecycles.unmount;
```

### **Step 2.3: Migrate to HTML5 Mode (Path-Based Routing)**

Edit `app/app.config.js`:

```javascript
angular.module('phonecatApp')
  .config(['$locationProvider', '$routeProvider',
    function config($locationProvider, $routeProvider) {
      // Enable HTML5 mode - no more hash!
      $locationProvider.html5Mode(true);
      
      $routeProvider
        .when('/phones', {
          template: '<phone-list></phone-list>'
        })
        .when('/phones/:phoneId', {
          template: '<phone-detail></phone-detail>'
        })
        .otherwise('/phones');
    }
  ]);
```

### **Step 2.4: Configure Webpack**

Create `webpack.config.js`:

```javascript
const { merge } = require('webpack-merge');
const singleSpaDefaults = require('webpack-config-single-spa');

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: 'your-org',
    projectName: 'angularjs-app',
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    entry: './src/single-spa-setup.js',
    // Add AngularJS-specific config
  });
};
```

---

## 🎨 **Phase 3: Create Angular EUI MFE**

### **Step 3.1: Create Angular Application**

```bash
cd angular-phonecat-v2
npx @angular/cli new angular-eui --routing --style=scss
cd angular-eui
```

### **Step 3.2: Install Single-SPA Angular**

```bash
npm install single-spa-angular
npx schematics single-spa-angular:ng-add --project angular-eui
```

### **Step 3.3: Configure Routing**

Edit `src/app/app-routing.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'module1', component: Module1Component },
  { path: 'module2', component: Module2Component },
  // More routes...
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/eui' }
  ]
})
export class AppRoutingModule { }
```

### **Step 3.4: Update Main Entry Point**

Edit `src/main.single-spa.ts`:

```typescript
import { enableProdMode, NgZone } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Router, NavigationStart } from '@angular/router';
import { singleSpaAngular, getSingleSpaExtraProviders } from 'single-spa-angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    return platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(AppModule);
  },
  template: '<app-root />',
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
```

---

## 🔄 **Phase 4: Inter-App Communication**

### **Approach 1: Custom Events (Simple)**

**AngularJS sends:**
```javascript
window.dispatchEvent(new CustomEvent('app-data', {
  detail: { 
    source: 'angularjs',
    data: { phoneId: 123 }
  }
}));
```

**Angular receives:**
```typescript
ngOnInit() {
  window.addEventListener('app-data', (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Received:', customEvent.detail);
  });
}
```

### **Approach 2: RxJS Subject (Better)**

Create shared service in root config:

```javascript
// shared-events.js
import { ReplaySubject } from 'rxjs';

export const sharedEvents$ = new ReplaySubject(1);

window.sharedEvents$ = sharedEvents$;
```

**AngularJS:**
```javascript
window.sharedEvents$.next({ type: 'PHONE_SELECTED', phoneId: 123 });
```

**Angular:**
```typescript
constructor() {
  (window as any).sharedEvents$.subscribe(event => {
    console.log('Received:', event);
  });
}
```

---

## 🌐 **Phase 5: Navigation Between Apps**

### **From AngularJS to Angular:**

```javascript
// In AngularJS controller
$scope.goToEuiHome = function() {
  window.history.pushState(null, '', '/eui/home');
  window.dispatchEvent(new PopStateEvent('popstate'));
};
```

### **From Angular to AngularJS:**

```typescript
// In Angular component
goToPhones() {
  this.router.navigateByUrl('/phones'); // Just use Angular Router!
  // Single-SPA handles the rest
}
```

### **Navigation Menu (Shared)**

Create in root-config `src/navigation.html`:

```html
<nav>
  <a href="/phones">Phones (AngularJS)</a>
  <a href="/dashboard">Dashboard (AngularJS)</a>
  <a href="/eui/home">EUI Home (Angular)</a>
  <a href="/eui/module1">Module 1 (Angular)</a>
</nav>
```

---

## 🚀 **Phase 6: Development Workflow**

### **Start All Applications:**

Create `package.json` in root:

```json
{
  "name": "angular-phonecat-v2",
  "scripts": {
    "start": "concurrently \"npm run start:root\" \"npm run start:angularjs\" \"npm run start:angular\"",
    "start:root": "cd root-config && npm start",
    "start:angularjs": "cd angularjs-app && npm start",
    "start:angular": "cd angular-eui && npm start"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

Run:
```bash
npm install
npm start
```

Access: `http://localhost:9000`

---

## 📝 **File Structure**

```
angular-phonecat-v2/
├── root-config/              # Shell application (port 9000)
│   ├── src/
│   │   ├── index.ejs        # Import maps
│   │   ├── root-config.js   # App registration
│   │   └── navigation.html  # Shared navigation
│   └── package.json
│
├── angularjs-app/           # AngularJS MFE (port 8080)
│   ├── app/                 # Original phonecat app
│   ├── src/
│   │   └── single-spa-setup.js
│   ├── webpack.config.js
│   └── package.json
│
├── angular-eui/             # Angular MFE (port 4300)
│   ├── src/
│   │   ├── app/
│   │   ├── main.ts
│   │   └── main.single-spa.ts
│   ├── angular.json
│   └── package.json
│
├── package.json             # Root package.json for scripts
└── README.md
```

---

## ✅ **Success Criteria**

- [ ] Root config running on port 9000
- [ ] AngularJS MFE accessible at `/phones`
- [ ] Angular MFE accessible at `/eui/*`
- [ ] Clean URLs (no hash) everywhere
- [ ] Navigation works between apps
- [ ] Data can be passed between apps
- [ ] Both apps can be developed independently
- [ ] Production build works

---

## 📚 **Key Differences from Current Implementation**

| Current (Hash-Based) | New (Path-Based) |
|---------------------|------------------|
| AngularJS is host | Root config is host |
| Hash routing (`#!/`) | Path routing (`/`) |
| Custom LocationStrategy | Standard Angular Router |
| Complex click interception | Simple, clean routing |
| Manual visibility toggling | Single-SPA handles mounting |
| Browser storage for data | Event-based communication |

---

## 🎯 **Next Steps**

1. **Week 1:** Setup root config and get AngularJS running as MFE
2. **Week 2:** Create Angular EUI MFE with basic routes
3. **Week 3:** Implement navigation and data communication
4. **Week 4:** Testing, polish, and documentation

---

## 📖 **References**

- [Single-SPA Docs](https://single-spa.js.org/docs/getting-started-overview)
- [Single-SPA AngularJS](https://single-spa.js.org/docs/ecosystem-angularjs)
- [Single-SPA Angular](https://single-spa.js.org/docs/ecosystem-angular)
- [Microfrontends Concept](https://single-spa.js.org/docs/microfrontends-concept)
- [Angular Phonecat Repo](https://github.com/angular/angular-phonecat)

---

**🎉 This approach follows official single-spa patterns and will result in a cleaner, more maintainable architecture!**


