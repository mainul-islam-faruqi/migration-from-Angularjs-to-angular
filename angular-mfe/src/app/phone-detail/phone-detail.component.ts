import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhoneService } from '../services/phone.service';

@Component({
  selector: 'app-phone-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid" style="padding: 20px;" *ngIf="!loading && !error">
      <h2 style="color:#dd1b16; margin-bottom: 6px;">{{ phone?.name }}</h2>
      <p style="color:#666; margin-top:0;">{{ phone?.description }}</p>

      <div class="row" *ngIf="phone">
        <div class="col-md-4" style="margin-bottom: 16px;">
          <img *ngIf="mainImageUrl" [src]="mainImageUrl" [alt]="phone?.name"
               style="width:100%; max-width:360px; border-radius: 4px; border:1px solid #eee;" />
          <ul class="phone-thumbs" style="list-style:none; padding:0; margin-top: 12px; display:flex; flex-wrap:wrap; gap:8px;">
            <li *ngFor="let img of phone.images" (click)="setImage(img)" style="cursor:pointer;">
              <img [src]="img" [alt]="phone?.name"
                   [style.border]="img === mainImageUrl ? '2px solid #dd1b16' : '1px solid #ddd'"
                   style="width:64px; height:64px; object-fit:cover; border-radius:4px;" />
            </li>
          </ul>
        </div>

        <div class="col-md-8">
          <h4>Specifications</h4>
          <div style="display:grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 16px;">
            <div>
              <strong>Availability</strong>
              <div *ngFor="let a of phone.availability">{{ a }}</div>
            </div>
            <div>
              <strong>Battery</strong>
              <div>Type: {{ phone.battery?.type }}</div>
              <div>Talk Time: {{ phone.battery?.talkTime }}</div>
              <div>Standby: {{ phone.battery?.standbyTime }}</div>
            </div>
            <div>
              <strong>Storage</strong>
              <div>RAM: {{ phone.storage?.ram }}</div>
              <div>Flash: {{ phone.storage?.flash }}</div>
            </div>
            <div>
              <strong>Connectivity</strong>
              <div>Cell: {{ phone.connectivity?.cell }}</div>
              <div>WiFi: {{ phone.connectivity?.wifi }}</div>
              <div>Bluetooth: {{ phone.connectivity?.bluetooth }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="loading" style="text-align:center; padding: 40px;">
      <span>Loading phone details…</span>
    </div>
    <div *ngIf="error" style="text-align:center; padding: 40px; color:#dc3545;">
      {{ error }}
    </div>
  `
})
export class PhoneDetailComponent implements OnInit {
  @Input() phoneId?: string;

  phone: any | null = null;
  mainImageUrl: string | null = null;
  loading = true;
  error: string | null = null;

  private phoneService = inject(PhoneService);

  ngOnInit(): void {
    const id = this.phoneId ?? this.parsePhoneIdFromHash();
    if (!id) {
      this.loading = false;
      this.error = 'No phone id provided.';
      return;
    }
    this.fetchPhone(id);
  }

  setImage(imageUrl: string): void {
    this.mainImageUrl = imageUrl;
  }

  private fetchPhone(id: string): void {
    this.loading = true;
    this.error = null;
    this.phoneService.getPhoneDetail(id).subscribe({
      next: (data: any) => {
        this.phone = data;
        this.mainImageUrl = Array.isArray(data?.images) && data.images.length > 0 ? data.images[0] : null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load phone detail', err);
        this.error = 'Failed to load phone details.';
        this.loading = false;
      }
    });
  }

  private parsePhoneIdFromHash(): string | null {
    // Support patterns like '#!/angular-phone-detail/<id>' or '#!/phones/<id>'
    const hash = window.location.hash || '';
    const parts = hash.replace(/^#!/, '').split('/').filter(Boolean);
    if (parts.length >= 2) {
      // last segment is id for both patterns
      return parts[parts.length - 1];
    }
    return null;
  }
}


