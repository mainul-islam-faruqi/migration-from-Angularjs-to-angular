import { Component, OnInit, NgZone, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhoneListComponent } from './phone-list/phone-list.component';
import { PhoneListTestComponent } from './phone-list/phone-list-test.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PhoneListComponent, PhoneListTestComponent],
  template: `
    <div style="padding: 20px; border: 2px solid #dd1b16; margin: 20px;">
      <div *ngIf="currentView === 'home'">
        <h2 style="color: #dd1b16;">Angular Component Running in AngularJS</h2>
        <p>This is a modern Angular component integrated via single-spa micro-frontend.</p>
        <button (click)="onClick()" style="padding: 10px 20px; background: #dd1b16; color: white; border: none; border-radius: 4px; margin-right: 10px;">
          Test Angular Button
        </button>
        <button (click)="showPhoneList()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">
          Show Phone List
        </button>
      </div>

      <div *ngIf="currentView === 'phone-list'">
        <div style="margin-bottom: 15px;">
          <button (click)="goHome()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px;">
            ← Back to Home
          </button>
        </div>
        <app-phone-list></app-phone-list>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  currentView: 'home' | 'phone-list' = 'home';
  private ngZone = inject(NgZone);
  private onRouteChange = () => {
    // Ensure change detection runs when route changes originate outside Angular
    this.ngZone.run(() => this.checkRoute());
  };

  ngOnInit() {
    // Listen for route changes from the URL hash
    this.checkRoute();
    window.addEventListener('hashchange', this.onRouteChange);
    // single-spa dispatches this event on every navigation it handles
    window.addEventListener('single-spa:routing-event', this.onRouteChange);
  }

  ngOnDestroy(): void {
    window.removeEventListener('hashchange', this.onRouteChange);
    window.removeEventListener('single-spa:routing-event', this.onRouteChange);
  }

  checkRoute() {
    const hash = window.location.hash;
    if (hash.includes('angular-phone-list')) {
      this.currentView = 'phone-list';
    } else {
      this.currentView = 'home';
    }
  }

  onClick() {
    alert('Angular component is working inside AngularJS!');
    console.log('Angular MFE button clicked');
  }

  showPhoneList() {
    this.currentView = 'phone-list';
    // Update URL to reflect the change
    window.location.hash = '#!/angular-phone-list';
  }

  goHome() {
    this.currentView = 'home';
    window.location.hash = '#!/angular-page';
  }
}