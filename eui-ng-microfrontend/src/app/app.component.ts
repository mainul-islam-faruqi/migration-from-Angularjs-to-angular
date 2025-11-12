import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { EuiLayoutModule, EUI_NOTIFICATIONS } from '@eui/components/layout';
import { EUI_LANGUAGE_SELECTOR } from '@eui/components/eui-language-selector';
import { EUI_USER_PROFILE } from '@eui/components/eui-user-profile';
import { EUI_ICON } from '@eui/components/eui-icon';
import { EuiMenuItem } from '@eui/components/eui-menu';
import { EmbeddedComponent } from './embedded/embedded.component';
import { SimplePhoneCardComponent } from './simple-phone-card/simple-phone-card.component';
import { NavigationBridgeService } from './navigation-bridge.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',

    imports: [
        CommonModule,
        TranslateModule,
        EuiLayoutModule,
        RouterOutlet,
        EmbeddedComponent,
        SimplePhoneCardComponent,
        ...EUI_ICON,
        ...EUI_USER_PROFILE,
        ...EUI_LANGUAGE_SELECTOR,
        ...EUI_NOTIFICATIONS,
    ],
})
export class AppComponent implements OnInit {
    private router = inject(Router);
    private navigationBridge = inject(NavigationBridgeService);
    
    // Add window reference for debugging
    window = window;

    constructor() {
        // Intercept ALL navigation (sidebar + routerLinks) to ensure consistent routing
        this.setupNavigationHandler();
    }
    
    // Sidebar items - use route format matching route definitions (no leading slash)
    // Routes are defined as 'screen/home' not '/screen/home' to work with APP_BASE_HREF='/eui'
    sidebarItems: EuiMenuItem[] = [
        { label: 'Home', url: 'screen/home' },
        { label: 'Embedded UI Demo', url: 'screen/embedded' },
        { label: 'Module 1', url: 'screen/module1', children: [
            { label: 'Page 1', url: 'screen/module1/page1' },
            { label: 'Page 2', url: 'screen/module1/page2' },
        ] },
        { label: 'Module 2', url: 'screen/module2' },
    ];
    notificationItems = [
        { label: 'Title label 1', subLabel: 'Subtitle label' },
        { label: 'Title label 2', subLabel: 'Subtitle label' },
        { label: 'Title label 3', subLabel: 'Subtitle label' },
        { label: 'Title label 4', subLabel: 'Subtitle label' },
    ];

    // Sample phone data for the embedded component
    samplePhone = {
        name: 'iPhone 15 Pro',
        snippet: 'This is an Angular component running inside an AngularJS page! Perfect for migration POC.',
        id: 'angular-component-demo'
    };

    ngOnInit(): void {
        console.log('AppComponent ngOnInit - current URL:', this.router.url);
        console.log('AppComponent ngOnInit - window.location.href:', window.location.href);
        console.log('AppComponent ngOnInit - window.location.hash:', window.location.hash);
        console.log('AppComponent ngOnInit - embedded mode check');
        
        // Don't navigate when embedded - just log the state
        if (this.isEmbedded()) {
            console.log('🎯 Running in embedded mode - no navigation needed');
        } else if (this.isHostedByAngularJs()) {
            console.log('🚦 Running inside AngularJS host - respecting host-provided route:', this.router.url);
        } else {
            const currentUrl = this.router.url;
            if (currentUrl === '/' || currentUrl === '' || currentUrl === '/screen') {
                console.log('🎯 Running in standalone mode - navigating to home');
                setTimeout(() => {
                    this.navigateToHome();
                }, 100);
            } else {
                console.log('🚦 Standalone mode detected existing route:', currentUrl, '- skipping auto navigation');
            }
        }
    }

    navigateToHome() {
        console.log('Navigating to home...');
        // Use route format without leading slash to match route definitions
        this.router.navigateByUrl('screen/home', { replaceUrl: true }).then(() => {
            console.log('Navigation to home completed successfully');
            console.log('New URL:', this.router.url);
        }).catch(err => {
            console.error('Navigation error:', err);
        });
    }

    isEmbedded(): boolean {
        // Check if we're running inside an embedded container
        const embeddedContainer = document.getElementById('eui-embedded-container');
        const appRoot = document.querySelector('app-root');
        const isEmbedded = embeddedContainer !== null && embeddedContainer.contains(appRoot);
        
        // console.log('🔍 isEmbedded check:', {
        //     embeddedContainer: embeddedContainer,
        //     // appRoot: appRoot,
        //     isEmbedded: isEmbedded
        // });
        
        return isEmbedded;
    }

    private isHostedByAngularJs(): boolean {
        const hostContainer = document.getElementById('eui-mfe-container');
        const appRoot = document.querySelector('app-root');
        const hosted = hostContainer !== null && hostContainer.contains(appRoot);

        console.log('🔍 isHostedByAngularJs check:', {
            hostContainer: hostContainer,
            appRoot: appRoot,
            hosted: hosted
        });

        return hosted;
    }

    private setupNavigationHandler(): void {
        // Intercept ALL clicks on navigation links (sidebar AND routerLinks)
        // This ensures consistent navigation handling for both sidebar and content links
        setTimeout(() => {
            document.addEventListener('click', (event) => {
                const target = event.target as HTMLElement;
                
                // Check if click is on ANY link
                const link = target.closest('a') as HTMLAnchorElement;
                if (!link) return;
                
                // Check both href attribute AND routerLink attribute
                const href = link.getAttribute('href');
                const routerLink = link.getAttribute('ng-reflect-router-link') || link.hasAttribute('routerlink');
                
                // Skip if not a navigation link
                if (!href && !routerLink) return;
                
                // Check if it's an internal screen/ navigation
                const isInternalNav = (href && (href.includes('/screen/') || href.includes('screen/'))) ||
                                     (routerLink && (href?.includes('/screen/') || href?.includes('screen/')));
                
                if (!isInternalNav) return;
                
                // Check if it's within the Angular MFE (sidebar OR content)
                const isInSidebar = link.closest('eui-app-sidebar');
                const isInContent = link.closest('eui-page-content') || link.closest('eui-page');
                
                if (!isInSidebar && !isInContent) return;
                
                console.log('🎯 Navigation link clicked:', { href, isInSidebar: !!isInSidebar, isInContent: !!isInContent });
                
                // Prevent default navigation
                event.preventDefault();
                event.stopPropagation();
                
                // Extract the route from href (handle all formats)
                let route = href || '';
                
                if (route.includes('#!/eui/')) {
                    route = route.split('#!/eui/')[1]; // screen/home (no leading slash)
                } else if (route.includes('/screen/')) {
                    // Extract and remove leading slash
                    const match = route.match(/\/screen\/[^#?\s]*/);
                    route = match ? match[0].substring(1) : route; // Remove leading '/'
                } else if (route.includes('screen/')) {
                    // Already in correct format
                    const match = route.match(/screen\/[^#?\s]*/);
                    route = match ? match[0] : route;
                }
                
                // Ensure no leading slash (routes are 'screen/home' not '/screen/home')
                if (route.startsWith('/')) {
                    route = route.substring(1);
                }
                
                // Validate route
                if (!route || !route.startsWith('screen/')) {
                    console.warn('⚠️ Invalid route extracted:', route);
                    return;
                }
                
                console.log('🎯 Navigating to:', route);
                
                // Notify NavigationBridge to prevent circular navigation
                this.navigationBridge.notifyInternalNavigation();
                
                // Use Angular Router to navigate
                this.router.navigateByUrl(route).then(success => {
                    if (success) {
                        console.log('✅ Navigation successful to:', route);
                    } else {
                        console.error('❌ Navigation failed to:', route);
                    }
                }).catch(err => {
                    console.error('❌ Navigation error:', err);
                });
            }, true); // Use capture phase to intercept before other handlers
        }, 100); // Small delay to ensure DOM is ready
    }
}
