import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class MicrofrontendHttpInterceptor implements HttpInterceptor {
  
  private getCorrectBaseUrl(): string {
    // In development, redirect to Angular app server
    const isDev = window.location.hostname === 'localhost';
    if (isDev) {
      return 'http://localhost:4300';
    }
    // In production, this could be a CDN or API gateway
    return window.location.origin;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Debug: Log all requests to see what's coming through the interceptor
    console.log('🔍 MF Interceptor: Request:', req.url);
    
    // Only intercept requests that should be redirected to the Angular app server
    if (this.shouldRedirect(req.url)) {
      const baseUrl = this.getCorrectBaseUrl();
      const redirectedUrl = this.buildRedirectedUrl(req.url, baseUrl);
      
      console.log(`✅ MF Interceptor: Redirecting ${req.url} → ${redirectedUrl}`);
      
      const modifiedReq = req.clone({
        url: redirectedUrl
      });
      
      return next.handle(modifiedReq);
    }
    
    console.log('⚪ MF Interceptor: Passing through:', req.url);
    return next.handle(req);
  }

  private shouldRedirect(url: string): boolean {
    // Redirect relative URLs for assets and APIs that should come from Angular app
    const redirectPatterns = [
      '/assets/',                  // Static assets (i18n, icons, etc.)
      '/api/',                    // API calls that should go to Angular app
      '/user-details',            // Specific API endpoints
      'eui-internals/',           // EUI internal icons
      'icons/eui-internals/',     // EUI internal icons with path
      '/assets/icons/eui-internals/' // Full EUI icon path
    ];
    
    return redirectPatterns.some(pattern => url.includes(pattern)) && 
           !url.startsWith('http://') && 
           !url.startsWith('https://');
  }

  private buildRedirectedUrl(originalUrl: string, baseUrl: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanUrl = originalUrl.startsWith('/') ? originalUrl.substring(1) : originalUrl;
    return `${baseUrl}/${cleanUrl}`;
  }
}
