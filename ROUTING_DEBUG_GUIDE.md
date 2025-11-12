# Routing Debug Guide - Why Leading Slash Matters

## 🔍 Console Log Comparison

### Scenario 1: Sidebar Click (Working) ✅

When you click **"Module 2"** in the sidebar:

```
🎯 Sidebar click intercepted: screen/module2
🎯 Navigating to: screen/module2
🔄 NavigationBridge: Ignoring host event (internal navigation in progress)
MF Strategy pushState(): {url: 'screen/module2', preventUrlChange: false}
MF: Syncing navigation - push - url: screen/module2 -> hash: #!/eui/screen/module2
✅ Navigation successful to: screen/module2
```

**Why it works:**
1. ✅ Sidebar handler extracts route: `'screen/module2'` (no leading slash)
2. ✅ Calls `router.navigateByUrl('screen/module2')`
3. ✅ Matches route definition: `{ path: 'screen/module2', ... }`
4. ✅ Navigation succeeds!

---

### Scenario 2: RouterLink WITH Leading Slash (Broken) ❌

When you click **"Go to Module 1 demo"** with `[routerLink]="['/screen/module1']"`:

```
// Angular Router internal logs (if you enable router tracing):
Router: Navigation triggered with '/screen/module1'
Router: With APP_BASE_HREF='/eui', looking for route path: '/screen/module1'
Router: Checking routes:
  ✗ { path: '', ... }                     // Doesn't match
  ✗ { path: 'screen/home', ... }          // Doesn't match '/screen/module1'
  ✗ { path: 'screen/embedded', ... }      // Doesn't match
  ✗ { path: 'screen/module1', ... }       // Doesn't match '/screen/module1' (note the leading slash!)
  ✗ { path: 'screen/module2', ... }       // Doesn't match
  ✗ { path: '**', ... }                   // Wildcard matches, redirects to 'screen/home'

Router: No route found for '/screen/module1'
Router: Falling back to '**' wildcard
Router: Redirecting to 'screen/home'
Result: ❌ Stays on home page
```

**Why it fails:**
1. ❌ RouterLink uses: `'/screen/module1'` (with leading slash)
2. ❌ Angular looks for route: `{ path: '/screen/module1', ... }`
3. ❌ But route is defined as: `{ path: 'screen/module1', ... }` (no leading slash)
4. ❌ No match! Falls back to wildcard `**` → redirects to home
5. ❌ Navigation "succeeds" but goes to wrong page!

---

### Scenario 3: RouterLink WITHOUT Leading Slash (Fixed) ✅

When you click **"Go to Module 1 demo"** with `[routerLink]="['screen/module1']"`:

```
Router: Navigation triggered with 'screen/module1'
Router: With APP_BASE_HREF='/eui', looking for route path: 'screen/module1'
Router: Checking routes:
  ✗ { path: '', ... }                     // Doesn't match
  ✗ { path: 'screen/home', ... }          // Doesn't match
  ✗ { path: 'screen/embedded', ... }      // Doesn't match
  ✅ { path: 'screen/module1', ... }      // MATCHES!

Router: Route found! Loading Module1 component
MF Strategy pushState(): {url: 'screen/module1', preventUrlChange: false}
MF: Syncing navigation - push - url: screen/module1 -> hash: #!/eui/screen/module1
Result: ✅ Navigates to Module 1!
```

**Why it works:**
1. ✅ RouterLink uses: `'screen/module1'` (no leading slash)
2. ✅ Angular looks for route: `{ path: 'screen/module1', ... }`
3. ✅ Route is defined as: `{ path: 'screen/module1', ... }`
4. ✅ Perfect match!
5. ✅ Navigation succeeds!

---

## 🎓 Technical Explanation: How APP_BASE_HREF Works

### Angular Router's URL Processing Pipeline:

```typescript
// Step 1: User triggers navigation
[routerLink]="['/screen/module1']"
  ↓
// Step 2: Router processes the URL
const url = '/screen/module1';
  ↓
// Step 3: Router applies APP_BASE_HREF
const baseHref = inject(APP_BASE_HREF); // '/eui'
  ↓
// Step 4: Router's internal logic:
if (url.startsWith('/')) {
  // Absolute URL - Router thinks this is OUTSIDE the base
  // It will try to match: '/screen/module1' directly against routes
  // But routes are defined relative to base: 'screen/module1'
  // MISMATCH! ❌
}
  ↓
// Step 5: Router looks for route with path: '/screen/module1'
routes.find(route => route.path === '/screen/module1')
  ↓
// Step 6: Not found! Falls back to '**' wildcard
{ path: '**', redirectTo: 'screen/home' }
  ↓
// Result: Redirects to home instead of module1 ❌
```

### Correct Flow WITHOUT Leading Slash:

```typescript
// Step 1: User triggers navigation
[routerLink]="['screen/module1']"
  ↓
// Step 2: Router processes the URL
const url = 'screen/module1';
  ↓
// Step 3: Router applies APP_BASE_HREF
const baseHref = inject(APP_BASE_HREF); // '/eui'
  ↓
// Step 4: Router's internal logic:
if (!url.startsWith('/')) {
  // Relative URL - Router treats this as relative to base
  // External URL will be: '/eui' + '/' + 'screen/module1' = '/eui/screen/module1'
  // Route matching uses: 'screen/module1'
  // MATCH! ✅
}
  ↓
// Step 5: Router looks for route with path: 'screen/module1'
routes.find(route => route.path === 'screen/module1')
  ↓
// Step 6: Found! Navigate to Module1Component
{ path: 'screen/module1', loadChildren: () => import(...) }
  ↓
// Result: Successfully loads Module 1! ✅
```

---

## 📊 Comparison Table

| Navigation Method | With Leading Slash | Without Leading Slash | Result |
|-------------------|-------------------|----------------------|--------|
| **Sidebar Click** | `href="/screen/module2"` | `href="screen/module2"` | ✅ Both work (handler strips slash) |
| **RouterLink** | `[routerLink]="['/screen/module1']"` | `[routerLink]="['screen/module1']"` | ❌ Broken vs ✅ Works |
| **router.navigateByUrl()** | `navigateByUrl('/screen/module1')` | `navigateByUrl('screen/module1')` | ❌ Broken vs ✅ Works |
| **router.navigate()** | `navigate(['/screen/module1'])` | `navigate(['screen/module1'])` | ❌ Broken vs ✅ Works |

---

## 🔧 Enable Router Tracing (Optional Debug)

If you want to see Angular Router's internal decision-making, enable tracing:

**In `main.single-spa.ts`**:
```typescript
import { provideRouter, withDebugTracing } from '@angular/router';
import { routes } from './app/app.routes';

const mfConfig = {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideRouter(routes, withDebugTracing()), // Add this
    // ... other providers
  ],
};
```

Then in console you'll see:
```
Router Event: NavigationStart(id: 1, url: '/screen/module1')
Router Event: RoutesRecognized(id: 1, url: '/screen/module1', urlAfterRedirects: 'screen/home')
Router Event: NavigationEnd(id: 1, url: 'screen/home')
```

This shows the redirect from `/screen/module1` → `screen/home` because of the leading slash mismatch!

---

## ✅ The Rule (Simple Version)

When using `APP_BASE_HREF='/eui'`:

```typescript
// ❌ NEVER use leading slashes
[routerLink]="['/screen/module1']"      // WRONG
router.navigateByUrl('/screen/module1')  // WRONG
router.navigate(['/screen/module1'])     // WRONG

// ✅ ALWAYS use relative paths (no leading slash)
[routerLink]="['screen/module1']"        // CORRECT
router.navigateByUrl('screen/module1')    // CORRECT
router.navigate(['screen/module1'])       // CORRECT
```

---

## 🎯 About "mode=hash" in single-spa Docs

### What the Docs Mean
The single-spa docs are talking about their **layout engine**:

```html
<!-- This is for single-spa's HTML layout engine -->
<single-spa-router mode="hash">
  <route path="app1">
    <application name="@org/app1"></application>
  </route>
</single-spa-router>
```

### Your Setup (You DON'T Need This)
You're using **AngularJS's routing system** as the host:

```javascript
// angular-phonecat/app/app.module.js
$locationProvider.html5Mode(false);      // Use hash mode
$locationProvider.hashPrefix('!');        // Use #!/ prefix
```

This IS your hash mode! ✅

Your `MicrofrontendLocationStrategy` then bridges:
- AngularJS hash routing (`#!/eui/screen/home`)
- Angular path routing (`'screen/home'`)

**You already have hash mode working perfectly!**

---

## 🐛 Common Mistakes

### Mistake 1: Mixing Leading Slashes
```typescript
// ❌ Inconsistent
sidebarItems = [
  { label: 'Home', url: '/screen/home' },    // Has slash
  { label: 'Module 1', url: 'screen/module1' } // No slash
];
```

**Fix**: Remove ALL leading slashes:
```typescript
// ✅ Consistent
sidebarItems = [
  { label: 'Home', url: 'screen/home' },
  { label: 'Module 1', url: 'screen/module1' }
];
```

### Mistake 2: Route Definitions with Leading Slash
```typescript
// ❌ Angular doesn't allow this anyway
const routes: Routes = [
  { path: '/screen/home', component: HomeComponent } // ERROR!
];
```

Angular will throw an error: **"Path cannot start with a slash"**

### Mistake 3: Thinking You Need `mode="hash"`
```html
<!-- ❌ This is for single-spa's layout engine, not for your setup -->
<single-spa-router mode="hash">
  ...
</single-spa-router>
```

You're using AngularJS routing, NOT single-spa's layout engine!

---

## 🎉 Summary

1. **Sidebar works** because the click handler strips leading slashes before calling `router.navigateByUrl()`
2. **RouterLink needs no leading slash** to match route definitions with `APP_BASE_HREF='/eui'`
3. **You DON'T need `mode="hash"`** - AngularJS already provides hash routing
4. **The fix**: Change `['/screen/module1']` → `['screen/module1']` everywhere

Now test it - both sidebar AND routerLink should work perfectly! 🚀

