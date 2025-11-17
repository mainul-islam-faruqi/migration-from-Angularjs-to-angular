# Migration Guide: From REFACTORED to PRODUCTION Configuration

## 🎯 Quick Summary

**What changed?**
- From: Hard-coded configuration in JavaScript
- To: Configuration file + dynamic loader

**Benefits:**
- ✅ Add new MFEs by editing JSON (no code changes)
- ✅ Environment-specific configurations
- ✅ Better error handling and logging
- ✅ Production-ready observability

**Effort Required:** ⭐ Very Low (30 minutes)

---

## 📊 Side-by-Side Comparison

### OLD: microfrontend-config.REFACTORED.js

```javascript
// ❌ Hard-coded container IDs
const containerRegistry = {
  containers: new Map(),
  
  getOrCreateContainer(id, shouldExist) {
    // ... hard-coded logic ...
  },
  
  // ❌ Hard-coded route patterns
  getRequiredContainers(route) {
    const routeHash = route.hash || location.hash;
    
    if (routeHash.includes('eui') && !routeHash.includes('phones') && !routeHash.includes('dashboard')) {
      return {
        'view-container': false,
        'angular-mfe-container': false,
        'eui-mfe-container': true,  // ❌ Hard-coded
        'eui-embedded-container': false
      };
    }
    // ... more hard-coded conditions ...
  }
};

// ❌ Hard-coded application registration
registerApplication({
  name: 'angular-mfe',  // ❌ Hard-coded
  app: () => System.import('angular-mfe'),  // ❌ Hard-coded
  activeWhen: (location) => {
    const isActive = (
      location.hash.includes('angular-page') ||  // ❌ Hard-coded
      location.hash.includes('angular-phone-list') ||  // ❌ Hard-coded
      location.hash.includes('angular-phone-detail')  // ❌ Hard-coded
    );
    return isActive;
  }
});

// ❌ Hard-coded pages array
const pages = ['phones', 'dashboard', 'reports'];  // ❌ Hard-coded

pages.forEach(page => {
  registerApplication({
    name: `eui-embedded-${page}`,  // ❌ Hard-coded
    // ... more hard-coded logic ...
  });
});

// ❌ Console.logs in production
console.log('✓ Created container: ${id}');
```

### NEW: microfrontend-config.PRODUCTION.js

```javascript
// ✅ Load configuration from file
const config = await loadConfig();  // ✅ Dynamic

// ✅ Environment-aware logging
const logger = createLogger(envConfig);  // ✅ Configurable
logger.info('Initializing Single-SPA');

// ✅ Dynamic registration from config
Object.values(config.applications).forEach(appConfig => {
  if (!appConfig.enabled) return;  // ✅ Feature flags
  
  registerApplication({
    name: appConfig.name,  // ✅ From config
    app: () => loadApplication(appConfig.module, logger),  // ✅ With monitoring
    activeWhen: (location) => routeMatcher.isActive(appConfig.name, location),  // ✅ Dynamic
    customProps: (name, location) => createCustomProps(appConfig, location, containerManager, logger)
  });
});
```

### NEW: config/mfe-registry.json

```json
{
  "applications": {
    "angular-mfe": {
      "name": "angular-mfe",
      "displayName": "Angular Phone List",
      "module": "angular-mfe",
      "enabled": true,
      "routes": {
        "patterns": [
          { "path": "/angular-page", "exact": false },
          { "path": "/angular-phone-list", "exact": false },
          { "path": "/angular-phone-detail", "exact": false }
        ]
      },
      "container": {
        "id": "angular-mfe-container"
      }
    }
  }
}
```

**To add a new MFE, just edit JSON - no JavaScript changes!**

---

## 🔄 What Changed

### 1. Hard-coded Values → Configuration File

| What | Before (Hard-coded) | After (Configurable) |
|------|-------------------|---------------------|
| **Container IDs** | `'angular-mfe-container'` in code | `config.containers.managed[].id` |
| **Route Patterns** | `location.hash.includes('phones')` | `config.applications.*.routes.patterns` |
| **Application Names** | `'angular-mfe'` in code | `config.applications.*.name` |
| **Module Names** | `System.import('angular-mfe')` | `config.applications.*.module` |
| **Pages List** | `const pages = ['phones', 'dashboard']` | `config.applications.*.routes.patterns` |
| **Environment Settings** | None | `config.environment.*` |

### 2. Console.log → Structured Logging

**Before:**
```javascript
console.log(`✓ Created container: ${id}`);
console.error('Container not found');
```

**After:**
```javascript
logger.info('Created container', { containerId: id });
logger.error('Container not found', { containerId, route });
```

**Production**: Logging automatically disabled in production environment.

### 3. No Error Handling → Comprehensive Error Handling

**Before:**
```javascript
System.import('single-spa').then(singleSpa => {
  // ... code ...
}).catch(err => {
  console.error('Failed to load single-spa:', err);  // ❌ No recovery
});
```

**After:**
```javascript
try {
  const config = await loadConfig();
  // ... code ...
} catch (error) {
  logger.error('Failed to initialize', error);
  showErrorMessage(error);  // ✅ User-friendly error UI
  // ✅ Fallback configuration
}
```

### 4. No Observability → Built-in Monitoring

**Before:**
- No visibility into what's happening
- No performance metrics
- No debugging tools

**After:**
```javascript
// Development mode provides debug API
window.__SINGLE_SPA_DEBUG__ = {
  config,                 // View current configuration
  containerManager,       // Inspect containers
  routeMatcher,          // Test route matching
  reloadConfig: () => location.reload()
};

// Performance monitoring
logger.info(`Loaded ${moduleName} in ${loadTime}ms`);
```

---

## 📝 Migration Steps

### Step 1: Backup Current Configuration

```bash
cp app/microfrontend-config.REFACTORED.js app/microfrontend-config.REFACTORED.js.backup
```

### Step 2: Verify New Files Exist

```bash
ls -la app/config/mfe-registry.json
ls -la app/microfrontend-config.PRODUCTION.js
```

### Step 3: Review Configuration

Open `app/config/mfe-registry.json` and verify your MFEs are configured correctly:

```json
{
  "applications": {
    "angular-mfe": { ... },           // ✅ Check routes
    "eui-desktop-fullpage": { ... },  // ✅ Check routes
    "eui-desktop-embedded": { ... }   // ✅ Check routes
  }
}
```

### Step 4: Update index.html

```html
<!-- OLD -->
<script type="module" src="microfrontend-config.REFACTORED.js"></script>

<!-- NEW -->
<script type="module" src="microfrontend-config.PRODUCTION.js"></script>
```

### Step 5: Test Locally

```bash
# Terminal 1: Start AngularJS host
cd angular-phonecat
npm start

# Terminal 2: Start Angular MFE (if you have it)
cd eui-ng-microfrontend
npm start

# Terminal 3: Open browser
open http://localhost:8000/app/
```

### Step 6: Verify Functionality

#### Test Checklist

- [ ] **AngularJS Routes Work**
  - Navigate to `#!/phones` → Phone list shows
  - Navigate to `#!/dashboard` → Dashboard shows
  - Navigate to `#!/reports` → Reports shows

- [ ] **Angular MFE Routes Work**
  - Navigate to `#!/eui/screen/home` → EUI home shows
  - Navigate to `#!/eui/screen/module1` → Module1 shows
  - Navigate to `#!/eui/screen/module2` → Module2 shows

- [ ] **Header/Footer Display**
  - Header always visible ✅
  - Navigation links work ✅
  - Footer visible (if enabled) ✅

- [ ] **Container Management**
  - Open browser DevTools → Console
  - Look for log messages: `[INFO] Registered application: ...`
  - Should see `[INFO] ✨ Single-SPA started successfully`

- [ ] **Debug Mode (Development)**
  - Open browser console
  - Type: `window.__SINGLE_SPA_DEBUG__`
  - Should see object with `config`, `containerManager`, etc.

### Step 7: Check Browser Console

**Good Signs:**
```
[INFO] 🚀 Initializing Single-SPA with configuration-driven architecture
[INFO] ✅ Registered application: Angular Phone List
[INFO] ✅ Registered application: EUI Desktop (Full Page)
[INFO] ✅ Registered application: EUI Desktop (Embedded)
[INFO] ✨ Single-SPA started successfully
[INFO] 🔍 Debug mode enabled. Access via window.__SINGLE_SPA_DEBUG__
```

**Bad Signs (if you see these, something's wrong):**
```
❌ Failed to load config: 404
❌ Failed to initialize Single-SPA
```

### Step 8: Test Configuration Changes

**Add a test route** to prove configuration works:

Edit `app/config/mfe-registry.json`:

```json
{
  "applications": {
    "test-app": {
      "name": "test-app",
      "displayName": "Test Application",
      "module": "angular-mfe",
      "type": "fullpage",
      "enabled": false,  // ← Disabled for now
      "routes": {
        "patterns": [
          { "path": "/test", "exact": false }
        ]
      },
      "container": {
        "id": "test-container"
      }
    }
  }
}
```

Reload the page. Check console:
```
[INFO] ⏭️  Skipping disabled application: test-app
```

**Enable it:**
```json
"enabled": true
```

Reload. Check console:
```
[INFO] ✅ Registered application: Test Application
```

✅ **Configuration is working!**

---

## 🐛 Troubleshooting

### Problem: "Failed to load config: 404"

**Cause**: Config file not found

**Solution**:
```bash
# Verify file exists
ls -la app/config/mfe-registry.json

# Check path in browser
open http://localhost:8000/app/config/mfe-registry.json
```

Should show JSON content, not 404.

### Problem: "Applications not registered"

**Cause**: `enabled: false` in config

**Solution**:
```json
{
  "applications": {
    "your-app": {
      "enabled": true  // ← Make sure this is true
    }
  }
}
```

### Problem: "Container not found"

**Cause**: Container ID mismatch

**Solution**:
```javascript
// Check what Single-SPA expects
window.__SINGLE_SPA_DEBUG__.config.applications['your-app'].container.id

// Check what exists in DOM
document.getElementById('expected-container-id')
```

Make sure they match!

### Problem: "Routes not matching"

**Cause**: Route pattern incorrect

**Solution**:
```javascript
// Test route matching
window.__SINGLE_SPA_DEBUG__.routeMatcher.isActive('your-app', window.location)

// If returns false, check your pattern in config:
{
  "routes": {
    "patterns": [
      { "path": "/your-route", "exact": false }
    ]
  }
}
```

### Problem: "Console full of logs"

**Cause**: Development environment

**Solution**: This is normal in development. In production:
```javascript
// Environment auto-detected by hostname
function getEnvironment() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';  // ← Logging enabled
  } else {
    return 'production';   // ← Logging disabled
  }
}
```

Or manually set in config:
```json
{
  "environment": {
    "production": {
      "logging": false  // ← Turn off logging
    }
  }
}
```

---

## 📊 Configuration Schema Reference

### Application Schema

```json
{
  "name": "string (required)",              // Unique identifier
  "displayName": "string (optional)",       // User-friendly name
  "module": "string (required)",            // SystemJS module name
  "type": "fullpage|embedded (required)",   // MFE type
  "enabled": "boolean (required)",          // Feature flag
  "routes": {
    "type": "hash|path (required)",
    "patterns": [
      {
        "path": "string (required)",        // Route pattern
        "exact": "boolean (optional)",      // Exact match?
        "exclude": ["string"] // (optional) // Exclude patterns
      }
    ]
  },
  "container": {
    "id": "string (required)",              // DOM container ID
    "insertPosition": "string (optional)",  // Where to insert
    "insertTarget": "string (optional)"     // Insert target selector
  },
  "customProps": {                           // Custom properties
    "key": "value"                          // Passed to MFE
  }
}
```

### Full Example

```json
{
  "version": "1.0.0",
  "description": "My MFE Configuration",
  "applications": {
    "my-mfe": {
      "name": "my-mfe",
      "displayName": "My Micro-Frontend",
      "module": "my-mfe-module",
      "type": "fullpage",
      "enabled": true,
      "routes": {
        "type": "hash",
        "patterns": [
          { 
            "path": "/my-route", 
            "exact": false,
            "exclude": ["/admin"]
          }
        ]
      },
      "container": {
        "id": "my-mfe-container",
        "insertPosition": "afterbegin",
        "insertTarget": "body"
      },
      "customProps": {
        "apiUrl": "https://api.example.com",
        "theme": "dark",
        "features": ["feature1", "feature2"]
      }
    }
  },
  "containers": {
    "managed": [
      {
        "id": "my-mfe-container",
        "description": "Container for my MFE",
        "alwaysPresent": false
      }
    ]
  },
  "environment": {
    "development": {
      "logging": true,
      "debug": true,
      "performanceMonitoring": false
    },
    "production": {
      "logging": false,
      "debug": false,
      "performanceMonitoring": true
    }
  }
}
```

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Backup current `microfrontend-config.REFACTORED.js`
- [ ] Review new files (`mfe-registry.json`, `microfrontend-config.PRODUCTION.js`)
- [ ] Understand configuration schema
- [ ] Plan testing approach

### Migration
- [ ] Verify new files exist in correct locations
- [ ] Update `index.html` script reference
- [ ] Configure `mfe-registry.json` with your MFEs
- [ ] Test locally

### Validation
- [ ] All AngularJS routes work
- [ ] All Angular MFE routes work
- [ ] Header/footer display correctly
- [ ] Navigation works smoothly
- [ ] No console errors
- [ ] Debug API accessible (development)

### Post-Migration
- [ ] Deploy to staging environment
- [ ] Test in staging
- [ ] Monitor logs and performance
- [ ] Deploy to production
- [ ] Monitor production metrics
- [ ] Remove old files (optional)

---

## 🎯 Next Steps

### 1. Customize Your Configuration

Edit `app/config/mfe-registry.json`:
- Update route patterns
- Add/remove MFEs
- Configure environment settings
- Set feature flags

### 2. Add New MFEs

```json
{
  "applications": {
    "new-feature": {
      "name": "new-feature",
      "module": "new-feature-module",
      "enabled": true,
      "routes": {
        "patterns": [{ "path": "/new-feature" }]
      },
      "container": { "id": "new-feature-container" }
    }
  }
}
```

That's it! No JavaScript changes needed.

### 3. Environment-Specific Configs

**Development**:
```json
{
  "environment": {
    "development": {
      "logging": true,
      "debug": true,
      "apiUrl": "http://localhost:3000"
    }
  }
}
```

**Production**:
```json
{
  "environment": {
    "production": {
      "logging": false,
      "debug": false,
      "apiUrl": "https://api.production.com"
    }
  }
}
```

### 4. Monitor and Optimize

- Use `window.__SINGLE_SPA_DEBUG__` in development
- Check application load times in console
- Monitor error rates
- Optimize based on metrics

---

## 📚 Resources

- **Configuration File**: `app/config/mfe-registry.json`
- **Loader Script**: `app/microfrontend-config.PRODUCTION.js`
- **Architecture Doc**: `PRODUCTION_ARCHITECTURE.md`
- **Debug API**: `window.__SINGLE_SPA_DEBUG__` (development only)

---

**Congratulations! 🎉** You've migrated to a production-ready, scalable configuration-driven architecture.

**Questions?** Check the troubleshooting section or review the architecture documentation.

