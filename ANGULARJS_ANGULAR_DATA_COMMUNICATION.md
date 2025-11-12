# AngularJS ↔ Angular Data Communication Guide

## Overview
When migrating from AngularJS to Angular, you need reliable ways to share data between the two frameworks. This guide covers the main approaches used in microfrontend architectures.

## 🎯 Communication Strategies

### 1. **Custom Events (Window Events)** ⭐ Recommended for MFEs
Best for: Loosely coupled communication, navigation events, notifications

#### From AngularJS → Angular

**AngularJS Side** (`app.module.js`):
```javascript
// Dispatch event from AngularJS
function notifyAngular(data) {
    const event = new CustomEvent('angularjs-to-angular', {
        detail: {
            action: 'dataUpdate',
            payload: data
        }
    });
    window.dispatchEvent(event);
}

// Example: When user data changes
$scope.$watch('user', function(newUser) {
    notifyAngular({ user: newUser });
});
```

**Angular Side** (`data-bridge.service.ts`):
```typescript
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DataBridgeService {
    private userSubject = new BehaviorSubject<any>(null);
    public user$ = this.userSubject.asObservable();

    constructor(private zone: NgZone) {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('angularjs-to-angular', (event: Event) => {
            const customEvent = event as CustomEvent;
            const { action, payload } = customEvent.detail;

            // Run inside Angular zone for change detection
            this.zone.run(() => {
                if (action === 'dataUpdate') {
                    this.userSubject.next(payload.user);
                }
            });
        });
    }
}
```

**Usage in Angular Component**:
```typescript
export class MyComponent implements OnInit {
    private dataBridge = inject(DataBridgeService);

    ngOnInit() {
        this.dataBridge.user$.subscribe(user => {
            console.log('Received user from AngularJS:', user);
        });
    }
}
```

#### From Angular → AngularJS

**Angular Side** (`data-bridge.service.ts`):
```typescript
export class DataBridgeService {
    public sendToAngularJs(data: any): void {
        const event = new CustomEvent('angular-to-angularjs', {
            detail: {
                action: 'dataUpdate',
                payload: data
            }
        });
        window.dispatchEvent(event);
    }
}
```

**AngularJS Side** (`app.module.js`):
```javascript
angular.module('myApp').run(['$rootScope', function($rootScope) {
    window.addEventListener('angular-to-angularjs', function(event) {
        const { action, payload } = event.detail;
        
        // Apply changes to AngularJS scope
        $rootScope.$apply(function() {
            if (action === 'dataUpdate') {
                $rootScope.sharedData = payload;
                $rootScope.$broadcast('dataUpdated', payload);
            }
        });
    });
}]);
```

---

### 2. **Shared Service via Window Object** 
Best for: Simple data sharing, configuration, global state

**AngularJS Side**:
```javascript
// Create a shared service on window
window.sharedDataService = {
    data: {},
    listeners: [],
    
    setData: function(key, value) {
        this.data[key] = value;
        this.notifyListeners(key, value);
    },
    
    getData: function(key) {
        return this.data[key];
    },
    
    subscribe: function(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) this.listeners.splice(index, 1);
        };
    },
    
    notifyListeners: function(key, value) {
        this.listeners.forEach(fn => fn(key, value));
    }
};

// Usage in AngularJS
$scope.updateUser = function(user) {
    window.sharedDataService.setData('user', user);
};
```

**Angular Side**:
```typescript
@Injectable({
    providedIn: 'root'
})
export class SharedDataService {
    private dataSubject = new BehaviorSubject<any>({});
    public data$ = this.dataSubject.asObservable();

    constructor(private zone: NgZone) {
        this.connectToWindowService();
    }

    private connectToWindowService(): void {
        const windowService = (window as any).sharedDataService;
        
        if (windowService) {
            // Subscribe to changes
            windowService.subscribe((key: string, value: any) => {
                this.zone.run(() => {
                    const currentData = this.dataSubject.value;
                    this.dataSubject.next({ ...currentData, [key]: value });
                });
            });
            
            // Initialize with current data
            this.dataSubject.next(windowService.data);
        }
    }

    public setData(key: string, value: any): void {
        const windowService = (window as any).sharedDataService;
        if (windowService) {
            windowService.setData(key, value);
        }
    }

    public getData(key: string): any {
        const windowService = (window as any).sharedDataService;
        return windowService ? windowService.getData(key) : null;
    }
}
```

---

### 3. **URL Parameters / Query Strings**
Best for: Passing navigation context, simple state transfer

**AngularJS Side**:
```javascript
// Navigate with parameters
$location.path('/eui/screen/module1').search({ userId: 123, view: 'details' });
```

**Angular Side** (`component.ts`):
```typescript
import { ActivatedRoute } from '@angular/router';

export class Module1Component implements OnInit {
    private route = inject(ActivatedRoute);

    ngOnInit() {
        // Read query parameters
        this.route.queryParams.subscribe(params => {
            const userId = params['userId'];
            const view = params['view'];
            console.log('Received params:', { userId, view });
        });
    }
}
```

---

### 4. **Local Storage / Session Storage**
Best for: Persistent data, user preferences, authentication tokens

**AngularJS Side**:
```javascript
// Save data
$scope.saveUserPreferences = function(prefs) {
    localStorage.setItem('userPrefs', JSON.stringify(prefs));
    
    // Notify Angular of change
    window.dispatchEvent(new Event('storage'));
};
```

**Angular Side**:
```typescript
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private prefsSubject = new BehaviorSubject<any>(null);
    public prefs$ = this.prefsSubject.asObservable();

    constructor(private zone: NgZone) {
        this.loadInitialData();
        this.listenForChanges();
    }

    private loadInitialData(): void {
        const prefs = localStorage.getItem('userPrefs');
        if (prefs) {
            this.prefsSubject.next(JSON.parse(prefs));
        }
    }

    private listenForChanges(): void {
        window.addEventListener('storage', (event) => {
            this.zone.run(() => {
                if (event.key === 'userPrefs' && event.newValue) {
                    this.prefsSubject.next(JSON.parse(event.newValue));
                }
            });
        });
    }

    public setPreferences(prefs: any): void {
        localStorage.setItem('userPrefs', JSON.stringify(prefs));
        this.prefsSubject.next(prefs);
    }
}
```

---

### 5. **@angular/upgrade Package** (For Hybrid Apps)
Best for: Progressive migration, shared services, component interop

**Note**: This is for **hybrid applications** where AngularJS and Angular run in the same app, NOT for microfrontends.

#### Downgrading Angular Service to AngularJS

**Angular Service**:
```typescript
// user.service.ts
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    getUser() {
        return { id: 1, name: 'John Doe' };
    }
}
```

**Downgrade Module**:
```typescript
// downgrade.module.ts
import { NgModule } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UserService } from './user.service';

declare const angular: any;

angular.module('myApp')
    .factory('userService', downgradeInjectable(UserService));

@NgModule({
    providers: [UserService]
})
export class DowngradeModule {}
```

**AngularJS Usage**:
```javascript
angular.module('myApp').controller('MyController', 
    ['userService', function(userService) {
        $scope.user = userService.getUser();
    }]
);
```

---

## 🎯 Our Current Implementation (Navigation Bridge)

We already have a working example in `navigation-bridge.service.ts`:

### Event Flow
```
AngularJS (Header Click)
    ↓ window.dispatchEvent('angularjs-to-angular')
Angular NavigationBridgeService
    ↓ handleHostNavigation()
Angular Router
    ↓ NavigationEnd event
NavigationBridgeService
    ↓ window.dispatchEvent('angular-to-angularjs')
AngularJS $location
```

### Key Code Snippets

**AngularJS Dispatcher** (`app.module.js`):
```javascript
// Listen for hash changes and notify Angular
$rootScope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl) {
    const path = $location.path();
    
    // Dispatch event to Angular MFE
    const navigateEvent = new CustomEvent('angularjs-to-angular', {
        detail: {
            action: 'navigate',
            route: path
        }
    });
    window.dispatchEvent(navigateEvent);
});
```

**Angular Listener** (`navigation-bridge.service.ts`):
```typescript
private handleHostNavigation = (event: Event): void => {
    if (this.isNavigatingInternally) {
        // Prevent circular navigation
        return;
    }

    const customEvent = event as CustomEvent<HostNavigationDetail>;
    const { action, route } = customEvent.detail;

    if (action === 'navigate') {
        this.router.navigateByUrl(route);
    }
};
```

---

## 📊 Comparison Table

| Strategy | Use Case | Pros | Cons |
|----------|----------|------|------|
| **Custom Events** | Navigation, notifications, real-time updates | Loosely coupled, framework agnostic, works across MFEs | Requires manual change detection (NgZone) |
| **Window Object** | Shared state, configuration | Simple, synchronous access | Pollutes global scope, no type safety |
| **URL Parameters** | Navigation context, simple state | SEO friendly, bookmarkable | Limited data size, visible to user |
| **Local Storage** | Persistent data, auth tokens | Survives page refresh, accessible from both | Synchronous, size limits (5-10MB) |
| **@angular/upgrade** | Hybrid apps (same bundle) | Type-safe, Angular DI system | Complex setup, larger bundle, not for MFEs |

---

## 🚀 Recommended Approach for Your Project

For your **microfrontend architecture**:

### 1. **Navigation** ✅ (Already implemented)
- Use custom events via `NavigationBridgeService`
- AngularJS → Angular: `window.dispatchEvent('angularjs-to-angular')`
- Angular → AngularJS: `window.dispatchEvent('angular-to-angularjs')`

### 2. **User Authentication / Session Data**
Use **Local Storage** + **Custom Events**:

```typescript
// shared-auth.service.ts (Angular)
@Injectable({ providedIn: 'root' })
export class SharedAuthService {
    private userSubject = new BehaviorSubject<any>(null);
    public user$ = this.userSubject.asObservable();

    constructor(private zone: NgZone) {
        // Load from localStorage
        const user = localStorage.getItem('currentUser');
        if (user) this.userSubject.next(JSON.parse(user));

        // Listen for changes from AngularJS
        window.addEventListener('auth-changed', (event: Event) => {
            const customEvent = event as CustomEvent;
            this.zone.run(() => {
                const user = customEvent.detail.user;
                this.userSubject.next(user);
                localStorage.setItem('currentUser', JSON.stringify(user));
            });
        });
    }

    public setUser(user: any): void {
        this.userSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Notify AngularJS
        window.dispatchEvent(new CustomEvent('auth-changed', {
            detail: { user }
        }));
    }
}
```

### 3. **Application State / Preferences**
Use **Window Object** service pattern (shown above)

### 4. **Form Data / Temporary State**
Use **URL Parameters** for navigation context

---

## 🔧 Implementation Example: Shared User Service

Let me create a complete working example:

**1. Create Angular Service**:
```typescript
// shared-data.service.ts
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SharedUser {
    id: number;
    name: string;
    email: string;
    preferences?: any;
}

@Injectable({
    providedIn: 'root'
})
export class SharedDataService {
    private userSubject = new BehaviorSubject<SharedUser | null>(null);
    public user$: Observable<SharedUser | null> = this.userSubject.asObservable();

    constructor(private zone: NgZone) {
        this.initializeFromLocalStorage();
        this.setupEventListeners();
    }

    private initializeFromLocalStorage(): void {
        const stored = localStorage.getItem('sharedUser');
        if (stored) {
            try {
                this.userSubject.next(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse stored user:', e);
            }
        }
    }

    private setupEventListeners(): void {
        window.addEventListener('angularjs-data-update', (event: Event) => {
            const customEvent = event as CustomEvent;
            this.zone.run(() => {
                this.handleAngularJsUpdate(customEvent.detail);
            });
        });
    }

    private handleAngularJsUpdate(detail: any): void {
        const { type, payload } = detail;
        
        switch (type) {
            case 'user':
                this.setUser(payload);
                break;
            case 'preferences':
                this.updatePreferences(payload);
                break;
        }
    }

    public setUser(user: SharedUser | null): void {
        this.userSubject.next(user);
        if (user) {
            localStorage.setItem('sharedUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('sharedUser');
        }
        this.notifyAngularJs('user', user);
    }

    public updatePreferences(preferences: any): void {
        const currentUser = this.userSubject.value;
        if (currentUser) {
            const updatedUser = { ...currentUser, preferences };
            this.setUser(updatedUser);
        }
    }

    private notifyAngularJs(type: string, payload: any): void {
        window.dispatchEvent(new CustomEvent('angular-data-update', {
            detail: { type, payload }
        }));
    }
}
```

**2. AngularJS Integration**:
```javascript
// app.module.js
angular.module('phonecatApp').run(['$rootScope', function($rootScope) {
    // Initialize shared user
    const storedUser = localStorage.getItem('sharedUser');
    if (storedUser) {
        $rootScope.sharedUser = JSON.parse(storedUser);
    }

    // Listen for Angular updates
    window.addEventListener('angular-data-update', function(event) {
        const { type, payload } = event.detail;
        
        $rootScope.$apply(function() {
            if (type === 'user') {
                $rootScope.sharedUser = payload;
                $rootScope.$broadcast('user-updated', payload);
            }
        });
    });

    // Send updates to Angular
    $rootScope.notifyAngular = function(type, payload) {
        window.dispatchEvent(new CustomEvent('angularjs-data-update', {
            detail: { type, payload }
        }));
    };
}]);
```

---

## ✅ Quick Fix Summary

Your `routerLink` issue is now fixed - remember the rule:

```typescript
// ❌ Wrong - has leading slash
[routerLink]="['/screen/module1']"

// ✅ Correct - no leading slash (works with APP_BASE_HREF='/eui')
[routerLink]="['screen/module1']"
```

This applies to:
- `[routerLink]` directive
- `router.navigateByUrl()`
- `router.navigate()`
- Sidebar URLs
- All internal Angular navigation!

---

## 📚 References

1. [Angular Upgrade Guide](https://angular.io/guide/upgrade)
2. [AngularJS to Angular Migration](https://angular.io/guide/upgrade-setup)
3. [Custom Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
4. [Window postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
5. [Single-SPA Framework](https://single-spa.js.org/)

Let me know if you need help implementing any of these patterns! 🚀

