import { Component, Inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONFIG_TOKEN, EuiAppConfig } from '@eui/core';
import { EUI_PAGE } from '@eui/components/eui-page';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

// Interface for data received from AngularJS
export interface DataFromAngularJS {
    timestamp: string;
    source: string;
    data: any;
}

@Component({
    standalone: true,
    templateUrl: './home.component.html',
    imports: [
        CommonModule,
        TranslateModule,
        ...EUI_PAGE,
        RouterLink,
    ],
})
export class HomeComponent implements OnInit, OnDestroy {
    // Data received from AngularJS
    receivedData: DataFromAngularJS | null = null;
    
    private eventListener?: (event: Event) => void;

    constructor(
        @Inject(CONFIG_TOKEN) protected config: EuiAppConfig,
        private zone: NgZone
    ) {
        console.log('HomeComponent constructor - config:', config);
    }

    ngOnInit(): void {
        // Check for any data stored by AngularJS before this component mounted
        this.checkStoredData();
        
        // Also listen for real-time events (useful if component is already mounted when data is sent)
        this.setupEventListener();
    }

    private checkStoredData(): void {
        const storedData = (window as any)._angularJsToAngularData;
        if (storedData) {
            console.log('📦 [STORAGE METHOD] HomeComponent: Found stored data from AngularJS:', storedData);
            this.receivedData = {
                source: storedData.source + ' (from storage)',
                timestamp: new Date().toISOString(),
                data: storedData.data
            };
            console.log('✅ Data loaded via STORAGE (sent before component mounted)');
        } else {
            console.log('⚪ No stored data found - waiting for events...');
        }
    }

    private setupEventListener(): void {
        // Listen for custom events from AngularJS (single-spa recommended approach)
        this.eventListener = (event: Event) => {
            const customEvent = event as CustomEvent;
            const detail = customEvent.detail;
            
            if (detail && detail.source && detail.data) {
                console.log('🔔 [EVENT LISTENER] HomeComponent: Received real-time event from AngularJS:', detail);
                
                // Store for future component mounts
                (window as any)._angularJsToAngularData = detail;
                
                // Run inside Angular zone to trigger change detection
                this.zone.run(() => {
                    this.receivedData = {
                        source: detail.source + ' (real-time event)',
                        timestamp: new Date().toISOString(),
                        data: detail.data
                    };
                    console.log('✅ Data updated via EVENT LISTENER (sent while component was mounted)');
                });
            }
        };
        
        window.addEventListener('angularjs-to-angular-data', this.eventListener);
        console.log('🎧 Event listener attached - ready for real-time updates');
    }

    ngOnDestroy(): void {
        // Clean up event listener
        if (this.eventListener) {
            window.removeEventListener('angularjs-to-angular-data', this.eventListener);
        }
    }

    clearData(): void {
        this.receivedData = null;
        // Also clear stored data
        delete (window as any)._angularJsToAngularData;
        console.log('🧹 HomeComponent: Data cleared');
    }
}
