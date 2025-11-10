# AngularJS ↔️ Angular Micro-Frontend Routing Bridge

This guide documents the routing bridge implemented in the sample repo so you can port it to the enterprise AngularJS host and Angular (eUI) micro-frontend. It covers every touch point, why it exists, and the data flow between the two frameworks.

---

## 1. High-Level Flow

1. **AngularJS header/menu** updates the hash to a route under `#!/eui/...`.
2. The **single-spa root config** mounts the Angular MFE and forwards the browser hash via custom props.
3. The **Angular bridge service**:
   - Applies the initial route (normalised from the host hash) before boot.
   - Listens for host events (`angularjs-to-angular`) and navigates inside `NgZone`.
   - Emits events (`angular-to-angularjs`) on every Angular navigation so the host hash stays in sync.
4. AngularJS listens for those events and rewrites `$location` only when the host is displaying the MFE, preventing loops.

---

## 2. AngularJS Host Changes

### 2.1 `app/app.module.js`

Embed the routing bridge in the AngularJS run block:

- Track the last route the MFE asked for (`lastRouteFromAngular`) using the full `/eui/...` URL.
- Update `$location` only when already in an eUI page.
- On `$locationChangeSuccess`, translate the host hash to an internal route and broadcast it back to the Angular app.

```12:61:app/app.module.js
// ... existing code ...
  window.addEventListener('angular-to-angularjs', function(event) {
    var detail = event.detail || {};
    if (detail.action !== 'navigate' || !detail.route) {
      return;
    }

    var targetUrl = '/eui' + (detail.route.startsWith('/') ? detail.route : '/' + detail.route);

    if (targetUrl === lastRouteFromAngular) {
      return;
    }

    lastRouteFromAngular = targetUrl;

    if ($location.url().indexOf('/eui') !== 0) {
      return;
    }

    $rootScope.$evalAsync(function() {
      $location.url(targetUrl);
    });
  });

  $rootScope.$on('$locationChangeSuccess', function() {
    var currentUrl = $location.url();

    if (currentUrl === lastRouteFromAngular) {
      lastRouteFromAngular = null;
      return;
    }

    if (currentUrl.indexOf('/eui') !== 0) {
      return;
    }

    var internalRoute = currentUrl.replace(/^\/eui/, '') || '/screen/home';
    if (!internalRoute.startsWith('/')) {
      internalRoute = '/' + internalRoute;
    }

    var navigationEvent = new CustomEvent('angularjs-to-angular', {
      detail: {
        action: 'navigate',
        route: internalRoute
      }
    });
    window.dispatchEvent(navigationEvent);
  });
```

### 2.2 `app/microfrontend-config.js`

Pass host routing metadata into the Angular micro-frontend on every mount:

```60:99:app/microfrontend-config.js
  registerApplication({
    name: 'eui-desktop',
    app: () => System.import('eui-desktop'),
    activeWhen: location => location.hash.includes('eui'),
    customProps: (name, location) => ({
      domElementGetter: () => document.getElementById('eui-mfe-container'),
      preventUrlChange: true,
      currentRoute: location.hash,
      hostHref: location.href,
    })
  });
```

---

## 3. Angular Micro-Frontend Changes

### 3.1 Routing tokens (`src/app/routing.tokens.ts`)

Add a token for the host-provided initial route:

```1:11:src/app/routing.tokens.ts
export const HOST_INITIAL_ROUTE = new InjectionToken<string | null>('HOST_INITIAL_ROUTE', {
    factory: () => null,
});
```

### 3.2 Single-spa entry (`src/main.single-spa.ts`)

Provide the new token to the Angular app:

```128:311:src/main.single-spa.ts
  const mfConfig = {
    ...appConfig,
    providers: [
      ...appConfig.providers,
      {
        provide: PREVENT_URL_CHANGE,
        useValue: props?.preventUrlChange ?? true,
      },
      {
        provide: HOST_INITIAL_ROUTE,
        useValue: props?.currentRoute ?? null,
      },
      {
        provide: LocationStrategy,
        useFactory: createMicrofrontendLocationStrategy,
        deps: [PlatformLocation, [new Optional(), new Inject(APP_BASE_HREF)], PREVENT_URL_CHANGE],
      }
    ],
    rootElement: domElement.querySelector('app-root') as Element,
  };
```

### 3.3 Bridge service (`src/app/navigation-bridge.service.ts`)

Key responsibilities:

- Normalise the host hash (`#!/eui/...`) into a router path (`/screen/module1`).
- Apply that route on bootstrap (only once) so the MFE starts on the correct page.
- Listen for `angularjs-to-angular` and navigate within `NgZone`.
- Emit `angular-to-angularjs` on every Angular navigation.

```13:137:src/app/navigation-bridge.service.ts
export class NavigationBridgeService implements OnDestroy {
    private router = inject(Router);
    private zone = inject(NgZone);
    private subscriptions = new Subscription();
    private currentRoute = '';
    private readonly embeddedMode = this.detectEmbedded();
    private initialRoute = inject(HOST_INITIAL_ROUTE, { optional: true });

    constructor() {
        if (this.embeddedMode) {
            return;
        }

        this.syncInitialRoute();

        this.subscriptions.add(
            this.router.events
                .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
                .subscribe((event) => {
                    this.handleAngularNavigation(event);
                }),
        );

        window.addEventListener('angularjs-to-angular', this.handleHostNavigation);
    }

    private handleAngularNavigation(event: NavigationEnd): void {
        this.currentRoute = event.urlAfterRedirects;
        const navigateEvent = new CustomEvent('angular-to-angularjs', {
            detail: {
                action: 'navigate',
                route: this.currentRoute,
                sourceHref: window.location.href,
            },
        });
        window.dispatchEvent(navigateEvent);
    }

    private handleHostNavigation = (event: Event): void => {
        const customEvent = event as CustomEvent<HostNavigationDetail>;
        const detail = customEvent.detail;

        if (!detail || detail.action !== 'navigate' || !detail.route) {
            return;
        }

        let targetRoute = detail.route.startsWith('/') ? detail.route : `/${detail.route}`;

        if (this.currentRoute === targetRoute) {
            return;
        }

        if (targetRoute === '/') {
            targetRoute = '/screen/home';
        }

        this.zone.run(() => {
            this.router.navigateByUrl(targetRoute).catch((error) => {
                console.error('NavigationBridgeService: failed to navigate to host route', targetRoute, error);
            });
        });
    };

    private syncInitialRoute(): void {
        const route = this.normalizeRoute(this.initialRoute);
        if (!route) {
            return;
        }

        if (this.router.url === route) {
            this.currentRoute = route;
            return;
        }

        this.zone.run(() => {
            this.router.navigateByUrl(route, { replaceUrl: true }).then(() => {
                this.currentRoute = route;
            }).catch(err => {
                console.error('NavigationBridgeService: failed to apply initial route from host', route, err);
            });
        });
    }

    private normalizeRoute(rawRoute: string | null | undefined): string | null {
        if (!rawRoute) {
            return null;
        }

        const cleaned = rawRoute
            .replace(/^#!?/, '')
            .replace(/^\/?eui/, '')
            .replace(/^\/?/, '');

        let path = cleaned;

        if (path.startsWith('#')) {
            path = path.substring(1);
        }

        if (!path) {
            return '/screen/home';
        }

        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        return path;
    }
}
```

---

## 4. Testing Checklist

1. Restart both servers (AngularJS on `8080`, Angular MFE on `4300`) to load the new bundles.
2. From the AngularJS header dropdown, navigate to Home, Embedded UI Demo, Module 1, Module 2. The view should switch instantly, hash becomes `#!/eui/...`.
3. Use the EUI sidebar to navigate; the host hash and Angular view stay in sync.
4. Browser back/forward works across both AngularJS and Angular pages.
5. Existing AngularJS routes (`#!/phones`, `#!/dashboard`, etc.) continue to function, because the bridge ignores non-eUI paths.

---

## 5. Common Pitfalls

- **Missing NgZone:** If host-driven navigation runs outside Angular’s zone, the view won’t update. Always wrap router calls in `zone.run(...)`.
- **Infinite loops:** Ensure the host compares the full `/eui/...` URL before rewriting `$location`, and the Angular bridge tracks `currentRoute`.
- **Initial hash ignored:** Provide the host’s hash through single-spa props and normalise it before calling `router.navigateByUrl`.
- **Asset 404s (`assets/i18n`, icons):** Either serve the assets from the host or proxy them to the MFE server. They don’t break routing but clutter logs.

---

## 6. Applying to the Enterprise App

1. Identify the host module that controls navigation (the equivalent of `app.module.js`) and add the event listeners.
2. Update your single-spa root config (or custom bootstrap) to pass `currentRoute` and set `preventUrlChange`.
3. Port the Angular changes into your real micro-frontend:
   - Tokens
   - Single-spa provider wiring
   - Bridge service (Injected once at root; no template references needed).
4. Test with the actual host routes and authentication flows.

With these pieces, the AngularJS shell remains the URL authority during the migration, while Angular’s router drives the rendered content. All navigation surfaces—host menus, embedded links, micro-frontend internal links—stay in sync.

