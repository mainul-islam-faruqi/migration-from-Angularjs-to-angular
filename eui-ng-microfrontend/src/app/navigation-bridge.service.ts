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
        const cleaned = rawRoute.replace(/^#!?\/?/, '').replace(/^eui/, '').replace(/^\/eui/, '');
        let path = cleaned;

        // Strip any leading hash fragments like '#/screen/...'
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

    private detectEmbedded(): boolean {
        const embeddedContainer = document.getElementById('eui-embedded-container');
        const appRoot = document.querySelector('app-root');
        return !!embeddedContainer && !!appRoot && embeddedContainer.contains(appRoot);
    }
}

