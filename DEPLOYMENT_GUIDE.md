# Microfrontend Deployment Guide

## Overview
This guide covers deployment strategies, cookie sharing, and security considerations for the AngularJS + Angular microfrontend architecture.

---

## 🚀 **Recommended Deployment Architecture**

### **Same Domain Deployment (Best Practice)**

```
Production Domain: https://myapp.com

├── /                           → AngularJS Host Application
│   ├── index.html
│   ├── app/
│   └── lib/
│
└── /assets/mfe/               → Angular Microfrontend
    ├── main.js
    ├── polyfills.js
    └── styles.css
```

**Configuration:**
```javascript
// AngularJS: app/microfrontend-config.js
registerApplication({
  name: 'eui-desktop',
  app: () => System.import('/assets/mfe/main.js'),  // Same domain!
  activeWhen: location => location.hash.startsWith('#!/eui')
});
```

**Benefits:**
- ✅ **Cookies fully shared** - Same origin, same cookies
- ✅ **No CORS issues** - All resources from same domain
- ✅ **Simple configuration** - No special headers needed
- ✅ **Better security** - Single security boundary
- ✅ **Better performance** - No preflight requests

---

## 🍪 **Cookie Sharing Explained**

### **Browser Cookie Rules**

| Scenario | AngularJS | Angular MFE | Cookies Shared? |
|----------|-----------|-------------|-----------------|
| `https://myapp.com` | `https://myapp.com/assets/mfe/` | ✅ **YES** - Same origin |
| `https://app.mycompany.com` | `https://mfe.mycompany.com` | ⚠️ **PARTIAL** - Needs `Domain=.mycompany.com` |
| `https://myapp.com` | `https://cdn.other.com` | ❌ **NO** - Different origins |

### **What "Same Origin" Means**

Same origin requires:
1. **Same protocol** (both https://)
2. **Same domain** (both myapp.com)
3. **Same port** (both :443 for https)

Path doesn't matter: `/` and `/assets/mfe/` are **same origin**

---

## 📦 **Deployment Steps**

### **Step 1: Build Angular MFE**

```bash
cd eui-ng-microfrontend
npm run build-dev  # For development
# OR
npm run build-prod # For production
```

Output: `eui-ng-microfrontend/dist/browser/`

### **Step 2: Deploy to Web Server**

#### **Option A: Nginx (Recommended)**

```nginx
server {
    listen 443 ssl;
    server_name myapp.com;
    
    # AngularJS Host
    root /var/www/angularjs-app;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Angular MFE - served from same domain
    location /assets/mfe/ {
        alias /var/www/angular-mfe/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy (if needed)
    location /api/ {
        proxy_pass http://backend:8080/;
        proxy_set_header Cookie $http_cookie;
    }
}
```

#### **Option B: Apache**

```apache
<VirtualHost *:443>
    ServerName myapp.com
    DocumentRoot /var/www/angularjs-app
    
    # AngularJS Host
    <Directory /var/www/angularjs-app>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Angular MFE alias
    Alias /assets/mfe /var/www/angular-mfe
    <Directory /var/www/angular-mfe>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
```

### **Step 3: Update MFE Configuration**

```javascript
// AngularJS: app/microfrontend-config.js
const MFE_BASE_URL = window.location.origin; // Use same domain

registerApplication({
  name: 'eui-desktop',
  app: () => System.import(`${MFE_BASE_URL}/assets/mfe/main.js`),
  activeWhen: location => location.hash.startsWith('#!/eui')
});
```

---

## 🔐 **Cookie Security Best Practices**

### **Set Secure Cookie Flags**

When setting cookies (backend), use:

```javascript
// Backend API response
Set-Cookie: sessionId=abc123; 
            Path=/; 
            HttpOnly;           // Prevents JavaScript access
            Secure;             // HTTPS only
            SameSite=Strict;    // CSRF protection
```

### **Cookie Access in Code**

Both AngularJS and Angular access cookies the same way:

```javascript
// AngularJS
document.cookie; // Read cookies

// Angular
document.cookie; // Read cookies (also shared!)
```

**Important:** 
- Cookies with `HttpOnly` flag **cannot** be accessed by JavaScript
- This is **good for security** (protects session tokens)
- Use API calls for sensitive operations

---

## ⚠️ **Cross-Domain Issues to Avoid**

### **Problem: MFE on CDN**

```
AngularJS: https://myapp.com
MFE:       https://cdn.cloudfront.net/mfe/
```

**Issues:**
1. ❌ Cookies not shared
2. ❌ Authentication breaks
3. ❌ CORS preflight on every request
4. ❌ Can't read/write localStorage from host
5. ❌ Complex security configuration

**Solution:** Don't do this! Use same domain with a path.

---

## 🧪 **Testing Cookie Sharing**

### **Test Script (Browser Console)**

```javascript
// In AngularJS page (#!/phones)
document.cookie = "test=from-angularjs; path=/";
console.log('AngularJS cookies:', document.cookie);

// Navigate to Angular MFE (#!/eui/screen/home)
// Then in console:
console.log('Angular MFE cookies:', document.cookie);

// Should see the same cookies!
```

### **Expected Result (Same Domain):**
```
AngularJS cookies: test=from-angularjs; sessionId=xyz; userId=123
Angular MFE cookies: test=from-angularjs; sessionId=xyz; userId=123
```

---

## 🔄 **Data Sharing Methods**

| Method | Use Case | Domain Requirement |
|--------|----------|-------------------|
| **Cookies** | Authentication, session | Same domain or configured subdomain |
| **LocalStorage** | User preferences, cache | Same origin only |
| **SessionStorage** | Temporary data | Same origin only |
| **Window Events** | Cross-app communication | Any domain (used in this project) |
| **URL Parameters** | Simple data passing | Any domain |

**Our Implementation:**
- ✅ Uses `window` events for data transfer (works across any domain)
- ✅ Cookies for authentication (requires same domain)

---

## 📋 **Deployment Checklist**

### **Before Deployment:**
- [ ] Build Angular MFE for production (`npm run build-prod`)
- [ ] Update `microfrontend-config.js` with production MFE URL
- [ ] Ensure both apps will be served from same domain
- [ ] Configure web server (Nginx/Apache) to serve both apps
- [ ] Set proper cache headers for MFE assets
- [ ] Configure SSL/TLS certificates

### **After Deployment:**
- [ ] Test authentication/cookies work across both apps
- [ ] Test data transfer (window events) works
- [ ] Test navigation between AngularJS and Angular routes
- [ ] Check browser console for CORS errors
- [ ] Verify localStorage/sessionStorage access
- [ ] Test in different browsers

---

## 🌐 **Multi-Environment Configuration**

```javascript
// environment-config.js
const ENV_CONFIG = {
  development: {
    angularjs: 'http://localhost:8080',
    mfe: 'http://localhost:4300'
  },
  staging: {
    angularjs: 'https://staging.myapp.com',
    mfe: 'https://staging.myapp.com/assets/mfe'
  },
  production: {
    angularjs: 'https://myapp.com',
    mfe: 'https://myapp.com/assets/mfe'
  }
};

// Use relative path in production (automatically same domain)
const MFE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4300/main.js'
  : '/assets/mfe/main.js';  // Relative = same domain!
```

---

## 🎯 **Summary**

### **✅ DO:**
- Deploy both apps to the **same domain** with different paths
- Use relative URLs for MFE in production
- Set secure cookie flags (`HttpOnly`, `Secure`, `SameSite`)
- Test cookie sharing after deployment

### **❌ DON'T:**
- Deploy MFE to a different domain/CDN (authentication will break)
- Use absolute URLs for same-domain resources
- Expose sensitive data in cookies accessible to JavaScript
- Rely on cookies for cross-domain data transfer

---

**🎉 Follow this guide and your cookies, authentication, and data sharing will work seamlessly in production!**

