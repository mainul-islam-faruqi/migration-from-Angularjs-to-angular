// Manual MFE loader that forces loading on route changes
(function() {
  'use strict';
  
  let currentRoute = location.hash;
  let mfeLoaded = false;
  
  function loadMFE() {
    const container = document.getElementById('eui-embedded-container');
    if (!container) {
      console.log('🎯 MFE container not found');
      return;
    }
    
    console.log('🎯 Loading MFE for route:', location.hash);
    
    // Clear container
    container.innerHTML = '';
    
    // Load the MFE script if not already loaded
    if (!mfeLoaded) {
      console.log('🎯 Loading MFE script...');
      const script = document.createElement('script');
      script.src = 'http://localhost:4300/main.js';
      script.type = 'module';
      script.onload = () => {
        console.log('🎯 MFE script loaded');
        mfeLoaded = true;
        mountMFE();
      };
      script.onerror = () => {
        console.error('🎯 Failed to load MFE script');
      };
      document.head.appendChild(script);
    } else {
      mountMFE();
    }
  }
  
  function mountMFE() {
    const container = document.getElementById('eui-embedded-container');
    if (!container) {
      console.log('🎯 MFE container not found for mounting');
      return;
    }
    
    console.log('🎯 Mounting MFE component...');
    
    // Create the Angular component
    container.innerHTML = '<app-root></app-root>';
    
    // Trigger Angular to bootstrap if available
    if (window.singleSpa && window.singleSpa.getMountedApps) {
      const apps = window.singleSpa.getMountedApps();
      console.log('🎯 Currently mounted apps:', apps);
      
      // Try to mount the eui-embedded app
      if (apps.includes('eui-embedded')) {
        console.log('🎯 eui-embedded app is mounted');
      } else {
        console.log('🎯 eui-embedded app is not mounted, trying to mount...');
        // Force a reroute to trigger mounting
        setTimeout(() => {
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 100);
      }
    } else {
      console.log('🎯 Single-SPA not available yet, waiting...');
      // Wait for Single-SPA to load
      setTimeout(() => {
        if (window.singleSpa && window.singleSpa.getMountedApps) {
          console.log('🎯 Single-SPA now available, retrying mount...');
          mountMFE();
        }
      }, 500);
    }
  }
  
  function checkRouteChange() {
    if (currentRoute !== location.hash) {
      console.log('🎯 Route changed from', currentRoute, 'to', location.hash);
      currentRoute = location.hash;
      
      // Check if this is a page that should have MFE
      if (location.hash.includes('phones') || 
          location.hash.includes('dashboard') || 
          location.hash.includes('reports')) {
        console.log('🎯 This page should have MFE, loading...');
        loadMFE();
      }
    }
  }
  
  // Listen for route changes
  window.addEventListener('hashchange', checkRouteChange);
  
  // Check on page load
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, checking initial route...');
    checkRouteChange();
  });
  
  // Also check immediately
  checkRouteChange();
  
  console.log('🎯 Manual MFE loader initialized');
})();
