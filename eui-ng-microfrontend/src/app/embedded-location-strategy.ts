import { Injectable, Inject } from '@angular/core';
import { LocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { PREVENT_URL_CHANGE } from './routing.tokens';

@Injectable()
export class EmbeddedLocationStrategy extends PathLocationStrategy {
  private isEmbedded = false;

  constructor(
    @Inject(PlatformLocation) platformLocation: PlatformLocation,
    @Inject(PREVENT_URL_CHANGE) private preventUrlChange: boolean,
  ) {
    super(platformLocation);
    this.checkIfEmbedded();
  }

  private checkIfEmbedded(): void {
    // Check if we're running inside an embedded container
    const embeddedContainer = document.getElementById('eui-embedded-container');
    const appRoot = document.querySelector('app-root');
    this.isEmbedded = embeddedContainer !== null && embeddedContainer.contains(appRoot);
    
    console.log('🎯 EmbeddedLocationStrategy - isEmbedded:', this.isEmbedded);
  }

  override pushState(state: any, title: string, url: string, queryParams?: string): void {
    if (this.isEmbedded && this.preventUrlChange) {
      console.log('🚫 EmbeddedLocationStrategy - Blocking pushState:', url);
      // Don't change the browser URL when embedded
      return;
    }
    super.pushState(state, title, url, queryParams);
  }

  override replaceState(state: any, title: string, url: string, queryParams?: string): void {
    if (this.isEmbedded && this.preventUrlChange) {
      console.log('🚫 EmbeddedLocationStrategy - Blocking replaceState:', url);
      // Don't change the browser URL when embedded
      return;
    }
    super.replaceState(state, title, url, queryParams);
  }

  override forward(): void {
    if (this.isEmbedded) {
      console.log('🚫 EmbeddedLocationStrategy - Blocking forward');
      return;
    }
    super.forward();
  }

  override back(): void {
    if (this.isEmbedded) {
      console.log('🚫 EmbeddedLocationStrategy - Blocking back');
      return;
    }
    super.back();
  }
}
