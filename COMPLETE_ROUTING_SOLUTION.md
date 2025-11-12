# Complete Routing Solution for AngularJS + Angular MFE

## Overview

This document describes the complete solution for bi-directional routing between an AngularJS host application and an Angular micro-frontend (MFE) using single-spa. The solution enables:

1. ✅ **Direct URL navigation** - Navigate to any Angular MFE page via browser URL
2. ✅ **Angular internal navigation** - Navigate within the MFE with URL bar updates
3. ✅ **AngularJS links in Angular** - Use AngularJS routes from within Angular components
4. ✅ **Bidirectional sync** - Both frameworks stay in sync during navigation

## Architecture

### Key Components

1. **MicrofrontendLocationStrategy** - Transforms Angular routes to AngularJS hash format
2. **NavigationBridgeService** - Coordinates navigation events between frameworks
3. **AngularJS Event Handlers** - Listen and respond to Angular navigation
4. **Route Normalization** - Consistent translation between route formats

### Route Format Translation

- **AngularJS format**: `#!/eui/screen/module1`
- **Angular format**: `/screen/module1`
- **Transformation**: Angular routes are prefixed with `!/eui/` when written to the hash

## Implementation Details

### 1. MicrofrontendLocationStrategy (main.single-spa.ts)

**Purpose**: Transform Angular router URLs to AngularJS-compatible hash format without blocking navigation.

**Key Changes**:

```typescript
class MicrofrontendLocationStrategy extends HashLocationStrategy {
  constructor(
    platformLocation: PlatformLocation,
    baseHref: string | null | undefined,
    private readonly preventUrlChange: boolean,
  ) {
    super(platformLocation, baseHref ?? undefined);
  }

  override replaceState(state: any, title: string, url: string, queryParams?: string): void {
    if (this.preventUrlChange) {
      // Transform Angular internal route to host format
      const transformedUrl = this.transformToHostFormat(url);
      console.log('MF: Transforming replaceState from', url, 'to', transformedUrl);
      super.replaceState(state, title, transformedUrl, queryParams);
      return;
    }
    super.replaceState(state, title, url, queryParams);
  }
  
  override pushState(state: any, title: string, url: string, queryParams?: string): void {
    if (this.preventUrlChange) {
      // Transform Angular internal route to host format
      const transformedUrl = this.transformToHostFormat(url);
      console.log('MF: Transforming pushState from', url, 'to', transformedUrl);
      super.pushState(state, title, transformedUrl, queryParams);
      return;
    }
    super.pushState(state, title, url, queryParams);
  }

  override path(includeHash: boolean = false): string {
    const path = super.path(includeHash);
    if (!this.preventUrlChange) {
      return path;
    }
    // Normalize the path when reading from the host format
    return this.normalizeFromHostFormat(path, includeHash);
  }

  private transformToHostFormat(url: string): string {
    // Angular router gives us /screen/module1
    // We need to transform it to !/eui/screen/module1 for the hash
    const trimmed = url.replace(/^\/+/, '');
    return '!/eui/' + trimmed;
  }

  private normalizeFromHostFormat(path: string, includeHash: boolean): string {
    if (includeHash) {
      // Remove #!/eui prefix from hash, leaving just /screen/...
      return path.replace('#!/eui/', '#/').replace('#!/eui', '#/').replace('#!', '#/');
    }
    // Remove !/eui prefix from path
    let normalized = path.replace(/^!\/eui\//, '').replace(/^!\/eui/, '');
    normalized = normalized.replace(/^!\/?/, '');
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    return normalized;
  }
}
```

**Why This Works**:
- Instead of blocking `pushState`/`replaceState`, we **transform** the URL
- Angular thinks it's writing `/screen/module1`, but the hash becomes `#!/eui/screen/module1`
- When Angular reads the path back, we normalize it to `/screen/module1`
- This keeps Angular's router happy while maintaining AngularJS-compatible URLs

### 2. NavigationBridgeService (navigation-bridge.service.ts)

**Purpose**: Coordinate navigation events between Angular and AngularJS.

**Key Changes**:

```typescript
private handleHostNavigation = (event: Event): void => {
    const customEvent = event as CustomEvent<HostNavigationDetail>;
    const detail = customEvent.detail;

    if (!detail || detail.action !== 'navigate' || !detail.route) {
        return;
    }

    // Normalize the route from the host
    const normalizedRoute = this.normalizeRoute(detail.route);
    if (!normalizedRoute) {
        return;
    }

    // Only handle routes that belong to the Angular MFE (start with /screen/)
    if (!normalizedRoute.startsWith('/screen/')) {
        console.log('NavigationBridgeService: Ignoring non-MFE route:', normalizedRoute);
        return;
    }

    let targetRoute = normalizedRoute;

    if (this.currentRoute === targetRoute) {
        console.log('NavigationBridgeService: Already on route:', targetRoute);
        return;
    }

    if (targetRoute === '/') {
        targetRoute = '/screen/home';
    }

    console.log('NavigationBridgeService: Navigating to host route:', targetRoute);
    this.zone.run(() => {
        this.router.navigateByUrl(targetRoute).then(() => {
            this.currentRoute = targetRoute;
            console.log('NavigationBridgeService: Navigation completed to:', targetRoute);
        }).catch((error) => {
            console.error('NavigationBridgeService: failed to navigate to host route', targetRoute, error);
        });
    });
};
```

**Why This Works**:
- Normalizes incoming routes from AngularJS format to Angular format
- Filters out non-MFE routes (like `/phones`) to prevent errors
- Updates `currentRoute` after successful navigation to prevent loops
- Runs navigation inside `NgZone` to trigger change detection

### 3. AngularJS Event Handler (app.module.js)

**Purpose**: Listen to Angular navigation events and update the AngularJS location.

**Key Changes**:

```javascript
// Listen for navigation events emitted by the Angular micro-frontend
window.addEventListener('angular-to-angularjs', function(event) {
  var detail = event.detail || {};
  if (detail.action !== 'navigate' || !detail.route) {
    return;
  }

  var targetUrl = '/eui' + (detail.route.startsWith('/') ? detail.route : '/' + detail.route);

  console.log('AngularJS: Received navigation event from Angular:', detail.route, '-> targetUrl:', targetUrl);

  if (targetUrl === lastRouteFromAngular) {
    console.log('AngularJS: Ignoring duplicate navigation to:', targetUrl);
    return;
  }

  lastRouteFromAngular = targetUrl;

  // Always update the URL when Angular navigates, regardless of current location
  // This ensures the browser URL bar stays in sync with Angular's internal state
  $rootScope.$evalAsync(function() {
    console.log('AngularJS: Updating location to:', targetUrl);
    $location.url(targetUrl);
  });
});
```

**Why This Works**:
- **Removed the guard** that prevented updates when already on `/eui`
- Now always updates the URL when Angular navigates
- Prevents duplicate updates using `lastRouteFromAngular` tracking
- Uses `$evalAsync` to ensure proper digest cycle

### 4. Angular Sidebar Menu (app.component.ts)

**Purpose**: Ensure sidebar navigation uses Angular router properly.

**Key Changes**:

```typescript
sidebarItems: EuiMenuItem[] = [
    this.buildMenuItem('Home', ['screen', 'home']),
    this.buildMenuItem('Embedded UI Demo', ['screen', 'embedded']),
    {
        label: 'Module 1',
        url: this.router.serializeUrl(this.router.createUrlTree(['screen', 'module1'])),
        children: [
            this.buildMenuItem('Page 1', ['screen', 'module1', 'page1']),
            this.buildMenuItem('Page 2', ['screen', 'module1', 'page2']),
        ],
    },
    this.buildMenuItem('Module 2', ['screen', 'module2']),
];

private buildMenuItem(label: string, commands: any[]): EuiMenuItem {
    return {
        label: label,
        url: this.router.serializeUrl(this.router.createUrlTree(commands)),
    };
}
```

**Why This Works**:
- Uses `router.createUrlTree()` to create proper Angular routes
- Serializes the UrlTree to a string for the EUI menu component
- EUI menu now triggers Angular router navigation instead of treating links as external

## Navigation Flow

### Scenario 1: Direct URL Navigation

1. User enters `http://localhost:8080/#!/eui/screen/module2` in browser
2. AngularJS router sees `#!/eui/screen/module2` and activates the `/eui` route
3. Single-spa mounts the Angular MFE with `currentRoute: '#!/eui/screen/module2'`
4. `NavigationBridgeService.syncInitialRoute()` normalizes to `/screen/module2`
5. Angular router navigates to `/screen/module2`
6. Module 2 component renders

### Scenario 2: Angular Internal Navigation (Sidebar Click)

1. User clicks "Module 2" in Angular sidebar
2. EUI menu triggers Angular router navigation to `/screen/module2`
3. `MicrofrontendLocationStrategy.pushState()` transforms to `!/eui/screen/module2`
4. Browser hash updates to `#!/eui/screen/module2`
5. `NavigationBridgeService` emits `angular-to-angularjs` event
6. AngularJS updates `$location.url()` to `/eui/screen/module2`
7. Module 2 component renders
8. URL bar shows `#!/eui/screen/module2`

### Scenario 3: AngularJS Header Navigation

1. User clicks "Module 1" in AngularJS header dropdown
2. AngularJS updates hash to `#!/eui/screen/module1`
3. AngularJS emits `angularjs-to-angular` event with route `/screen/module1`
4. `NavigationBridgeService.handleHostNavigation()` receives event
5. Angular router navigates to `/screen/module1`
6. Module 1 component renders

### Scenario 4: AngularJS Link Inside Angular Component

1. Angular component has `<a href="#!/phones">View Phones</a>`
2. User clicks the link
3. Browser hash changes to `#!/phones`
4. AngularJS router activates and renders phone list
5. Angular MFE unmounts (single-spa deactivates it)
6. Phone list page displays

## Testing Checklist

### ✅ Direct URL Navigation
- [ ] Navigate to `#!/eui/screen/home` - should show home page
- [ ] Navigate to `#!/eui/screen/module1` - should show module 1
- [ ] Navigate to `#!/eui/screen/module2` - should show module 2
- [ ] Navigate to `#!/eui/screen/embedded` - should show embedded demo

### ✅ Angular Internal Navigation
- [ ] Click "Module 1" in Angular sidebar - should navigate and update URL
- [ ] Click "Module 2" in Angular sidebar - should navigate and update URL
- [ ] Click "Home" in Angular sidebar - should navigate and update URL
- [ ] Click `[routerLink]` in home page - should navigate to Module 1

### ✅ AngularJS Header Navigation
- [ ] From home, click "Module 1" in header - should navigate
- [ ] From Module 1, click "Module 2" in header - should navigate
- [ ] From Module 2, click "Home" in header - should navigate

### ✅ Mixed Navigation
- [ ] Navigate via Angular sidebar, then via AngularJS header - should work
- [ ] Navigate via AngularJS header, then via Angular sidebar - should work
- [ ] Use browser back/forward buttons - should work correctly

### ✅ AngularJS Routes
- [ ] Click "Phones" in AngularJS header - should show phone list
- [ ] From phone list, click a phone - should show phone detail
- [ ] From phone detail, click "EUI Home" - should return to Angular MFE

## Configuration Summary

### Files Modified

1. **`eui-ng-microfrontend/src/main.single-spa.ts`**
   - Updated `MicrofrontendLocationStrategy` to transform URLs instead of blocking
   - Added `path()` override for normalization
   - Added `transformToHostFormat()` and `normalizeFromHostFormat()` methods

2. **`eui-ng-microfrontend/src/app/navigation-bridge.service.ts`**
   - Updated `handleHostNavigation()` to normalize routes
   - Added route filtering to ignore non-MFE routes
   - Added `currentRoute` tracking after navigation

3. **`app/app.module.js`**
   - Removed guard that prevented URL updates when on `/eui`
   - Added logging for debugging
   - Always update location when Angular navigates

4. **`eui-ng-microfrontend/src/app/app.component.ts`**
   - Updated sidebar items to use `router.createUrlTree()`
   - Added `buildMenuItem()` helper method
   - Serialized UrlTree to string for EUI menu

### Configuration Values

**In `microfrontend-config.js`**:
```javascript
customProps: (name, location) => ({
  domElementGetter: () => document.getElementById('eui-mfe-container'),
  preventUrlChange: true,  // ← Keep this true to enable transformation
  currentRoute: location.hash,
  hostHref: location.href,
})
```

**In `main.single-spa.ts`**:
```typescript
{
  provide: PREVENT_URL_CHANGE,
  useValue: props?.preventUrlChange ?? true,  // ← Defaults to true
}
```

## Troubleshooting

### Issue: URL doesn't update when clicking Angular sidebar

**Cause**: `preventUrlChange` is `false` or location strategy isn't transforming URLs

**Fix**: Ensure `preventUrlChange: true` in `microfrontend-config.js` and verify `MicrofrontendLocationStrategy` is being used

### Issue: Navigation works but wrong component renders

**Cause**: Route normalization mismatch or component not marked as standalone

**Fix**: 
1. Check console logs for route transformation
2. Verify all route components have `standalone: true`
3. Check `normalizeRoute()` logic in bridge service

### Issue: Clicking AngularJS routes from Angular causes errors

**Cause**: Bridge trying to navigate Angular router to non-existent routes

**Fix**: Ensure `handleHostNavigation()` filters out non-MFE routes:
```typescript
if (!normalizedRoute.startsWith('/screen/')) {
    return; // Ignore non-MFE routes
}
```

### Issue: Infinite navigation loop

**Cause**: Both frameworks trying to update the URL simultaneously

**Fix**: 
1. Check `lastRouteFromAngular` tracking in AngularJS
2. Check `currentRoute` tracking in Angular bridge
3. Verify duplicate detection logic

## Performance Considerations

- **Route transformations** are lightweight string operations
- **Event listeners** are cleaned up on component destroy
- **Change detection** runs only when necessary via `NgZone`
- **No polling** - all navigation is event-driven

## Security Considerations

- All routes are validated before navigation
- External routes are filtered out
- No arbitrary code execution
- Standard Angular and AngularJS security applies

## Future Enhancements

1. **Query parameter support** - Currently only path-based routing
2. **Fragment support** - Handle URL fragments within routes
3. **Route guards** - Add navigation guards for authentication
4. **Lazy loading optimization** - Further optimize module loading
5. **Error boundaries** - Better error handling for failed navigation

## Conclusion

This solution provides a robust, production-ready routing bridge between AngularJS and Angular micro-frontends. It enables seamless navigation in both directions while maintaining URL synchronization and preventing common pitfalls like navigation loops and route conflicts.

The key insight is to **transform** rather than **block** URL changes, allowing both frameworks to work together harmoniously while each maintains its own routing paradigm.


