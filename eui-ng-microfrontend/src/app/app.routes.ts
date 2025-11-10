import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { EmbeddedComponent } from './embedded/embedded.component';

export const routes: Routes = [
    // Internal routes only - these should NEVER conflict with AngularJS host routes
    { path: '', redirectTo: 'screen/home', pathMatch: 'full' },
    { path: 'screen/home', component: HomeComponent },
    { path: 'screen/embedded', component: EmbeddedComponent },
    { path: 'screen/module1', loadChildren: () => import('./features/module1/module1.routes').then(m => m.MODULE1_ROUTES) },
    { path: 'screen/module2', loadChildren: () => import('./features/module2/module2.routes').then(m => m.MODULE2_ROUTES) },
    // Catch all route - redirect to home
    { path: '**', redirectTo: 'screen/home' },
];
