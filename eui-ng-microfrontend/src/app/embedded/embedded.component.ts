import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-embedded',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="embedded-eui-component">
      <h4>🎯 Angular MFE Component Embedded in AngularJS</h4>
      <div class="alert alert-info">
        <strong>This is an Angular component running inside an AngularJS page!</strong>
        <ul>
          <li>✅ Full Angular DI system</li>
          <li>✅ eUI components available</li>
          <li>✅ Modern Angular features</li>
          <li>✅ Embedded in AngularJS phone-list</li>
        </ul>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <h5>AngularJS Data Integration</h5>
          <p>This component can receive data from the AngularJS parent page.</p>
        </div>
        <div class="col-md-6">
          <h5>eUI Components</h5>
          <p>Full access to eUI design system components.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .embedded-eui-component {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 10px 0;
    }
    .alert {
      padding: 12px;
      margin-bottom: 20px;
      border: 1px solid transparent;
      border-radius: 4px;
    }
    .alert-info {
      color: #31708f;
      background-color: #d9edf7;
      border-color: #bce8f1;
    }
  `]
})
export class EmbeddedComponent {
  constructor() {
    console.log('🎯 Embedded Angular component initialized in AngularJS page!');
  }
}
