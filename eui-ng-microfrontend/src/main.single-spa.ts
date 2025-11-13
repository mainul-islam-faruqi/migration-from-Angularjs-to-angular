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
import { APP_BASE_HREF, PathLocationStrategy, LocationStrategy, PlatformLocation } from '@angular/common';
import { Inject, Optional } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { HOST_INITIAL_ROUTE, PREVENT_URL_CHANGE } from './app/routing.tokens';
// import { DataBridgeService } from './app/data-bridge.service';

// Webpack public path declaration for runtime configuration
declare var __webpack_public_path__: string;

// Base href management for microfrontend asset loading

// Custom LocationStrategy for single-spa microfrontend in hash-routing host
// Based on single-spa best practices: https://single-spa.js.org/docs/ecosystem-angular/#routing
class MicrofrontendLocationStrategy extends PathLocationStrategy {
  constructor(
    platformLocation: PlatformLocation,
    baseHref: string | null | undefined,
    private readonly preventUrlChange: boolean,
  ) {
    super(platformLocation, baseHref ?? undefined);
  }

  override replaceState(state: any, title: string, url: string, queryParams?: string): void {
    console.log('MF Strategy replaceState():', { url, preventUrlChange: this.preventUrlChange });
    if (this.preventUrlChange) {
      // Embedded mode: block all URL changes
      return;
    }
    // Full MFE mode: sync with parent's hash routing
    this.syncWithParentHash(url, true);
  }
  
  override pushState(state: any, title: string, url: string, queryParams?: string): void {
    console.log('MF Strategy pushState():', { url, preventUrlChange: this.preventUrlChange });
    if (this.preventUrlChange) {
      // Embedded mode: block all URL changes
      return;
    }
    // Full MFE mode: sync with parent's hash routing
    this.syncWithParentHash(url, false);
  }
  
  private syncWithParentHash(url: string, replace: boolean): void {
    // Clean the URL and build the full hash path
    const cleanUrl = url.split('#')[0].split('?')[0];
    const fullHashPath = this.buildHashPath(cleanUrl);
    
    console.log('MF: Syncing navigation -', replace ? 'replace' : 'push', '- url:', url, '-> hash:', fullHashPath);
    
    // Update the browser hash which single-spa will detect
    if (replace) {
      window.history.replaceState(null, '', fullHashPath);
    } else {
      window.history.pushState(null, '', fullHashPath);
    }
  }
  
  private buildHashPath(url: string): string {
    // Build AngularJS-style hash path: #!/eui/screen/home
    // The url comes as /screen/home, we need to add /eui prefix
    let path = url;
    
    // Add /eui prefix if not present
    if (!path.startsWith('/eui/') && !path.startsWith('/eui')) {
      if (path.startsWith('/screen/')) {
        path = '/eui' + path;
      } else if (path.startsWith('screen/')) {
        path = '/eui/' + path;
      } else if (path.startsWith('/')) {
        path = '/eui' + path;
      } else {
        path = '/eui/' + path;
      }
    }
    
    // Return AngularJS hash format
    return '#!/' + path.replace(/^\//, '');
  }
  
  override prepareExternalUrl(internal: string): string {
    // This is called by Angular Router to determine what URL to show
    // In our case, we want to show the path without /eui since APP_BASE_HREF handles that
    return internal;
  }
  
  override path(includeHash?: boolean): string {
    // Override path() to correctly parse the hash for Angular Router
    // Extract the Angular MFE's internal path from: #!/eui/screen/home -> /screen/home
    const hash = window.location.hash;
    let extractedPath = '/';
    
    if (hash.startsWith('#!/eui/')) {
      extractedPath = '/' + hash.substring(7); // Remove #!/eui/ -> /screen/home
    } else if (hash.startsWith('#!/eui')) {
      extractedPath = hash.substring(6) || '/'; // Remove #!/eui -> /screen/home
    }
    
    console.log('MF Strategy path():', { hash, extractedPath });
    return extractedPath;
  }
}

function createMicrofrontendLocationStrategy(
  platformLocation: PlatformLocation,
  baseHref: string | null,
  preventUrlChange: boolean,
): LocationStrategy {
  return new MicrofrontendLocationStrategy(platformLocation, baseHref, preventUrlChange);
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
    
    // Clear any existing content to ensure clean mount
    domElement.innerHTML = '';
    
    // Log the current route and page for debugging
    if (props?.currentRoute) {
      console.log('EUI MFE: Mounting for route:', props.currentRoute);
    }
    if (props?.pageName) {
      console.log('EUI MFE: Mounting for page:', props.pageName);
    }
    
    // Force a fresh mount by checking if we're already mounted
    if (appRef) {
      console.log('EUI MFE: App already exists, destroying first...');
      appRef.destroy();
      appRef = null;
    }
    
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
    // Check if we're embedded in AngularJS host
    const isEmbedded = domElement && domElement.id === 'eui-embedded-container';
    
    if (isEmbedded) {
      console.log('EUI MFE: Running in embedded mode - NOT changing webpack publicPath to prevent redirects');
    } else {
      __webpack_public_path__ = getAssetBaseUrl();
      console.log('EUI MFE: Set webpack publicPath to:', __webpack_public_path__);
    }
  }

  // Set base href for the Angular app to ensure assets load from correct server
  const setMicrofrontendBaseHref = () => {
    const isEmbedded = domElement && domElement.id === 'eui-embedded-container';
    const isHosted = domElement && domElement.id === 'eui-mfe-container';
    
    if (isEmbedded || isHosted) {
      console.log('EUI MFE: Running in embedded/hosted mode - NOT changing base href to prevent redirects');
      return;
    }
    
    // Only change base href for standalone mode
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
  // Set APP_BASE_HREF to '/eui' for proper routing within the MFE namespace
  const mfConfig = {
    ...appConfig,
    providers: [
      ...appConfig.providers,
      // Explicitly provide DataBridgeService for microfrontend context
      // DataBridgeService,
      {
        provide: APP_BASE_HREF,
        useValue: '/eui',
      },
      {
        provide: PREVENT_URL_CHANGE,
        useValue: props?.preventUrlChange ?? false,
      },
      {
        provide: HOST_INITIAL_ROUTE,
        useValue: props?.currentRoute ?? null,
      },
      {
        provide: LocationStrategy,
        useFactory: createMicrofrontendLocationStrategy,
        deps: [PlatformLocation, [new Optional(), new Inject(APP_BASE_HREF)], PREVENT_URL_CHANGE],
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
  
  // Destroy the Angular app
  if (appRef) {
    console.log('EUI MFE: Destroying Angular app...');
    appRef.destroy();
    appRef = null;
  }
  
  // Clear the DOM element
  const embeddedContainer = document.getElementById('eui-embedded-container');
  if (embeddedContainer) {
    console.log('EUI MFE: Clearing embedded container...');
    embeddedContainer.innerHTML = '';
  }
  
  // Restore original base href
  const baseElement = document.querySelector('base');
  if (baseElement) {
    const originalHref = baseElement.getAttribute('data-original-href');
    if (originalHref) {
      baseElement.href = originalHref;
      console.log(`EUI MFE: Restored base href to: ${originalHref}`);
    }
  }
  
  console.log('EUI MFE: Unmount completed');
}


