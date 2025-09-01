import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AppStarterSimpleService {
    
    start() {
        console.log('EUI MFE: Simple app starter initialized');
        // Basic initialization for microfrontend - no complex EUI dependencies
        return Promise.resolve();
    }
}
