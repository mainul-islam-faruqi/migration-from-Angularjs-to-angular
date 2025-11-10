# Container Lifecycle Management Analysis
**Refactoring from CSS-based hiding to proper DOM lifecycle**

---

## 🔴 Current Problem (Hacky Approach)

### What's Wrong:
```javascript
// ❌ BAD: CSS-based visibility management
function updateVisibility() {
  if (location.hash.includes('eui')) {
    viewContainer.style.display = 'none';  // Still in DOM!
    euiContainer.style.display = 'block';  // Just hidden, not removed
  }
}
```

### Issues:

1. **Memory Leaks**
   - Components stay mounted even when hidden
   - Event listeners remain active
   - Observers/subscriptions not cleaned up
   - Memory usage grows over time

2. **Performance Problems**
   - Hidden components still run change detection
   - DOM nodes consume memory even when invisible
   - Browser must maintain all elements in memory

3. **Lifecycle Confusion**
   - Single-SPA calls `unmount()` but component stays in DOM
   - Hard to reason about component state
   - Debugging becomes difficult

4. **Accessibility Issues**
   - Screen readers may still access hidden elements
   - Focus traps can occur
   - Tab navigation may hit hidden elements

5. **Testing Challenges**
   - Hard to test if components are actually unmounted
   - Memory leak tests fail
   - Component state persists between tests

---

## ✅ Proper Solution (Single-SPA Lifecycle)

### Key Principles:

1. **Single-SPA Controls Lifecycle**
   - `mount()` → Component enters DOM
   - `unmount()` → Component removed from DOM
   - Containers created/destroyed dynamically

2. **DOM Reflects State**
   - Active containers exist in DOM
   - Inactive containers removed from DOM
   - No hidden elements

3. **Proper Cleanup**
   - When unmounted, container is removed
   - Memory is freed
   - Event listeners destroyed

---

## 🏗️ Refactored Architecture

### Container Registry Pattern

```javascript
const containerRegistry = {
  containers: new Map(),
  
  getOrCreateContainer(id, shouldExist) {
    // Create only when needed
    if (shouldExist && !container) {
      container = document.createElement('div');
      // Add to DOM
    }
    
    // Remove when not needed
    if (!shouldExist && container) {
      container.remove();  // ✅ Proper cleanup!
      containers.delete(id);
    }
  }
};
```

### Benefits:

1. **Dynamic Container Management**
   - Containers created only when route matches
   - Containers removed when route changes
   - DOM reflects actual state

2. **Proper Lifecycle Hooks**
   ```javascript
   window.addEventListener('single-spa:routing-event', () => {
     // Update containers after routing
     containerRegistry.updateContainers(window.location);
   });
   ```

3. **Single Source of Truth**
   - Route determines which containers exist
   - No CSS state management
   - Clear, predictable behavior

---

## 📊 Comparison

| Aspect | Current (CSS Hide) | Refactored (DOM Lifecycle) |
|--------|-------------------|----------------------------|
| **DOM Nodes** | All containers always exist | Only active containers exist |
| **Memory** | All apps loaded in memory | Only active apps in memory |
| **Performance** | Hidden apps still run | Unmounted apps fully stopped |
| **Lifecycle** | Confusing (unmounted but in DOM) | Clear (unmounted = removed) |
| **Debugging** | Hard (what's actually active?) | Easy (what's in DOM = active) |
| **Memory Leaks** | Likely (event listeners persist) | Prevented (proper cleanup) |
| **Accessibility** | Issues (hidden but accessible) | Proper (removed from DOM) |
| **Testing** | Difficult | Straightforward |

---

## 🔄 Migration Path

### Step 1: Remove CSS-based visibility

```javascript
// ❌ Remove this
function updateVisibility() {
  container.style.display = 'none';
}
```

### Step 2: Implement container registry

```javascript
// ✅ Add this
const containerRegistry = {
  getOrCreateContainer(id, shouldExist) {
    // Dynamic creation/removal
  }
};
```

### Step 3: Hook into Single-SPA events

```javascript
// ✅ Update containers based on route
window.addEventListener('single-spa:routing-event', () => {
  containerRegistry.updateContainers(window.location);
});
```

### Step 4: Update index.html

```html
<!-- ❌ Remove static containers -->
<!-- <div id="angular-mfe-container"></div> -->
<!-- <div id="eui-mfe-container"></div> -->
<!-- <div id="eui-embedded-container"></div> -->

<!-- ✅ Containers created dynamically by containerRegistry -->
```

---

## 🎯 Best Practices

### 1. **Let Single-SPA Manage Lifecycle**
```javascript
activeWhen: (location) => {
  // Return true only when route matches
  // Single-SPA handles mount/unmount
}
```

### 2. **Create Containers Just-in-Time**
```javascript
customProps: (name, location) => {
  // Create container right before mounting
  containerRegistry.updateContainers(location);
  return { domElementGetter: () => container };
}
```

### 3. **Remove Containers After Unmount**
```javascript
window.addEventListener('single-spa:routing-event', () => {
  // Clean up inactive containers
  setTimeout(() => {
    containerRegistry.updateContainers(window.location);
  }, 0);
});
```

### 4. **Verify Cleanup**
```javascript
// In unmount() lifecycle
export async function unmount() {
  if (appRef) {
    appRef.destroy();
    appRef = null;
    // Container will be removed by registry
  }
}
```

---

## 🧪 Testing the Refactored Version

### Verify No Memory Leaks:

```javascript
// Test: Navigate between routes multiple times
for (let i = 0; i < 100; i++) {
  navigateTo('/angular-page');
  navigateTo('/phones');
}

// Check: DOM should not grow
console.log(document.body.children.length); // Should be stable
```

### Verify Proper Cleanup:

```javascript
// Before navigation
const containerCount = document.querySelectorAll('[id*="container"]').length;

// Navigate away
navigateTo('/other-route');

// After navigation
const newContainerCount = document.querySelectorAll('[id*="container"]').length;
// Should be different (old containers removed)
```

---

## 📝 Implementation Checklist

- [ ] Remove `updateVisibility()` function
- [ ] Remove CSS `display: none/block` logic
- [ ] Implement `containerRegistry` pattern
- [ ] Update `customProps` to use registry
- [ ] Hook into Single-SPA routing events
- [ ] Remove static containers from index.html (keep only view-container)
- [ ] Test memory usage during navigation
- [ ] Verify proper cleanup in unmount()
- [ ] Update documentation

---

## 🎓 Key Takeaways

1. **CSS hiding is a code smell** in Single-SPA applications
2. **DOM should reflect actual state** - if not active, not in DOM
3. **Single-SPA lifecycle is the source of truth** - respect it
4. **Dynamic container management** is the proper pattern
5. **Proper cleanup prevents memory leaks** and performance issues

---

*This refactoring aligns with Single-SPA best practices and prevents common micro-frontend pitfalls.*

