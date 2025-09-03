import 'zone.js';
import '@angular/compiler';

// Import EUI CSS styles
import '@eui/styles/dist/eui.css';
import '@eui/styles/dist/eui-utilities.css';
import '@eui/styles/dist/eui-theme-eui-legacy.css';
// import '@eui/styles/dist/assets/icons/sprites/outline.json';
// import '@eui/styles/dist/assets/icons/eui-internals/external.svg'

// Redirect i18n and API requests to microfrontend server (keep for translations)
function patchAssetRequests() {
  const microfrontendBase = 'http://localhost:4300';
  
  // Patch fetch API for i18n and API requests
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    let url = typeof input === 'string' ? input : input.toString();
    
    // Only redirect i18n assets (translations) - icons handled by sprite inlining
    if (url.startsWith('/assets/i18n') && !url.startsWith('http')) {
      url = `${microfrontendBase}${url}`;
      console.log(`🌐 i18n redirect: ${url}`);
    }
    
    return originalFetch.call(this, url, init);
  };
  
  // Patch XMLHttpRequest for i18n requests
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    let requestUrl = url.toString();
    
    // Only redirect i18n assets (translations) - icons handled by sprite inlining
    if (requestUrl.startsWith('/assets/i18n') && !requestUrl.startsWith('http')) {
      requestUrl = `${microfrontendBase}${requestUrl}`;
      console.log(`🌐 i18n XHR redirect: ${requestUrl}`);
    }
    
    return originalOpen.call(this, method, requestUrl, ...args);
  };
}

// Apply i18n patching before Angular starts
patchAssetRequests();

// Patch DOM manipulation to inline SVG sprites for cross-origin compatibility
function patchDOMHrefs() {
  const microfrontendBase = 'http://localhost:4300';
  const loadedSprites = new Set<string>();
  
  // Function to load and inline SVG sprite
  async function loadAndInlineSprite(spriteUrl: string): Promise<void> {
    if (loadedSprites.has(spriteUrl)) return;
    
    try {
      const response = await fetch(spriteUrl);
      const svgText = await response.text();
      
      // Create a hidden SVG element to hold the sprite
      const spriteContainer = document.createElement('div');
      spriteContainer.style.display = 'none';
      spriteContainer.innerHTML = svgText;
      document.body.appendChild(spriteContainer);
      
      loadedSprites.add(spriteUrl);
      console.log(`🎨 Inlined SVG sprite: ${spriteUrl}`);
    } catch (error) {
      console.error(`🎨 Failed to load sprite: ${spriteUrl}`, error);
    }
  }
  
  // Function to patch href attributes and load sprites
  function patchHrefAttribute(element: Element, href: string): void {
    if (href && href.startsWith('assets/icons/sprites/') && !href.startsWith('http')) {
      // Extract sprite filename (e.g., "outline.svg") from the href
      const spriteFile = href.split('/').pop()?.split('#')[0];
      if (!spriteFile) return;
      
      // Build the sprite URL - simple assets path, no eui-assets complexity
      const spriteUrl = `${microfrontendBase}/assets/icons/sprites/${spriteFile}`;
      
      // Load the sprite if not already loaded
      loadAndInlineSprite(spriteUrl);
      
      // Update the href to use the fragment reference
      const fragmentId = href.split('#')[1];
      element.setAttribute('href', `#${fragmentId}`);
      console.log(`🎨 Sprite inlined: ${spriteFile}, href: #${fragmentId}`);
    }
  }
  
  // Create a MutationObserver to watch for new DOM elements with href attributes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if this element has an href attribute that needs patching
            if (element.hasAttribute('href')) {
              const href = element.getAttribute('href');
              if (href) patchHrefAttribute(element, href);
            }
            
            // Also check child elements recursively
            const hrefElements = element.querySelectorAll('[href]');
            hrefElements.forEach((hrefElement) => {
              const href = hrefElement.getAttribute('href');
              if (href) patchHrefAttribute(hrefElement, href);
            });
          }
        });
      }
    });
  });
  
  // Start observing the entire document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('🎨 DOM href patching with sprite inlining enabled');
}

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
    
    // Enable DOM href patching for EUI icons
    patchDOMHrefs();

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


