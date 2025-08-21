import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhoneSimpleService, Phone } from '../services/phone-simple.service';
import { LoadingComponent } from '../components/loading/loading.component';

@Component({
  selector: 'app-phone-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  styles: [`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `],
  template: `
    <div class="container-fluid" style="padding: 20px;">
      <h2 style="color: #dd1b16; margin-bottom: 20px;">Angular Phone List Component</h2>
      
      <div class="row">
        <div class="col-md-2">
          <!-- Sidebar content -->
          <div style="margin-bottom: 15px;">
            <label for="search"><strong>Search:</strong></label>
            <input 
              id="search"
              [(ngModel)]="query" 
              class="form-control" 
              placeholder="Search phones..."
              style="margin-top: 5px;"
            />
          </div>

          <div>
            <label for="sort"><strong>Sort by:</strong></label>
            <select 
              id="sort"
              [(ngModel)]="orderProp" 
              class="form-control"
              style="margin-top: 5px;"
            >
              <option value="name">Alphabetical</option>
              <option value="age">Newest</option>
            </select>
          </div>
        </div>

        <div class="col-md-10">
          <!-- Loading state -->
          <app-loading *ngIf="loading" message="Loading phones from AngularJS data..."></app-loading>

          <!-- Error state -->
          <div *ngIf="error" style="text-align: center; padding: 40px;">
            <p style="color: #dc3545; font-size: 18px;">{{error}}</p>
            <button 
              (click)="loadPhones()" 
              style="padding: 10px 20px; background: #dd1b16; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              Retry
            </button>
          </div>

          <!-- Phone list -->
          <div *ngIf="!loading && !error">
            <div style="margin-bottom: 15px; color: #666;">
              <small>Showing {{filteredAndSortedPhones.length}} of {{phones.length}} phones (loaded from AngularJS data)</small>
            </div>

            <ul class="phones" style="list-style: none; padding: 0;">
              <li 
                *ngFor="let phone of filteredAndSortedPhones" 
                class="thumbnail phone-list-item"
                style="display: flex; margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;"
              >
                <div style="margin-right: 15px;">
                  <img 
                    [src]="'http://localhost:8000/' + phone.imageUrl" 
                    [alt]="phone.name"
                    style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"
                  />
                </div>
                <div>
                  <h4 style="margin: 0 0 10px 0; color: #333;">
                    <a 
                      (click)="viewPhone(phone.id)" 
                      style="text-decoration: none; color: #dd1b16; cursor: pointer;"
                    >
                      {{phone.name}}
                    </a>
                  </h4>
                  <p style="margin: 0; color: #666; line-height: 1.4;">{{phone.snippet}}</p>
                  <div *ngIf="phone.carrier" style="margin-top: 5px;">
                    <small style="color: #999;"><strong>Carrier:</strong> {{phone.carrier}}</small>
                  </div>
                </div>
              </li>
            </ul>

            <div *ngIf="filteredAndSortedPhones.length === 0 && phones.length > 0" style="text-align: center; padding: 40px;">
              <p style="color: #999; font-size: 18px;">No phones found matching your search.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PhoneListComponent implements OnInit {
  // Using standard Angular reactive properties
  phones: Phone[] = [];
  query: string = '';
  orderProp: string = 'age';
  loading: boolean = true;
  error: string | null = null;

  // Use inject function for dependency injection in standalone components
  private phoneService = inject(PhoneSimpleService);

  constructor() {}

  ngOnInit() {
    this.loadPhones();
  }

  loadPhones() {
    this.loading = true;
    this.error = null;
    
    // Load phone data using the PhoneService
    this.phoneService.getPhones().subscribe({
      next: (phones) => {
        this.phones = phones;
        this.loading = false;
        console.log('Loaded phones from AngularJS data via service:', phones.length, 'phones');
      },
      error: (error) => {
        console.error('Error loading phones:', error);
        this.error = 'Failed to load phone data. Please try again.';
        this.loading = false;
      }
    });
  }

  get filteredAndSortedPhones(): Phone[] {
    let filtered = this.phones;

    // Apply search filter
    if (this.query) {
      const queryLower = this.query.toLowerCase();
      filtered = filtered.filter(phone => 
        phone.name.toLowerCase().includes(queryLower) ||
        phone.snippet.toLowerCase().includes(queryLower) ||
        (phone.carrier && phone.carrier.toLowerCase().includes(queryLower))
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (this.orderProp === 'name') {
        return a.name.localeCompare(b.name);
      } else if (this.orderProp === 'age') {
        return a.age - b.age; // Newest first (lower age)
      }
      return 0;
    });
  }

  viewPhone(phoneId: string) {
    // Send message to AngularJS to navigate to phone detail
    const event = new CustomEvent('angular-to-angularjs', {
      detail: {
        action: 'navigate',
        route: `#!/phones/${phoneId}`,
        message: `Navigating to ${phoneId} from Angular component`
      }
    });
    window.dispatchEvent(event);
  }
}
