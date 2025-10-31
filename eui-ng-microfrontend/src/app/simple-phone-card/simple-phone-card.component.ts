import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simple-phone-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="angular-phone-card" style="border: 2px solid #ff3300; padding: 15px; margin: 10px 0; border-radius: 8px; background: #f8f9fa;">
      <h4 style="color: #007bff;">🎯 Angular Component in AngularJS Page from simple phone card component</h4>
      <div class="phone-info">
        <h5>{{ phone?.name || 'Sample Phone' }}</h5>
        <p>{{ phone?.snippet || 'This is an Angular component running inside an AngularJS page!' }}</p>
        <div class="phone-actions">
          <button class="btn btn-primary btn-sm" (click)="onSelect()">Select Phone</button>
          <button class="btn btn-secondary btn-sm" (click)="onDetails()">View Details</button>
        </div>
      </div>
      <div class="angular-features" style="margin-top: 10px; font-size: 12px; color: #666;">
        ✅ Angular DI: {{ diService.getData() }}<br>
        ✅ Angular Services: {{ currentTime }}<br>
        ✅ Angular Events: Clicked {{ clickCount }} times
      </div>
    </div>
  `,
  styles: [`
    .phone-actions {
      margin-top: 10px;
    }
    .phone-actions button {
      margin-right: 5px;
    }
  `]
})
export class SimplePhoneCardComponent {
  @Input() phone: any;
  
  currentTime = new Date().toLocaleTimeString();
  clickCount = 0;

  constructor() {
    console.log('🎯 SimplePhoneCardComponent created in AngularJS page!');
  }

  onSelect() {
    this.clickCount++;
    console.log('🎯 Angular component clicked!', this.phone);
    alert(`Selected: ${this.phone?.name || 'Sample Phone'}`);
  }

  onDetails() {
    this.clickCount++;
    console.log('🎯 View details clicked!', this.phone);
  }

  // Simulate Angular service
  diService = {
    getData: () => 'Angular DI Working!'
  };
}



