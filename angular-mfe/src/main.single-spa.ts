import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

let appRef: any;

export async function bootstrap() {
  // Bootstrap is called once when the app is first loaded
  console.log('Angular MFE: bootstrap');
}

export async function mount(props: any) {
  // Mount is called every time the app becomes active
  console.log('Angular MFE: mount', props);
  
  try {
    // Get the DOM element where Angular should mount
    const domElement = props.domElementGetter ? props.domElementGetter() : document.getElementById('angular-mfe-container');
    
    if (!domElement) {
      throw new Error('Could not find DOM element to mount Angular app');
    }
    
    // Clear any existing content and create app-root element
    domElement.innerHTML = '<app-root></app-root>';
    
    // Bootstrap Angular application to the specific app-root element
    appRef = await bootstrapApplication(AppComponent, {
      providers: [
        provideHttpClient() // Provide HttpClient for the app
        // PhoneService is provided via @Injectable({providedIn: 'root'})
      ],
      // Specify the root element selector
      rootElement: domElement.querySelector('app-root')
    });
    
    console.log('Angular MFE: mounted successfully');
  } catch (error) {
    console.error('Angular MFE: mount error', error);
  }
}

export async function unmount() {
  // Unmount is called every time the app becomes inactive
  console.log('Angular MFE: unmount');
  
  if (appRef) {
    appRef.destroy();
    appRef = null;
  }
}
