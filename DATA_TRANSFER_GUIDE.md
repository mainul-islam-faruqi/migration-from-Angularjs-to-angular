# Data Transfer Between AngularJS and Angular MFE

## Overview
This guide explains how data is transferred between the AngularJS host application and the Angular microfrontend (MFE) using **simple window events and storage** following single-spa best practices.

## Key Points

### ✅ **Simple Approach**
- No complex service injection or shared state management
- Uses native browser APIs (`CustomEvent` and `window` storage)
- Works regardless of component load timing

### 📤 **From AngularJS → Angular**

**AngularJS sends data:**
```javascript
var eventDetail = {
  source: 'AngularJS Phone List',
  data: { /* your data */ }
};

// Store for Angular to pick up even if it loads later
window._angularJsToAngularData = eventDetail;
console.log('💾 [STORAGE] Stored data in window._angularJsToAngularData');

// Dispatch event for real-time updates
var event = new CustomEvent('angularjs-to-angular-data', { detail: eventDetail });
window.dispatchEvent(event);
console.log('📡 [EVENT] Dispatched "angularjs-to-angular-data" event');
```

**Angular receives data:**
```typescript
ngOnInit(): void {
  // 1. Check stored data (works even if sent before mount)
  const storedData = (window as any)._angularJsToAngularData;
  if (storedData) {
    console.log('📦 [STORAGE METHOD] Found stored data');
    this.receivedData = storedData.data;
  } else {
    console.log('⚪ No stored data found - waiting for events...');
  }
  
  // 2. Listen for real-time events (if already mounted)
  window.addEventListener('angularjs-to-angular-data', (event: Event) => {
    const detail = (event as CustomEvent).detail;
    console.log('🔔 [EVENT LISTENER] Received real-time event');
    this.receivedData = detail.data;
  });
  
  console.log('🎧 Event listener attached - ready for real-time updates');
}
```

## Implementation Details

### **AngularJS Side**
- **File:** `app/phone-list/phone-list.component.js`
- **Methods:** `sendDataToAngular()`, `sendPhoneToAngular(phone)`
- Stores data in `window._angularJsToAngularData`
- Dispatches `CustomEvent` for real-time updates

### **Angular MFE Side**
- **File:** `eui-ng-microfrontend/src/app/features/home/home.component.ts`
- **Methods:** `checkStoredData()`, `setupEventListener()`
- Checks `window._angularJsToAngularData` on mount
- Listens for `angularjs-to-angular-data` events
- Uses `NgZone.run()` to trigger change detection

## Benefits

1. **⏱️ Timing-Independent:** Works whether Angular loads before or after data is sent
2. **🎯 Simple:** No complex dependency injection or shared services
3. **🔄 Dual Methods:** 
   - **Storage:** For data sent before component exists
   - **Event Listener:** For real-time updates while component is mounted
4. **🔍 Clear Logging:** Console messages clearly show which method is being used
5. **✨ Clean:** Follows single-spa recommendations for inter-app communication

## Testing

### **Test 1: Storage Method** (Data Sent Before Component Loads)

1. Navigate to `#!/phones` in AngularJS
2. Click "📤 Send Data to Angular" or "Send to Angular" next to any phone
3. **Check console - AngularJS side:**
   ```
   💾 [STORAGE] Stored data in window._angularJsToAngularData
   📡 [EVENT] Dispatched "angularjs-to-angular-data" event
   ```
4. Navigate to **EUI Microfrontend → EUI Home**
5. **Check console - Angular side:**
   ```
   📦 [STORAGE METHOD] HomeComponent: Found stored data from AngularJS: {...}
   ✅ Data loaded via STORAGE (sent before component mounted)
   🎧 Event listener attached - ready for real-time updates
   ```
6. Data displays with source showing **(from storage)**

### **Test 2: Event Listener Method** (Real-Time Updates)

1. Navigate to **EUI Microfrontend → EUI Home** FIRST
2. **Check console:**
   ```
   ⚪ No stored data found - waiting for events...
   🎧 Event listener attached - ready for real-time updates
   ```
3. **Open a new tab/window** with `#!/phones`
4. Click "Send to Angular" next to any phone
5. **Return to EUI Home tab**
6. **Check console - data updates automatically:**
   ```
   🔔 [EVENT LISTENER] HomeComponent: Received real-time event from AngularJS: {...}
   ✅ Data updated via EVENT LISTENER (sent while component was mounted)
   ```
7. Data displays with source showing **(real-time event)**

### **Console Logging Reference**

| Icon | Method | Meaning |
|------|--------|---------|
| `💾 [STORAGE]` | AngularJS | Data stored in `window._angularJsToAngularData` |
| `📡 [EVENT]` | AngularJS | CustomEvent dispatched |
| `📦 [STORAGE METHOD]` | Angular | Data loaded from storage (sent before mount) |
| `🔔 [EVENT LISTENER]` | Angular | Data received via event (real-time) |
| `⚪` | Angular | No stored data found |
| `🎧` | Angular | Event listener attached and ready |

## Files Modified

- ✅ `app/phone-list/phone-list.component.js` - Data sender
- ✅ `eui-ng-microfrontend/src/app/features/home/home.component.ts` - Data receiver
- ✅ `eui-ng-microfrontend/src/app/features/home/home.component.html` - Display UI

## Event Format

```typescript
interface DataFromAngularJS {
  source: string;      // e.g., "AngularJS Phone List"
  timestamp: string;   // ISO 8601 timestamp
  data: any;          // Your custom data payload
}
```

---

**✅ Implementation Complete!** Data transfer working between AngularJS host and Angular MFE.
