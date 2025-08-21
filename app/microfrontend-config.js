// Single-SPA Root Configuration for AngularJS Host Application
System.import('single-spa').then(singleSpa => {
  const { registerApplication, start } = singleSpa;

  // Register the Angular micro-frontend
  registerApplication({
    name: 'angular-mfe',
    app: () => System.import('angular-mfe'),
    activeWhen: location => {
      console.log('Checking route:', location.hash);
      return location.hash.includes('angular-page') || location.hash.includes('angular-phone-list');
    },
    customProps: (name, location) => ({
      domElementGetter: () => document.getElementById('angular-mfe-container')
    })
  });

  // Start single-spa
  start({
    urlRerouteOnly: true
  });

  console.log('Single-SPA Root Config loaded for AngularJS host');
}).catch(err => {
  console.error('Failed to load single-spa:', err);
});
