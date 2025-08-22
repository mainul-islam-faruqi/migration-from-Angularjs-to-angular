import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

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

  // Set base URL for this micro-frontend to ensure assets load from correct server
  const existingBase = document.querySelector('base');
  let baseElement = existingBase;
  if (!existingBase) {
    baseElement = document.createElement('base');
    document.head.appendChild(baseElement);
  }
  const originalHref = baseElement.href;
  baseElement.href = 'http://localhost:4300/';

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

  // Use HashLocationStrategy for micro-frontend to avoid history conflicts
  const mfConfig = {
    ...appConfig,
    providers: [
      ...appConfig.providers,
      {
        provide: LocationStrategy,
        useClass: HashLocationStrategy
      }
    ],
    rootElement: domElement.querySelector('app-root') as Element,
  };

    console.log('EUI MFE: Starting Angular bootstrapApplication...');
    appRef = await bootstrapApplication(AppComponent, mfConfig);
    console.log('EUI MFE: Angular app mounted successfully!');

    // Store original href to restore on unmount
    (appRef as any).__originalBaseHref = originalHref;
  } catch (error) {
    console.error('EUI MFE: Mount failed:', error);
    throw error;
  }
}

export async function unmount() {
  console.log('EUI MFE: unmount');
  if (appRef) {
    // Restore original base href
    const originalHref = (appRef as any).__originalBaseHref;
    if (originalHref) {
      const baseElement = document.querySelector('base');
      if (baseElement) {
        baseElement.href = originalHref;
      }
    }
    
    appRef.destroy();
    appRef = null;
  }
}


