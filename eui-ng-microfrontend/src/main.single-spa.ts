import 'zone.js';
import '@angular/compiler';

// Import EUI CSS styles
import '@eui/styles/dist/eui.css';
import '@eui/styles/dist/eui-utilities.css';
import '@eui/styles/dist/eui-theme-eui-legacy.css';

// Patch browser APIs to redirect asset requests to microfrontend server
function patchAssetRequests() {
  const microfrontendBase = 'http://localhost:4300';
  
  // Detect Windows and adjust asset paths if needed
  const isWindows = navigator.platform.indexOf('Win') !== -1;
  console.log(`🖥️ Platform detected: ${isWindows ? 'Windows' : 'Unix/Linux/macOS'}`);
  console.log(`🌐 Microfrontend base: ${microfrontendBase}`);
  
  // Patch fetch API
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    let url = typeof input === 'string' ? input : input.toString();
    
    // Redirect relative asset requests to microfrontend server
    if (url.startsWith('/assets/') && !url.startsWith('http')) {
      url = `${microfrontendBase}${url}`;
      console.log(`🔄 Fetch redirect: ${url}`);
    }
    
    return originalFetch.call(this, url, init);
  };
  
  // Patch XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    let requestUrl = url.toString();
    
    // Redirect relative asset requests to microfrontend server
    if (requestUrl.startsWith('/assets/') && !requestUrl.startsWith('http')) {
      requestUrl = `${microfrontendBase}${requestUrl}`;
      console.log(`🔄 XHR redirect: ${requestUrl}`);
    }
    
    return originalOpen.call(this, method, requestUrl, ...args);
  };
}

// Apply patches before Angular starts
patchAssetRequests();

import { bootstrapApplication } from '@angular/platform-browser';
import { HashLocationStrategy, LocationStrategy, Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Webpack public path declaration for runtime configuration
declare var __webpack_public_path__: string;

// Base href management for microfrontend asset loading

// Custom location strategy that doesn't interfere with host routing
@Injectable()
class MicrofrontendLocationStrategy extends HashLocationStrategy {
  override replaceState(state: any, title: string, url: string, queryParams?: string): void {
    // Don't update browser history when in microfrontend mode
    console.log('MF: Blocking replaceState for:', url);
  }
  
  override pushState(state: any, title: string, url: string, queryParams?: string): void {
    // Don't update browser history when in microfrontend mode
    console.log('MF: Blocking pushState for:', url);
  }
}

let appRef: any;

export async function bootstrap() {
  // Called once when the MFE is first loaded
  console.log('EUI MFE: bootstrap');
}

export async function mount(props: any) {
  console.log('EUI MFE: mount', props);
  
  try {
    const domElement = props?.domElementGetter ? props.domElementGetter() : document.getElementById('eui-mfe-container');
    if (!domElement) {
      console.error('EUI MFE: container element not found');
      throw new Error('EUI MFE: container element not found');
    }
    
    console.log('EUI MFE: Found DOM element, proceeding with mount...');

  // Configure webpack public path at runtime for proper asset loading
  // This ensures assets are loaded from the Angular app server, not the host
  const getAssetBaseUrl = () => {
    // In production, this would come from environment config
    const isDev = window.location.hostname === 'localhost';
    if (isDev) {
      return 'http://localhost:4300/';
    }
    // Production: could be CDN or same origin with different path
    return '/microfrontends/eui-app/';
  };

  if (typeof __webpack_public_path__ !== 'undefined') {
    __webpack_public_path__ = getAssetBaseUrl();
    console.log('EUI MFE: Set webpack publicPath to:', __webpack_public_path__);
  }

  // Set base href for the Angular app to ensure assets load from correct server
  const setMicrofrontendBaseHref = () => {
    const baseUrl = getAssetBaseUrl();
    let baseElement = document.querySelector('base');
    const wasExisting = !!baseElement;
    
    if (!baseElement) {
      baseElement = document.createElement('base');
      document.head.appendChild(baseElement);
      console.log('EUI MFE: Created new base element');
    }
    
    // Store original href to restore later if needed
    if (!wasExisting || !baseElement.getAttribute('data-original-href')) {
      baseElement.setAttribute('data-original-href', baseElement.href || window.location.origin + '/');
    }
    
    baseElement.href = baseUrl;
    console.log(`EUI MFE: Set base href to: ${baseUrl}`);
    console.log(`EUI MFE: Original base was: ${baseElement.getAttribute('data-original-href')}`);
  };

  setMicrofrontendBaseHref();

  domElement.innerHTML = '<app-root></app-root>';

  // Inject EUI CSS from 4300 so design loads
  const cssHrefs = [
    'http://localhost:4300/assets/eui-styles/eui.css',
    'http://localhost:4300/assets/eui-styles/eui-ecl-ec.css',
    'http://localhost:4300/assets/eui-styles/eui-utilities.css',
    'http://localhost:4300/assets/eui-styles/eui-icons-flags.css'
  ];
  cssHrefs.forEach(href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  // Use custom location strategy that doesn't interfere with the host router
  const mfConfig = {
    ...appConfig,
    providers: [
      ...appConfig.providers,
      {
        provide: LocationStrategy,
        useClass: MicrofrontendLocationStrategy
      }
    ],
    rootElement: domElement.querySelector('app-root') as Element,
  };

    console.log('EUI MFE: Starting Angular bootstrapApplication...');
    appRef = await bootstrapApplication(AppComponent, mfConfig);
    console.log('EUI MFE: Angular app mounted successfully!');
  } catch (error) {
    console.error('EUI MFE: Mount failed:', error);
    throw error;
  }
}

export async function unmount() {
  console.log('EUI MFE: unmount');
  
  // Restore original base href
  const baseElement = document.querySelector('base');
  if (baseElement) {
    const originalHref = baseElement.getAttribute('data-original-href');
    if (originalHref) {
      baseElement.href = originalHref;
      console.log(`EUI MFE: Restored base href to: ${originalHref}`);
    }
  }
  
  if (appRef) {
    appRef.destroy();
    appRef = null;
  }
}


