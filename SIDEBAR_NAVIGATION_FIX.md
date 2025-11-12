# Angular MFE Sidebar Navigation Fix

## Problem
- ✅ **AngularJS Header Navigation**: Working correctly → Uses `href="#!/eui/screen/home"` → Triggers hash change → single-spa detects it → Angular Router syncs
- ❌ **Angular Sidebar Navigation**: URL updates but content doesn't change → Navigation fails with circular loop

## Root Causes (Two Issues)

### Issue 1: Circular Navigation Loop
The EUI `<eui-app-sidebar-menu>` component generates plain `<a href="...">` links. When clicked:
1. Angular Router navigates → Updates hash to `#!/eui/screen/module2`
2. Hash change triggers AngularJS's `$location` service
3. AngularJS broadcasts event → `NavigationBridgeService` hears it
4. `NavigationBridgeService` tries to navigate AGAIN → Angular Router **cancels** the duplicate navigation

### Issue 2: Route Path Mismatch with APP_BASE_HREF
According to [Angular v19 APP_BASE_HREF docs](https://v19.angular.dev/api/common/APP_BASE_HREF#usage-notes):
- When `APP_BASE_HREF = '/eui'`, Angular strips the base from URLs
- External URL: `#!/eui/screen/home` → Internal route should be: `'screen/home'` (NO leading slash)
- Our routes were defined correctly: `{ path: 'screen/home', ... }`
- But we were navigating with leading slash: `router.navigateByUrl('/screen/home')` ❌

## Solution Implemented

### 1. Fixed Circular Navigation in NavigationBridgeService
**File**: `/angular-phonecat/eui-ng-microfrontend/src/app/navigation-bridge.service.ts`

Added a flag to prevent circular navigation:
```typescript
private isNavigatingInternally = false; // Flag to prevent circular navigation

public notifyInternalNavigation(): void {
    this.isNavigatingInternally = true;
    // Reset flag after a delay in case the navigation fails
    setTimeout(() => {
        if (this.isNavigatingInternally) {
            this.isNavigatingInternally = false;
        }
    }, 500);
}

private handleHostNavigation = (event: Event): void => {
    // Ignore events triggered by internal Angular navigation
    if (this.isNavigatingInternally) {
        console.log('🔄 NavigationBridge: Ignoring host event (internal navigation in progress)');
        this.isNavigatingInternally = false;
        return;
    }
    // ... rest of handler
};
```

### 2. Fixed Route Path Format (No Leading Slashes)
**File**: `/angular-phonecat/eui-ng-microfrontend/src/app/app.component.ts`

Updated sidebar URLs to match route definitions (no leading slashes):
```typescript
// Before
sidebarItems: EuiMenuItem[] = [
    { label: 'Home', url: '/screen/home' },  // ❌ Leading slash doesn't match route definitions
];

// After
sidebarItems: EuiMenuItem[] = [
    { label: 'Home', url: 'screen/home' },  // ✅ No leading slash matches route definitions
];
```

### 3. Added Click Interceptor for Sidebar Navigation
**File**: `/angular-phonecat/eui-ng-microfrontend/src/app/app.component.ts`

Added `setupSidebarNavigationHandler()` method that:
1. Listens for clicks on sidebar links using event delegation
2. Prevents default href navigation
3. Notifies NavigationBridge to prevent circular navigation
4. Uses Angular Router's `navigateByUrl()` with **no leading slash**
5. Extracts the correct route from various href formats

```typescript
private setupSidebarNavigationHandler(): void {
    setTimeout(() => {
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const link = target.closest('a[href]') as HTMLAnchorElement;
            
            // Check if it's a sidebar navigation link
            if (!link || !link.closest('eui-app-sidebar')) return;
            
            const href = link.getAttribute('href');
            if (!href || (!href.includes('/screen/') && !href.includes('screen/'))) return;
            
            // Prevent default and use Angular Router
            event.preventDefault();
            event.stopPropagation();
            
            // Extract route WITHOUT leading slash to match route definitions
            let route = href;
            if (route.includes('#!/eui/')) {
                route = route.split('#!/eui/')[1]; // screen/home
            } else if (route.includes('/screen/')) {
                route = route.match(/\/screen\/[^#?\s]*/)?.[0].substring(1) || route;
            }
            
            // Ensure no leading slash
            if (route.startsWith('/')) {
                route = route.substring(1);
            }
            
            console.log('🎯 Navigating to:', route);
            
            // Notify NavigationBridge to prevent circular navigation
            this.navigationBridge.notifyInternalNavigation();
            
            // Navigate using Angular Router
            this.router.navigateByUrl(route);
        }, true);
    }, 100);
}
```

### 3. Enhanced Debugging in LocationStrategy
**File**: `/angular-phonecat/eui-ng-microfrontend/src/main.single-spa.ts`

Added console logging to track navigation flow:
- `path()`: Shows hash extraction process
- `pushState()` / `replaceState()`: Shows when navigation methods are called

## Architecture Overview

### Navigation Flow for Sidebar (Fixed)

```
User clicks sidebar "Module 2"
  ↓
Click interceptor catches event
  ↓
Event.preventDefault() - Block default href navigation
  ↓
router.navigateByUrl('/screen/module2')
  ↓
MicrofrontendLocationStrategy.pushState() called
  ↓
buildHashPath() converts: /screen/module2 → /eui/screen/module2
  ↓
Updates browser to: #!/eui/screen/module2
  ↓
Angular Router navigates to Module2Component ✅
  ↓
<router-outlet> displays new component ✅
```

## Best Practices for Angular MFE Routing (from single-spa docs)

### Option 1: Use Native Hash Mode (Not Recommended for Mixed MFEs)
Based on [single-spa-angular #64](https://github.com/single-spa/single-spa-angular/issues/64):

```typescript
@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    exports: [RouterModule]
})
```

**Why we DON'T use this**: Would create double hashes (`#!/#!/eui/screen/home`) when hosted in AngularJS

### Option 2: Custom LocationStrategy (Our Approach ✅)
Based on [single-spa Angular routing docs](https://single-spa.js.org/docs/ecosystem-angular/#routing):

1. Set `APP_BASE_HREF` to namespace routes (`/eui`)
2. Use `PathLocationStrategy` as base class
3. Override `path()`, `pushState()`, `replaceState()` to bridge with hash routing
4. Intercept component library navigation that doesn't use `routerLink`

## Configuration Checklist

- [x] `APP_BASE_HREF = '/eui'` for Angular MFE namespace
- [x] `PathLocationStrategy` (NOT HashLocationStrategy)
- [x] Custom LocationStrategy with `path()` override to read hash
- [x] `preventUrlChange: false` for `eui-mfe-container`
- [x] `preventUrlChange: true` for `eui-embedded-container`
- [x] `prepareExternalUrl()` to handle internal routing
- [x] `syncWithParentHash()` to update browser hash for single-spa
- [x] Click interceptor for sidebar navigation
- [x] Leading slashes in sidebar URLs

## Testing Steps

1. **Test AngularJS Header Navigation** (should still work):
   ```
   Click "EUI Microfrontend" → "EUI Home"
   Expected: ✅ URL changes to #!/eui/screen/home
   Expected: ✅ Content shows HomeComponent
   ```

2. **Test Angular Sidebar Navigation** (now fixed):
   ```
   Click "Module 2" in sidebar
   Expected: ✅ URL changes to #!/eui/screen/module2
   Expected: ✅ Content shows Module2Component
   Expected: ✅ Console logs "Sidebar click intercepted"
   Expected: ✅ Console logs "Navigation successful to: /screen/module2"
   ```

3. **Test Nested Routes**:
   ```
   Click "Module 1" → "Page 1" in sidebar
   Expected: ✅ URL changes to #!/eui/screen/module1/page1
   Expected: ✅ Content shows Page1Component
   ```

## Key Insight: APP_BASE_HREF Usage

According to [Angular v19 APP_BASE_HREF documentation](https://v19.angular.dev/api/common/APP_BASE_HREF#usage-notes):

```typescript
@NgModule({
  providers: [{provide: APP_BASE_HREF, useValue: '/my/app'}]
})
class AppModule {}
```

When `APP_BASE_HREF = '/eui'`:
- **External URL**: `#!/eui/screen/home`
- **Angular processes**: Strips base → `/screen/home`
- **Route matching**: Looks for `'screen/home'` (NO leading slash)
- **Navigation**: Must use `router.navigateByUrl('screen/home')` (NO leading slash)

This is why routes MUST be defined as:
```typescript
{ path: 'screen/home', component: HomeComponent }  // ✅ Correct
{ path: '/screen/home', component: HomeComponent } // ❌ Invalid (Angular doesn't allow leading slash)
```

And navigation MUST be:
```typescript
this.router.navigateByUrl('screen/home')  // ✅ Correct
this.router.navigateByUrl('/screen/home') // ❌ Won't match route definitions
```

## Debug Console Logs

When sidebar navigation works correctly, you should see:
```
🎯 Sidebar click intercepted: screen/home
🎯 Navigating to: screen/home
🔄 NavigationBridge: Ignoring host event (internal navigation in progress)
MF Strategy pushState(): {url: 'screen/module2', preventUrlChange: false}
MF: Syncing navigation - push - url: screen/module2 -> hash: #!/eui/screen/module2
MF Strategy path(): {hash: '#!/eui/screen/module2', extractedPath: '/screen/module2'}
✅ Navigation successful to: screen/module2
```

Note: The `NavigationBridge` ignores the AngularJS event, preventing the circular loop!

## Alternative Solutions (if EUI sidebar supports it)

### If EUI sidebar supports routerLink:
Replace `url` with `routerLink`:
```typescript
sidebarItems: EuiMenuItem[] = [
    { label: 'Home', routerLink: ['/screen/home'] },  // If supported
];
```

### If EUI sidebar supports click handlers:
```typescript
sidebarItems: EuiMenuItem[] = [
    { 
        label: 'Home', 
        onClick: () => this.router.navigate(['/screen/home'])  // If supported
    },
];
```

## References

1. [single-spa Angular Routing Documentation](https://single-spa.js.org/docs/ecosystem-angular/#routing)
2. [GitHub Issue #62 - Router links between applications](https://github.com/single-spa/single-spa-angular/issues/62)
3. [GitHub Issue #64 - Router not working without APP_BASE_HREF](https://github.com/single-spa/single-spa-angular/issues/64)
4. [Angular Router API](https://angular.io/api/router/Router)
5. [Angular LocationStrategy](https://angular.io/api/common/LocationStrategy)

## Key Takeaways

1. **APP_BASE_HREF** requires routes WITHOUT leading slashes: `'screen/home'` not `'/screen/home'`
2. **Circular navigation** can occur when Angular updates hash → AngularJS detects it → tries to navigate again
3. **NavigationBridge** needs a flag to prevent circular navigation during internal routing
4. **Component libraries** that don't use `routerLink` require click interception
5. **Route matching** in Angular with `APP_BASE_HREF` strips the base from URLs before matching
6. **Debug logging** is crucial for diagnosing navigation issues in microfrontends

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `navigation-bridge.service.ts` | Added `isNavigatingInternally` flag | Prevent circular navigation |
| `navigation-bridge.service.ts` | Added `notifyInternalNavigation()` method | Allow components to signal internal navigation |
| `navigation-bridge.service.ts` | Updated `normalizeRoute()` to remove leading slashes | Match route definitions |
| `app.component.ts` | Changed sidebar URLs from `'/screen/home'` to `'screen/home'` | Match route definitions |
| `app.component.ts` | Added `setupSidebarNavigationHandler()` | Intercept sidebar clicks |
| `app.component.ts` | Call `navigationBridge.notifyInternalNavigation()` | Prevent circular navigation |
| `app.component.ts` | Extract routes without leading slashes | Match route definitions |

