// Single-SPA Root Configuration for AngularJS Host Application
System.import('single-spa').then(singleSpa => {
  const { registerApplication, start } = singleSpa;

  // Function to update visibility based on current route
  function updateVisibility() {
    const viewContainer = document.querySelector('.view-container');
    const euiContainer = document.getElementById('eui-mfe-container');
    const angularMfeContainer = document.getElementById('angular-mfe-container');
    const embeddedContainer = document.getElementById('eui-embedded-container');
    
    if (location.hash.includes('eui')) {
      // Show EUI container, hide others
      if (viewContainer) viewContainer.style.display = 'none';
      if (angularMfeContainer) angularMfeContainer.style.display = 'none';
      if (euiContainer) euiContainer.style.display = 'block';
      if (embeddedContainer) embeddedContainer.style.display = 'none';
    } else if (location.hash.includes('angular-page') || 
               location.hash.includes('angular-phone-list') || 
               location.hash.includes('angular-phone-detail')) {
      // Show Angular MFE container, hide others
      if (viewContainer) viewContainer.style.display = 'none';
      if (euiContainer) euiContainer.style.display = 'none';
      if (angularMfeContainer) angularMfeContainer.style.display = 'block';
      if (embeddedContainer) embeddedContainer.style.display = 'none';
    } else if (location.hash.includes('phones') || 
               location.hash.includes('dashboard') || 
               location.hash.includes('reports')) {
      // Show AngularJS view container with embedded EUI component
      if (viewContainer) viewContainer.style.display = 'block';
      if (euiContainer) euiContainer.style.display = 'none';
      if (angularMfeContainer) angularMfeContainer.style.display = 'none';
      if (embeddedContainer) embeddedContainer.style.display = 'block';
    } else {
      // Show AngularJS view container, hide others
      if (viewContainer) viewContainer.style.display = 'block';
      if (euiContainer) euiContainer.style.display = 'none';
      if (angularMfeContainer) angularMfeContainer.style.display = 'none';
      if (embeddedContainer) embeddedContainer.style.display = 'none';
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

  // Register embedded Angular component for each page separately to force remounting
  const pages = ['phones', 'dashboard', 'reports'];
  
  pages.forEach(page => {
    registerApplication({
      name: `eui-embedded-${page}`,
      app: () => System.import('eui-desktop'),
      activeWhen: location => {
        console.log(`🎯 Checking embedded route for ${page}:`, location.hash);
        const isActive = location.hash.includes(page) && !location.hash.includes('eui');
        console.log(`🎯 Embedded Angular component active for ${page}:`, isActive);
        return isActive;
      },
      customProps: (name, location) => ({
        domElementGetter: () => {
          console.log(`🎯 Getting embedded container for ${page}`);
          const container = document.getElementById('eui-embedded-container');
          console.log(`🎯 Container found for ${page}:`, container);
          return container;
        },
        // Prevent Angular router from changing browser URL
        preventUrlChange: true,
        // Pass context that this is embedded
        isEmbedded: true,
        // Pass current route to force remounting
        currentRoute: location.hash,
        // Pass page name for debugging
        pageName: page
      })
    });
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
