// Single-SPA Root Configuration for AngularJS Host Application
System.import('single-spa').then(singleSpa => {
  const { registerApplication, start } = singleSpa;

  // Function to update visibility based on current route
  function updateVisibility() {
    const viewContainer = document.querySelector('.view-container');
    const euiContainer = document.getElementById('eui-mfe-container');
    const angularMfeContainer = document.getElementById('angular-mfe-container');
    
    if (location.hash.includes('eui')) {
      // Show EUI container, hide others
      if (viewContainer) viewContainer.style.display = 'none';
      if (angularMfeContainer) angularMfeContainer.style.display = 'none';
      if (euiContainer) euiContainer.style.display = 'block';
    } else if (location.hash.includes('angular-page') || 
               location.hash.includes('angular-phone-list') || 
               location.hash.includes('angular-phone-detail')) {
      // Show Angular MFE container, hide others
      if (viewContainer) viewContainer.style.display = 'none';
      if (euiContainer) euiContainer.style.display = 'none';
      if (angularMfeContainer) angularMfeContainer.style.display = 'block';
    } else {
      // Show AngularJS view container, hide others
      if (viewContainer) viewContainer.style.display = 'block';
      if (euiContainer) euiContainer.style.display = 'none';
      if (angularMfeContainer) angularMfeContainer.style.display = 'none';
    }
  }

  // Register the Angular micro-frontend
  registerApplication({
    name: 'angular-mfe',
    app: () => System.import('angular-mfe'),
    activeWhen: location => {
      console.log('Checking route:', location.hash);
      return (
        location.hash.includes('angular-page') ||
        location.hash.includes('angular-phone-list') ||
        location.hash.includes('angular-phone-detail')
      );
    },
    customProps: (name, location) => ({
      domElementGetter: () => document.getElementById('angular-mfe-container')
    })
  });

  registerApplication({
    name: 'eui-desktop',
    app: () => System.import('eui-desktop'),
    activeWhen: location => location.hash.includes('eui'),
    customProps: () => ({
      domElementGetter: () => document.getElementById('eui-mfe-container')
    })
  });

  // Start single-spa
  start({
    urlRerouteOnly: true
  });

  // Update visibility on route changes
  window.addEventListener('hashchange', updateVisibility);
  window.addEventListener('single-spa:routing-spa:routing-event', updateVisibility);
  
  // Initial visibility update
  updateVisibility();

  console.log('Single-SPA Root Config loaded for AngularJS host');
}).catch(err => {
  console.error('Failed to load single-spa:', err);
});
