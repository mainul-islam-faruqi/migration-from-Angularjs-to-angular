import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Phone {
  age: number;
  id: string;
  imageUrl: string;
  name: string;
  snippet: string;
  carrier?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhoneSimpleService {
  constructor() {
    // No dependencies - simple service
  }

  getPhones(): Observable<Phone[]> {
    // Return mock data synchronously to avoid HTTP issues
    const mockPhones: Phone[] = [
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

    // Simulate async behavior
    return of(mockPhones);
  }

  getPhoneDetail(phoneId: string): Observable<any> {
    return of({
      id: phoneId,
      name: "Sample Phone Detail",
      description: "This is a mock phone detail response"
    });
  }
}
