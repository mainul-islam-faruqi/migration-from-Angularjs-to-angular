import { Injectable, OnDestroy, inject, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { HOST_INITIAL_ROUTE } from './routing.tokens';

interface HostNavigationDetail {
    action: 'navigate';
    route: string;
}

@Injectable({
    providedIn: 'root',
})
export class NavigationBridgeService implements OnDestroy {
    private router = inject(Router);
    private zone = inject(NgZone);
    private subscriptions = new Subscription();
    private currentRoute = '';
    private readonly embeddedMode = this.detectEmbedded();
    private initialRoute = inject(HOST_INITIAL_ROUTE, { optional: true });
    private isNavigatingInternally = false; // Flag to prevent circular navigation

    constructor() {
        if (this.embeddedMode) {
            // In embedded mode we skip wiring the full bridge to avoid host hash changes
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

    ngOnDestroy(): void {
        if (!this.embeddedMode) {
            window.removeEventListener('angularjs-to-angular', this.handleHostNavigation);
            this.subscriptions.unsubscribe();
        }
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
        // Ignore events triggered by internal Angular navigation to prevent circular loops
        if (this.isNavigatingInternally) {
            console.log('🔄 NavigationBridge: Ignoring host event (internal navigation in progress)');
            this.isNavigatingInternally = false;
            return;
        }

        const customEvent = event as CustomEvent<HostNavigationDetail>;
        const detail = customEvent.detail;

        if (!detail || detail.action !== 'navigate' || !detail.route) {
            return;
        }

        // Normalize route to match route definitions (no leading slash)
        let targetRoute = detail.route;
        if (targetRoute.startsWith('/')) {
            targetRoute = targetRoute.substring(1);
        }

        if (this.currentRoute === targetRoute) {
            console.log('🔄 NavigationBridge: Already at target route:', targetRoute);
            return;
        }

        if (!targetRoute || targetRoute === '') {
            targetRoute = 'screen/home';
        }

        console.log('📡 NavigationBridge: Navigating from host to:', targetRoute);
        this.zone.run(() => {
            this.router.navigateByUrl(targetRoute).catch((error) => {
                console.error('NavigationBridgeService: failed to navigate to host route', targetRoute, error);
            });
        });
    };
    
    /**
     * Call this before internal Angular navigation to prevent circular navigation
     */
    public notifyInternalNavigation(): void {
        this.isNavigatingInternally = true;
        // Reset flag after a delay in case the navigation fails
        setTimeout(() => {
            if (this.isNavigatingInternally) {
                console.log('🔄 NavigationBridge: Resetting internal navigation flag');
                this.isNavigatingInternally = false;
            }
        }, 500);
    }

    private syncInitialRoute(): void {
        const route = this.normalizeRoute(this.initialRoute);
        if (!route) {
            return;
        }

        // Avoid re-navigation if already at the correct route
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

        // Remove hashbang prefixes like '#!/eui'
        const cleaned = rawRoute.replace(/^#!?\/?/, '').replace(/^eui\/?/, '').replace(/^\/eui\/?/, '');
        let path = cleaned;

        // Strip any leading hash fragments like '#/screen/...'
        if (path.startsWith('#')) {
            path = path.substring(1);
        }

        if (!path) {
            return 'screen/home'; // No leading slash to match route definitions
        }

        // Remove leading slash to match route definitions (routes are 'screen/home' not '/screen/home')
        if (path.startsWith('/')) {
            path = path.substring(1);
        }

        return path;
    }

    private detectEmbedded(): boolean {
        const embeddedContainer = document.getElementById('eui-embedded-container');
        const appRoot = document.querySelector('app-root');
        return !!embeddedContainer && !!appRoot && embeddedContainer.contains(appRoot);
    }
}

