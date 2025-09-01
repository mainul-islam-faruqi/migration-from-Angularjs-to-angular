import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

// Microfrontend-compatible service that doesn't depend on EUI core services
@Injectable({
    providedIn: 'root',
})
export class AppStarterMicrofrontendService {
    private http: HttpClient = inject(HttpClient);

    start(): Observable<{ success: boolean }> {
        console.log('🚀 EUI MFE: Starting with microfrontend-compatible initialization');
        
        // Simplified initialization without EUI core dependencies
        return this.initBasicServices();
    }

    /**
     * Basic initialization without complex EUI services
     */
    private initBasicServices(): Observable<{ success: boolean }> {
        console.log('✅ EUI MFE: Basic services initialized');
        
        // Return success immediately - no complex EUI dependency chain
        return of({ success: true });
    }

    /**
     * Optional: Fetch user details if needed (simplified version)
     */
    private fetchUserDetails(): Observable<any> {
        const user = {
            userId: 'anonymous',
            firstName: 'FirstName',
            lastName: 'LastName',
            fullName: 'FullName',
        };

        // Return mock user for microfrontend
        return of(user);
    }
}
