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
    
    // Add window reference for debugging
    window = window;
    
    sidebarItems: EuiMenuItem[] = [
        { label: 'Home', url: 'screen/home' },
        { label: 'Module 1', url: 'screen/module1', children: [
            { label: 'page 1', url: 'screen/module1/page1' },
            { label: 'page 2', url: 'screen/module1/page2' },
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
        } else {
            console.log('🎯 Running in standalone mode - navigating to home');
            setTimeout(() => {
                this.navigateToHome();
            }, 100);
        }
    }

    navigateToHome() {
        console.log('Navigating to home...');
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
        
        console.log('🔍 isEmbedded check:', {
            embeddedContainer: embeddedContainer,
            appRoot: appRoot,
            isEmbedded: isEmbedded
        });
        
        return isEmbedded;
    }
}
