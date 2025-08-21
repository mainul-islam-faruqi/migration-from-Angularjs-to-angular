import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
export class PhoneService {
  private readonly baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getPhones(): Observable<Phone[]> {
    return this.http.get<Phone[]>(`${this.baseUrl}/phones/phones.json`);
  }

  getPhoneDetail(phoneId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/phones/${phoneId}.json`);
  }
}
