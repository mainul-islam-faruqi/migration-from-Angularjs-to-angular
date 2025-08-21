import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '../components/loading/loading.component';

interface Phone {
  age: number;
  id: string;
  imageUrl: string;
  name: string;
  snippet: string;
  carrier?: string;
}

@Component({
  selector: 'app-phone-list-test',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  template: `
    <div class="container-fluid" style="padding: 20px;">
      <h2 style="color: #dd1b16; margin-bottom: 20px;">Angular Phone List Component (Working Test)</h2>
      
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
          <app-loading *ngIf="loading"></app-loading>

          <!-- Error state -->
          <div *ngIf="error" class="alert alert-danger">
            <h4>Error loading phones!</h4>
            <p>{{error}}</p>
            <button (click)="loadPhones()" class="btn btn-primary">Retry</button>
          </div>

          <!-- Phone list -->
          <div *ngIf="!loading && !error">
            <div style="margin-bottom: 15px; color: #666;">
              <small>Showing {{filteredAndSortedPhones.length}} of {{phones.length}} phones</small>
            </div>

            <ul class="phones" style="list-style: none; padding: 0;">
              <li 
                *ngFor="let phone of filteredAndSortedPhones" 
                class="thumbnail phone-list-item"
                style="display: flex; margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;"
              >
                <div style="margin-right: 15px;">
                  <div 
                    style="width: 100px; height: 100px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;"
                  >
                    📱
                  </div>
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
export class PhoneListTestComponent implements OnInit {
  // NO service injection - just direct data
  phones: Phone[] = [];
  query: string = '';
  orderProp: string = 'age';
  loading: boolean = true;
  error: string | null = null;

  constructor() {
    // Empty constructor - no DI at all
    console.log('PhoneListTestComponent constructor - no DI issues');
  }

  ngOnInit() {
    console.log('PhoneListTestComponent ngOnInit');
    this.loadPhones();
  }

  private loadPhones() {
    console.log('Loading phones...');
    this.loading = true;
    this.error = null;

    // Simulate data loading
    setTimeout(() => {
      this.phones = [
        {
          age: 0,
          id: "motorola-xoom-with-wi-fi",
          imageUrl: "img/phones/motorola-xoom-with-wi-fi.0.jpg",
          name: "Motorola XOOM™ with Wi-Fi",
          snippet: "The Next, Next Generation. Experience the future with Motorola XOOM with Wi-Fi.",
          carrier: "Verizon"
        },
        {
          age: 1,
          id: "samsung-galaxy-tab",
          imageUrl: "img/phones/samsung-galaxy-tab.0.jpg",
          name: "Samsung Galaxy Tab™",
          snippet: "Feel Free to Tab™. The Samsung Galaxy Tab™ brings you an ultra-mobile entertainment experience.",
          carrier: "Sprint"
        },
        {
          age: 2,
          id: "motorola-atrix-4g",
          imageUrl: "img/phones/motorola-atrix-4g.0.jpg",
          name: "MOTOROLA ATRIX™ 4G",
          snippet: "MOTOROLA ATRIX 4G the world's most powerful smartphone.",
          carrier: "AT&T"
        },
        {
          age: 3,
          id: "dell-streak-7",
          imageUrl: "img/phones/dell-streak-7.0.jpg",
          name: "Dell Streak 7",
          snippet: "Introducing Dell™ Streak 7. Share photos, videos and movies together. It's small enough to carry around, big enough to gather around.",
          carrier: "T-Mobile"
        },
        {
          age: 4,
          id: "samsung-gem",
          imageUrl: "img/phones/samsung-gem.0.jpg",
          name: "Samsung Gem™",
          snippet: "The Samsung Gem™ brings you everything that you would expect and more from a touch display smart phone – more apps, more features and a more affordable price.",
          carrier: "Verizon"
        }
      ];

      this.loading = false;
      console.log('Phones loaded successfully:', this.phones.length);
    }, 1000);
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
    console.log('Clicked phone:', phoneId);
    alert(`Phone clicked: ${phoneId}\n\nThis demonstrates that navigation/routing can be implemented here.`);
  }
}
