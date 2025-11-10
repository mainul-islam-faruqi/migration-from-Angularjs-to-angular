import { InjectionToken } from '@angular/core';

/**
 * Controls whether the micro-frontend should suppress browser URL updates.
 * Defaults to true for embedded mode to prevent conflicts with the host router.
 */
export const PREVENT_URL_CHANGE = new InjectionToken<boolean>('PREVENT_URL_CHANGE', {
    factory: () => true,
});

/**
 * Initial route provided by the host application when the micro-frontend boots.
 * String should include the Angular internal path (e.g. '#!/eui/screen/module1' or '/screen/module1').
 */
export const HOST_INITIAL_ROUTE = new InjectionToken<string | null>('HOST_INITIAL_ROUTE', {
    factory: () => null,
});

