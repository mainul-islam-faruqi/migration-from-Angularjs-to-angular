// Single-SPA Root Configuration for AngularJS Host Application
// REFACTORED VERSION - Proper lifecycle management without CSS hacks

System.import('single-spa').then(singleSpa => {
  const { registerApplication, start } = singleSpa;

  // Container management - properly create/remove containers based on route
  const containerRegistry = {
    containers: new Map(),
    
    getOrCreateContainer(id, shouldExist) {
      let container = document.getElementById(id);
      
      if (shouldExist && !container) {
        // Create container only when needed
        container = document.createElement('div');
        container.id = id;
        container.style.position = 'relative';
        // Insert after the footer, before closing body tag
        const footer = document.querySelector('app-footer');
        if (footer && footer.parentNode) {
          footer.parentNode.insertBefore(container, footer.nextSibling);
        } else {
          document.body.appendChild(container);
        }
        this.containers.set(id, container);
        console.log(`✓ Created container: ${id}`);
      } else if (!shouldExist && container) {
        // Remove container when not needed (proper cleanup)
        container.remove();
        this.containers.delete(id);
        console.log(`✓ Removed container: ${id}`);
      }
      
      return shouldExist ? container : null;
    },
    
    // Determine which containers should exist for current route
    getRequiredContainers(route) {
      const routeHash = route.hash || location.hash;
      
      if (routeHash.includes('eui') && !routeHash.includes('phones') && !routeHash.includes('dashboard') && !routeHash.includes('reports')) {
        // Full-page EUI route
        return {
          'view-container': false,
          'angular-mfe-container': false,
          'eui-mfe-container': true,
          'eui-embedded-container': false
        };
      } else if (routeHash.includes('angular-page') || 
                 routeHash.includes('angular-phone-list') || 
                 routeHash.includes('angular-phone-detail')) {
        // Full-page Angular MFE route
        return {
          'view-container': false,
          'angular-mfe-container': true,
          'eui-mfe-container': false,
          'eui-embedded-container': false
        };
      } else if (routeHash.includes('phones') || 
                 routeHash.includes('dashboard') || 
                 routeHash.includes('reports')) {
        // AngularJS route with embedded EUI component
        return {
          'view-container': true,
          'angular-mfe-container': false,
          'eui-mfe-container': false,
          'eui-embedded-container': true
        };
      } else {
        // Default AngularJS route
        return {
          'view-container': true,
          'angular-mfe-container': false,
          'eui-mfe-container': false,
          'eui-embedded-container': false
        };
      }
    },
    
    updateContainers(route) {
      const required = this.getRequiredContainers(route);
      
      // Get or create/remove each container based on requirements
      Object.keys(required).forEach(containerId => {
        this.getOrCreateContainer(containerId, required[containerId]);
      });
    }
  };

  // Register the Angular micro-frontend
  registerApplication({
    name: 'angular-mfe',
    app: () => System.import('angular-mfe'),
    activeWhen: (location) => {
      const isActive = (
        location.hash.includes('angular-page') ||
        location.hash.includes('angular-phone-list') ||
        location.hash.includes('angular-phone-detail')
      );
      
      if (isActive) {
        // Ensure container exists before Single-SPA tries to mount
        containerRegistry.updateContainers(location);
      }
      
      return isActive;
    },
    customProps: (name, location) => {
      // Container must exist before mounting
      containerRegistry.updateContainers(location);
      
      return {
        domElementGetter: () => {
          const container = document.getElementById('angular-mfe-container');
          if (!container) {
            console.error('angular-mfe-container not found - this should not happen');
            throw new Error('angular-mfe-container not found');
          }
          return container;
        }
      };
    }
  });

  // Register the EUI desktop micro-frontend
  registerApplication({
    name: 'eui-desktop',
    app: () => System.import('eui-desktop'),
    activeWhen: (location) => {
      const routeHash = location.hash || location.hash;
      const isActive = routeHash.includes('eui') && 
                      !routeHash.includes('phones') && 
                      !routeHash.includes('dashboard') && 
                      !routeHash.includes('reports');
      
      if (isActive) {
        containerRegistry.updateContainers(location);
      }
      
      return isActive;
    },
    customProps: (name, location) => {
      containerRegistry.updateContainers(location);
      
      return {
        domElementGetter: () => {
          const container = document.getElementById('eui-mfe-container');
          if (!container) {
            console.error('eui-mfe-container not found - this should not happen');
            throw new Error('eui-mfe-container not found');
          }
          return container;
        }
      };
    }
  });

  // Register embedded Angular component for each page
  const pages = ['phones', 'dashboard', 'reports'];
  
  pages.forEach(page => {
    registerApplication({
      name: `eui-embedded-${page}`,
      app: () => System.import('eui-desktop'),
      activeWhen: (location) => {
        const routeHash = location.hash || location.hash;
        const isActive = routeHash.includes(page) && 
                        !routeHash.includes('eui');
        
        if (isActive) {
          containerRegistry.updateContainers(location);
        }
        
        return isActive;
      },
      customProps: (name, location) => {
        containerRegistry.updateContainers(location);
        
        return {
          domElementGetter: () => {
            const container = document.getElementById('eui-embedded-container');
            if (!container) {
              console.error(`eui-embedded-container not found for ${page}`);
              throw new Error(`eui-embedded-container not found for ${page}`);
            }
            return container;
          },
          preventUrlChange: true,
          isEmbedded: true,
          currentRoute: location.hash,
          pageName: page
        };
      }
    });
  });

  // Hook into Single-SPA lifecycle to clean up containers after unmount
  window.addEventListener('single-spa:before-mount-routing-event', () => {
    // Before routing, update containers based on new route
    containerRegistry.updateContainers(window.location);
  });

  window.addEventListener('single-spa:routing-event', () => {
    // After routing, ensure containers match active apps
    // This ensures cleanup happens after unmount
    setTimeout(() => {
      containerRegistry.updateContainers(window.location);
    }, 0);
  });

  // Also handle hash changes (AngularJS routing)
  window.addEventListener('hashchange', () => {
    containerRegistry.updateContainers(window.location);
  });

  // Start single-spa
  start({
    urlRerouteOnly: true
  });

  // Initial container setup
  containerRegistry.updateContainers(window.location);

  console.log('✓ Single-SPA Root Config loaded with proper lifecycle management');
}).catch(err => {
  console.error('✗ Failed to load single-spa:', err);
});

