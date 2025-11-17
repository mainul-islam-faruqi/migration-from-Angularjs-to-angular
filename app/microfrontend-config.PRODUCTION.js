// Production-Ready Single-SPA Configuration with Dynamic Registry
// Scalable, maintainable, and configuration-driven architecture

(async function() {
  try {
    // Load Single-SPA
    const singleSpa = await System.import('single-spa');
    const { registerApplication, start } = singleSpa;

    // Load MFE Registry Configuration
    const config = await loadConfig();
    
    // Determine environment
    const env = getEnvironment();
    const envConfig = config.environment[env] || config.environment.development;
    
    // Initialize logging
    const logger = createLogger(envConfig);
    logger.info('🚀 Initializing Single-SPA with configuration-driven architecture');
    
    // Create managers
    const containerManager = new ContainerManager(config.containers, logger);
    const routeMatcher = new RouteMatcher(config.applications, logger);
    const visibilityManager = new VisibilityManager(config.visibility, logger);
    
    // Register all enabled applications
    Object.values(config.applications).forEach(appConfig => {
      if (!appConfig.enabled) {
        logger.info(`⏭️  Skipping disabled application: ${appConfig.name}`);
        return;
      }
      
      registerApplication({
        name: appConfig.name,
        app: () => loadApplication(appConfig.module, logger),
        activeWhen: (location) => routeMatcher.isActive(appConfig.name, location),
        customProps: (name, location) => createCustomProps(appConfig, location, containerManager, logger)
      });
      
      logger.info(`✅ Registered application: ${appConfig.displayName || appConfig.name}`);
    });

    // Setup lifecycle event handlers
    setupLifecycleHooks(containerManager, routeMatcher, visibilityManager, logger);
    
    // Start Single-SPA
    start({
      urlRerouteOnly: true
    });
    
    // Initial setup
    visibilityManager.update(window.location);
    
    logger.info('✨ Single-SPA started successfully with production configuration');
    
    // Expose configuration API for debugging
    if (envConfig.debug) {
      window.__SINGLE_SPA_DEBUG__ = {
        config,
        containerManager,
        routeMatcher,
        visibilityManager,
        reloadConfig: () => location.reload()
      };
      logger.info('🔍 Debug mode enabled. Access via window.__SINGLE_SPA_DEBUG__');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize Single-SPA:', error);
    showErrorMessage(error);
  }
})();

// ============================================================================
// Configuration Loader
// ============================================================================

async function loadConfig() {
  try {
    // Try loading from API first (production scenario)
    const response = await fetch('/config/mfe-registry.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    const config = await response.json();
    validateConfig(config);
    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Fallback to minimal config
    return getMinimalFallbackConfig();
  }
}

function validateConfig(config) {
  if (!config.applications || typeof config.applications !== 'object') {
    throw new Error('Invalid config: missing applications');
  }
  if (!config.containers || !config.containers.managed) {
    throw new Error('Invalid config: missing containers configuration');
  }
}

function getMinimalFallbackConfig() {
  console.warn('⚠️  Using minimal fallback configuration');
  return {
    version: '1.0.0-fallback',
    applications: {},
    containers: { managed: [] },
    visibility: { rules: [], default: { show: [], hide: [] } },
    environment: {
      development: { logging: true, debug: true, performanceMonitoring: false }
    }
  };
}

// ============================================================================
// Container Manager - Dynamic container lifecycle management
// ============================================================================

class ContainerManager {
  constructor(containerConfig, logger) {
    this.config = containerConfig;
    this.logger = logger;
    this.containers = new Map();
  }
  
  getContainer(containerId, location) {
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = this.createContainer(containerId);
      this.logger.debug(`📦 Created container: ${containerId}`);
    }
    
    return container;
  }
  
  createContainer(containerId) {
    const containerDef = this.config.managed.find(c => c.id === containerId);
    
    if (!containerDef) {
      throw new Error(`Container definition not found: ${containerId}`);
    }
    
    const container = document.createElement('div');
    container.id = containerId;
    container.setAttribute('data-mfe-container', 'true');
    container.style.position = 'relative';
    
    // Insert container at appropriate position
    document.body.appendChild(container);
    this.containers.set(containerId, container);
    
    return container;
  }
  
  removeContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container && container.getAttribute('data-mfe-container') === 'true') {
      container.remove();
      this.containers.delete(containerId);
      this.logger.debug(`🗑️  Removed container: ${containerId}`);
    }
  }
  
  ensureContainersExist(containerIds) {
    const managed = this.config.managed
      .filter(c => !c.alwaysPresent)
      .map(c => c.id);
    
    // Create needed containers
    containerIds.forEach(id => {
      if (!document.getElementById(id)) {
        this.createContainer(id);
      }
    });
    
    // Remove unneeded containers
    managed.forEach(id => {
      if (!containerIds.includes(id) && document.getElementById(id)) {
        this.removeContainer(id);
      }
    });
  }
}

// ============================================================================
// Route Matcher - Intelligent route matching from configuration
// ============================================================================

class RouteMatcher {
  constructor(applications, logger) {
    this.applications = applications;
    this.logger = logger;
  }
  
  isActive(appName, location) {
    const app = this.applications[appName];
    if (!app || !app.enabled) return false;
    
    const hash = location.hash || '';
    const path = hash.replace(/^#!?/, ''); // Remove #! or #
    
    return app.routes.patterns.some(pattern => {
      // Check if path matches
      const matches = pattern.exact 
        ? path === pattern.path 
        : path.includes(pattern.path);
      
      // Check exclusions
      if (matches && pattern.exclude && pattern.exclude.length > 0) {
        const excluded = pattern.exclude.some(ex => path.includes(ex));
        return !excluded;
      }
      
      return matches;
    });
  }
  
  getActiveContainers(location) {
    const activeApps = Object.values(this.applications)
      .filter(app => app.enabled && this.isActive(app.name, location));
    
    return activeApps.map(app => app.container.id);
  }
}

// ============================================================================
// Visibility Manager - Handle show/hide logic for containers
// ============================================================================

class VisibilityManager {
  constructor(visibilityConfig, logger) {
    this.config = visibilityConfig;
    this.logger = logger;
  }
  
  update(location) {
    const hash = location.hash || '';
    const path = hash.replace(/^#!?/, '');
    
    // Find matching visibility rule
    const rule = this.config.rules.find(rule => {
      try {
        // Simple string-based evaluation (could be enhanced with a proper parser)
        return this.evaluateCondition(rule.condition, path);
      } catch (e) {
        this.logger.warn(`Failed to evaluate visibility rule: ${rule.condition}`, e);
        return false;
      }
    });
    
    const visibility = rule || this.config.default;
    
    // Apply visibility
    visibility.show.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.style.display = 'block';
      }
    });
    
    visibility.hide.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.style.display = 'none';
      }
    });
  }
  
  evaluateCondition(condition, route) {
    // Simple condition evaluator
    // Replace 'route' with actual route value and evaluate
    const evaluableCondition = condition.replace(/route/g, `"${route}"`);
    
    // Use Function constructor for safe evaluation (better than eval)
    try {
      return new Function(`return ${evaluableCondition}`)();
    } catch (e) {
      this.logger.warn(`Condition evaluation failed: ${condition}`, e);
      return false;
    }
  }
}

// ============================================================================
// Application Loader with error handling
// ============================================================================

async function loadApplication(moduleName, logger) {
  try {
    logger.info(`📥 Loading application: ${moduleName}`);
    const startTime = performance.now();
    
    const app = await System.import(moduleName);
    
    const loadTime = (performance.now() - startTime).toFixed(2);
    logger.info(`✅ Loaded ${moduleName} in ${loadTime}ms`);
    
    return app;
  } catch (error) {
    logger.error(`❌ Failed to load application: ${moduleName}`, error);
    throw error;
  }
}

// ============================================================================
// Custom Props Factory
// ============================================================================

function createCustomProps(appConfig, location, containerManager, logger) {
  return {
    domElementGetter: () => {
      const container = containerManager.getContainer(appConfig.container.id, location);
      if (!container) {
        const error = `Container not found: ${appConfig.container.id}`;
        logger.error(error);
        throw new Error(error);
      }
      return container;
    },
    currentRoute: location.hash,
    hostHref: location.href,
    pageName: extractPageName(location.hash),
    ...appConfig.customProps
  };
}

function extractPageName(hash) {
  const match = hash.match(/\/(phones|dashboard|reports)/);
  return match ? match[1] : null;
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

function setupLifecycleHooks(containerManager, routeMatcher, visibilityManager, logger) {
  // Before routing event
  window.addEventListener('single-spa:before-routing-event', (event) => {
    logger.debug('🔄 Before routing event', event.detail);
    const activeContainers = routeMatcher.getActiveContainers(window.location);
    containerManager.ensureContainersExist(activeContainers);
  });
  
  // After routing event
  window.addEventListener('single-spa:routing-event', () => {
    logger.debug('✅ Routing event completed');
    visibilityManager.update(window.location);
    
    // Cleanup after unmount
    setTimeout(() => {
      const activeContainers = routeMatcher.getActiveContainers(window.location);
      containerManager.ensureContainersExist(activeContainers);
    }, 0);
  });
  
  // Hash change (AngularJS routing)
  window.addEventListener('hashchange', () => {
    logger.debug('🔗 Hash change detected');
    visibilityManager.update(window.location);
  });
  
  // Application mount/unmount events
  window.addEventListener('single-spa:before-mount-routing-event', (event) => {
    logger.debug('🏗️  Before mount:', event.detail?.appOrParcelName);
  });
  
  window.addEventListener('single-spa:app-change', (event) => {
    const { detail } = event;
    logger.info('📊 Application change:', {
      mounted: detail?.newAppStatuses?.MOUNTED || [],
      unmounted: detail?.newAppStatuses?.NOT_MOUNTED || []
    });
  });
}

// ============================================================================
// Logger Factory
// ============================================================================

function createLogger(envConfig) {
  const logLevel = envConfig.debug ? 'debug' : envConfig.logging ? 'info' : 'error';
  
  return {
    debug: (message, ...args) => {
      if (logLevel === 'debug') {
        console.log(`[DEBUG] ${message}`, ...args);
      }
    },
    info: (message, ...args) => {
      if (logLevel === 'debug' || logLevel === 'info') {
        console.log(`[INFO] ${message}`, ...args);
      }
    },
    warn: (message, ...args) => {
      console.warn(`[WARN] ${message}`, ...args);
    },
    error: (message, ...args) => {
      console.error(`[ERROR] ${message}`, ...args);
    }
  };
}

// ============================================================================
// Environment Detection
// ============================================================================

function getEnvironment() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging';
  } else {
    return 'production';
  }
}

// ============================================================================
// Error UI
// ============================================================================

function showErrorMessage(error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #d32f2f;
    color: white;
    padding: 20px;
    text-align: center;
    font-family: Arial, sans-serif;
    z-index: 10000;
  `;
  errorDiv.innerHTML = `
    <h3>⚠️ Microfrontend Configuration Error</h3>
    <p>${error.message || 'An error occurred while loading the application'}</p>
    <button onclick="location.reload()" style="
      background: white;
      color: #d32f2f;
      border: none;
      padding: 10px 20px;
      margin-top: 10px;
      cursor: pointer;
      border-radius: 4px;
      font-weight: bold;
    ">Reload Page</button>
  `;
  document.body.insertBefore(errorDiv, document.body.firstChild);
}

