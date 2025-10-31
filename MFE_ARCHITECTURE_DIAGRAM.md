# Micro-Frontend (MFE) Architecture Diagram
**Complete Visual Representation of Angular-in-AngularJS Migration Architecture**

---

## 🏗️ High-Level Architecture Overview

```mermaid
graph TB
    subgraph Browser["🌐 Browser Environment"]
        subgraph AngularJS_Host["📱 AngularJS Host Application<br/>(Legacy Container)"]
            Nav["🧭 Navigation<br/>(AngularJS Router)"]
            Header["📋 Header Component<br/>(AngularJS)"]
            Footer["📋 Footer Component<br/>(AngularJS)"]
            
            subgraph Containers["📦 DOM Containers"]
                ViewContainer["view-container<br/>(AngularJS Routes)"]
                AngularMFE_Container["angular-mfe-container<br/>(Full-Page Angular MFE)"]
                EUI_Container["eui-mfe-container<br/>(Full-Page EUI MFE)"]
                Embedded_Container["eui-embedded-container<br/>(Embedded Angular)"]
            end
        end
        
        subgraph Integration["🔗 Integration Layer"]
            SingleSPA["⚙️ Single-SPA<br/>(Orchestrator)"]
            SystemJS["📦 SystemJS<br/>(Module Loader)"]
            ImportMap["🗺️ Import Map<br/>(Module Resolution)"]
        end
        
        subgraph Angular_MFEs["⚡ Angular Micro-Frontends"]
            AngularMFE["Angular MFE<br/>(localhost:4200)<br/>Phone List/Detail"]
            EUI_MFE["EUI Desktop MFE<br/>(localhost:4300)<br/>Modern UI Components"]
        end
    end
    
    subgraph DevServers["🖥️ Development Servers"]
        Webpack4200["Webpack Dev Server :4200<br/>(Angular MFE)"]
        Webpack4300["Webpack Dev Server :4300<br/>(EUI MFE)"]
    end
    
    Browser -->|HTTP Requests| DevServers
    SingleSPA -->|Route Detection| Nav
    SingleSPA -->|Lifecycle Management| Angular_MFEs
    SystemJS -->|Dynamic Loading| Angular_MFEs
    ImportMap -->|Module Resolution| SystemJS
    Angular_MFEs -->|Render| Containers
    Nav -->|Route Changes| SingleSPA
    
    style AngularJS_Host fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px
    style Angular_MFEs fill:#4ecdc4,stroke:#0c8599,stroke-width:2px
    style Integration fill:#ffe066,stroke:#fab005,stroke-width:2px
    style SingleSPA fill:#ff9800,stroke:#e65100,stroke-width:3px
```

---

## 🌊 Runtime Flow: Request to Render

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AngularJS_Router as AngularJS Router
    participant SingleSPA
    participant SystemJS
    participant Webpack as Webpack Dev Server
    participant Angular_MFE as Angular MFE
    participant DOM as DOM Container
    
    User->>Browser: Navigate to /#!/angular-phone-list
    Browser->>AngularJS_Router: Route change detected
    AngularJS_Router->>Browser: Update URL hash
    Browser->>SingleSPA: Hash change event
    
    SingleSPA->>SingleSPA: Check activeWhen() functions
    SingleSPA->>SingleSPA: Match route: angular-phone-list
    SingleSPA->>SingleSPA: Find registered app: 'angular-mfe'
    
    alt MFE Not Loaded
        SingleSPA->>SystemJS: Import 'angular-mfe'
        SystemJS->>ImportMap: Resolve module URL
        ImportMap-->>SystemJS: http://localhost:4200/main.js
        SystemJS->>Webpack: Fetch module bundle
        Webpack-->>SystemJS: Return JavaScript bundle
        SystemJS-->>SingleSPA: Export lifecycle functions
    end
    
    SingleSPA->>Angular_MFE: bootstrap()
    Angular_MFE-->>SingleSPA: Bootstrap complete
    
    SingleSPA->>Angular_MFE: mount({ domElementGetter })
    Angular_MFE->>DOM: Get container element
    DOM-->>Angular_MFE: Return #angular-mfe-container
    Angular_MFE->>DOM: Clear & create <app-root>
    Angular_MFE->>Angular_MFE: Bootstrap Angular application
    Angular_MFE->>DOM: Render Angular component
    Angular_MFE-->>SingleSPA: Mount complete
    
    User->>Browser: Interact with component
    Browser->>Angular_MFE: Handle user events
    
    Note over User,DOM: User navigates away
    
    Browser->>SingleSPA: Route change detected
    SingleSPA->>Angular_MFE: unmount()
    Angular_MFE->>DOM: Cleanup & destroy component
    Angular_MFE-->>SingleSPA: Unmount complete
```

---

## 🔄 Component Lifecycle Management

```mermaid
stateDiagram-v2
    [*] --> NotRegistered: Application Not Loaded
    
    NotRegistered --> Loading: Route matches activeWhen()
    Loading --> Bootstrapped: bootstrap() completes
    Bootstrapped --> Mounted: mount() executes
    Mounted --> Active: Component rendered
    
    Active --> Unmounting: Route changes away
    Unmounting --> Bootstrapped: unmount() completes
    
    Bootstrapped --> Loading: Route matches again (remount)
    Bootstrapped --> [*]: Application removed
    
    note right of Loading
        SystemJS loads module
        Webpack serves bundle
        Module exports lifecycle
    end note
    
    note right of Mounted
        DOM element cleared
        Angular bootstrap
        Component renders
    end note
    
    note right of Unmounting
        Component cleanup
        Destroy Angular app
        Clear DOM references
    end note
```

---

## 🗺️ Route-Based Activation Matrix

```mermaid
graph LR
    subgraph Routes["📍 Route Patterns"]
        R1["/phones<br/>/phones/:id"]
        R2["/angular-page<br/>/angular-phone-list<br/>/angular-phone-detail/:id"]
        R3["/eui"]
        R4["/dashboard<br/>/reports"]
    end
    
    subgraph Activation["🎯 Activation Rules"]
        A1["AngularJS Routes<br/>Shows: view-container"]
        A2["Angular MFE<br/>Shows: angular-mfe-container"]
        A3["EUI Desktop MFE<br/>Shows: eui-mfe-container"]
        A4["AngularJS + Embedded<br/>Shows: view-container +<br/>eui-embedded-container"]
    end
    
    subgraph Containers["📦 DOM Containers"]
        C1["view-container<br/>(ng-view)"]
        C2["angular-mfe-container"]
        C3["eui-mfe-container"]
        C4["eui-embedded-container"]
    end
    
    R1 -->|Matches| A1
    R2 -->|Matches| A2
    R3 -->|Matches| A3
    R4 -->|Matches| A4
    
    A1 --> C1
    A2 --> C2
    A3 --> C3
    A4 --> C1
    A4 --> C4
    
    style R1 fill:#ff6b6b,stroke:#c92a2a
    style R2 fill:#4ecdc4,stroke:#0c8599
    style R3 fill:#4ecdc4,stroke:#0c8599
    style R4 fill:#93c5fd,stroke:#1e40af
```

---

## 📡 Cross-Framework Communication

```mermaid
graph TB
    subgraph AngularJS_World["🔴 AngularJS Host"]
        AngularJS_Comp["AngularJS Components"]
        AngularJS_Scope["$rootScope"]
        AngularJS_Location["$location Service"]
        EventListener["window.addEventListener<br/>('angular-to-angularjs')"]
    end
    
    subgraph Communication["📨 Communication Channel"]
        CustomEvents["Custom DOM Events<br/>(window.dispatchEvent)"]
        SharedState["Shared State<br/>(window object)"]
        URL_Hash["URL Hash<br/>(Browser navigation)"]
    end
    
    subgraph Angular_World["🟢 Angular Micro-Frontends"]
        Angular_Comp["Angular Components"]
        Angular_Service["Angular Services"]
        EventEmitter["Event Emitter<br/>(window.dispatchEvent)"]
    end
    
    Angular_Comp -->|1. User Action| EventEmitter
    EventEmitter -->|2. Dispatch Event| CustomEvents
    CustomEvents -->|3. Event Received| EventListener
    EventListener -->|4. Process Action| AngularJS_Location
    
    AngularJS_Comp -->|Navigate| URL_Hash
    URL_Hash -->|Route Change| Angular_Comp
    
    AngularJS_Comp -.->|Shared Data| SharedState
    Angular_Comp -.->|Read Data| SharedState
    
    style AngularJS_World fill:#ff6b6b,stroke:#c92a2a
    style Angular_World fill:#4ecdc4,stroke:#0c8599
    style Communication fill:#ffe066,stroke:#fab005
```

---

## 🔌 Single-SPA Application Registration

```mermaid
graph TD
    Start[Browser Loads index.html] --> LoadSystemJS[Load SystemJS]
    LoadSystemJS --> LoadImportMap[Load Import Map]
    
    LoadImportMap --> Config{
        Import Map Config
    }
    
    Config -->|single-spa| CDN1[CDN: single-spa.min.js]
    Config -->|angular-mfe| Local1[localhost:4200/main.js]
    Config -->|eui-desktop| Local2[localhost:4300/main.js]
    
    LoadSystemJS --> LoadConfig[Load microfrontend-config.js]
    
    LoadConfig --> Register1[Register 'angular-mfe']
    LoadConfig --> Register2[Register 'eui-desktop']
    LoadConfig --> Register3[Register 'eui-embedded-*']
    
    Register1 --> ActiveWhen1{
        activeWhen:<br/>hash.includes<br/>('angular-phone-list')
    }
    
    Register2 --> ActiveWhen2{
        activeWhen:<br/>hash.includes('eui')
    }
    
    Register3 --> ActiveWhen3{
        activeWhen:<br/>hash.includes('phones'/<br/>'dashboard'/'reports')
    }
    
    ActiveWhen1 -->|True| Mount1[Load & Mount Angular MFE]
    ActiveWhen2 -->|True| Mount2[Load & Mount EUI MFE]
    ActiveWhen3 -->|True| Mount3[Load & Mount Embedded]
    
    Register1 --> StartSPA[Start Single-SPA]
    Register2 --> StartSPA
    Register3 --> StartSPA
    
    StartSPA --> Monitor[Monitor Route Changes]
    
    style Register1 fill:#4ecdc4,stroke:#0c8599
    style Register2 fill:#4ecdc4,stroke:#0c8599
    style Register3 fill:#93c5fd,stroke:#1e40af
    style StartSPA fill:#ff9800,stroke:#e65100,stroke-width:3px
```

---

## 📦 Module Loading & Bundle Structure

```mermaid
graph TB
    subgraph HostApp["🏠 AngularJS Host App"]
        IndexHTML[index.html]
        ConfigJS[microfrontend-config.js]
        AppModule[app.module.js]
        Routes[app.config.js]
    end
    
    subgraph SystemJS_Layer["📦 SystemJS Layer"]
        ImportMap["Import Map<br/>{<br/>  'single-spa': CDN,<br/>  'angular-mfe': :4200,<br/>  'eui-desktop': :4300<br/>}"]
        ModuleLoader[System.import()]
    end
    
    subgraph Angular_MFE_4200["⚡ Angular MFE (Port 4200)"]
        Webpack1[Webpack Dev Server]
        Entry1[main.single-spa.ts]
        Bundle1[main.js<br/>System Module Format]
        Components1[Angular Components]
    end
    
    subgraph EUI_MFE_4300["🎨 EUI Desktop MFE (Port 4300)"]
        Webpack2[Webpack Dev Server]
        Entry2[main.single-spa.ts]
        Bundle2[main.js<br/>System Module Format]
        Components2[EUI Components]
    end
    
    IndexHTML -->|Loads| ConfigJS
    IndexHTML -->|Contains| ImportMap
    ConfigJS -->|Uses| ModuleLoader
    ModuleLoader -->|Resolves via| ImportMap
    
    ImportMap -->|'angular-mfe'| Bundle1
    ImportMap -->|'eui-desktop'| Bundle2
    
    Webpack1 -->|Serves| Bundle1
    Webpack2 -->|Serves| Bundle2
    
    Entry1 -->|Compiles to| Bundle1
    Entry2 -->|Compiles to| Bundle2
    
    Bundle1 -->|Exports| Lifecycle1[bootstrap, mount, unmount]
    Bundle2 -->|Exports| Lifecycle2[bootstrap, mount, unmount]
    
    style HostApp fill:#ff6b6b,stroke:#c92a2a
    style Angular_MFE_4200 fill:#4ecdc4,stroke:#0c8599
    style EUI_MFE_4300 fill:#93c5fd,stroke:#1e40af
    style SystemJS_Layer fill:#ffe066,stroke:#fab005
```

---

## 🎯 Complete Integration Flow

```mermaid
flowchart TD
    Start([User Opens Browser]) --> Load[Load index.html]
    
    Load --> InitAngularJS[Initialize AngularJS App]
    Load --> LoadSystemJS[Load SystemJS & Import Map]
    Load --> LoadSingleSPA[Load Single-SPA Config]
    
    InitAngularJS --> RenderHeader[Render Header Component]
    InitAngularJS --> RenderFooter[Render Footer Component]
    InitAngularJS --> InitRouter[Initialize AngularJS Router]
    
    LoadSingleSPA --> RegisterApps[Register All Micro-Frontends]
    
    RegisterApps --> RegisterAngular[Register 'angular-mfe']
    RegisterApps --> RegisterEUI[Register 'eui-desktop']
    RegisterApps --> RegisterEmbedded[Register 'eui-embedded-*']
    
    RegisterAngular --> StartSPA[Start Single-SPA]
    RegisterEUI --> StartSPA
    RegisterEmbedded --> StartSPA
    
    StartSPA --> MonitorRoutes[Monitor Route Changes]
    
    MonitorRoutes --> UserAction{User Navigates}
    
    UserAction -->|#!/phones| Route1[AngularJS Route]
    UserAction -->|#!/angular-phone-list| Route2[Angular MFE Route]
    UserAction -->|#!/eui| Route3[EUI MFE Route]
    UserAction -->|#!/dashboard| Route4[Embedded Route]
    
    Route1 --> ShowAngularJS[Show AngularJS Component]
    Route1 --> HideMFEs[Hide All MFE Containers]
    
    Route2 --> CheckLoaded1{Angular MFE<br/>Loaded?}
    CheckLoaded1 -->|No| LoadMFE1[SystemJS.import angular-mfe]
    CheckLoaded1 -->|Yes| MountMFE1
    LoadMFE1 --> MountMFE1[Mount Angular MFE]
    MountMFE1 --> HideAngularJS[Hide AngularJS View]
    MountMFE1 --> ShowMFE1[Show angular-mfe-container]
    
    Route3 --> CheckLoaded2{EUI MFE<br/>Loaded?}
    CheckLoaded2 -->|No| LoadMFE2[SystemJS.import eui-desktop]
    CheckLoaded2 -->|Yes| MountMFE2
    LoadMFE2 --> MountMFE2[Mount EUI MFE]
    MountMFE2 --> HideAngularJS
    MountMFE2 --> ShowMFE2[Show eui-mfe-container]
    
    Route4 --> CheckLoaded3{Embedded MFE<br/>Loaded?}
    CheckLoaded4 -->|No| LoadMFE3[SystemJS.import eui-desktop]
    CheckLoaded3 -->|Yes| MountMFE3
    LoadMFE3 --> MountMFE3[Mount Embedded MFE]
    MountMFE3 --> ShowAngularJS
    MountMFE3 --> ShowMFE3[Show embedded-container]
    
    ShowAngularJS --> UserInteracts([User Interacts])
    ShowMFE1 --> UserInteracts
    ShowMFE2 --> UserInteracts
    ShowMFE3 --> UserInteracts
    
    UserInteracts --> NavigateAway{User Navigates<br/>Away?}
    NavigateAway -->|Yes| Unmount[Unmount Active MFE]
    NavigateAway -->|No| UserInteracts
    
    Unmount --> MonitorRoutes
    
    style Start fill:#4ecdc4,stroke:#0c8599
    style StartSPA fill:#ff9800,stroke:#e65100,stroke-width:3px
    style Route2 fill:#4ecdc4,stroke:#0c8599
    style Route3 fill:#4ecdc4,stroke:#0c8599
    style Route4 fill:#93c5fd,stroke:#1e40af
    style Route1 fill:#ff6b6b,stroke:#c92a2a
```

---

## 🏛️ Project Structure with MFE Integration

```
angular-phonecat/
│
├── 📱 AngularJS Host Application
│   ├── app/
│   │   ├── index.html                 # ← SystemJS, Import Map, Containers
│   │   ├── app.module.js              # ← Event listeners for cross-framework comm
│   │   ├── app.config.js              # ← Route definitions
│   │   ├── microfrontend-config.js    # ← Single-SPA registration
│   │   ├── phone-list/                # ← Legacy AngularJS components
│   │   ├── phone-detail/              # ← Legacy AngularJS components
│   │   └── dashboard/                 # ← AngularJS with embedded MFE
│   │
│   └── lib/                           # ← AngularJS dependencies
│
├── ⚡ Angular Micro-Frontend (Port 4200)
│   └── angular-mfe/
│       ├── src/
│       │   ├── main.single-spa.ts     # ← bootstrap, mount, unmount
│       │   └── app/
│       │       ├── app.component.ts   # ← Root component
│       │       └── phone-list/        # ← Modern Angular components
│       ├── webpack.config.js          # ← System module format
│       └── dist/                      # ← Built bundles
│
├── 🎨 EUI Desktop Micro-Frontend (Port 4300)
│   └── eui-ng-microfrontend/
│       ├── src/
│       │   ├── main.single-spa.ts     # ← bootstrap, mount, unmount
│       │   └── app/                   # ← EUI components
│       ├── webpack.single-spa.config.js
│       └── dist/
│
└── 🌐 Browser Runtime
    ├── SystemJS Import Map
    │   ├── single-spa → CDN
    │   ├── angular-mfe → localhost:4200
    │   └── eui-desktop → localhost:4300
    │
    ├── Single-SPA Orchestrator
    │   ├── Route Monitoring
    │   ├── Lifecycle Management
    │   └── Application Registry
    │
    └── DOM Containers
        ├── #angular-mfe-container
        ├── #eui-mfe-container
        ├── #eui-embedded-container
        └── .view-container (AngularJS)
```

---

## 🎨 Visual Component Hierarchy

```mermaid
graph TD
    BrowserWindow[Browser Window] --> AngularJSApp[AngularJS Application]
    
    AngularJSApp --> Header[Header Component<br/>Always Visible]
    AngularJSApp --> ContentArea[Content Area<br/>Dynamic Based on Route]
    AngularJSApp --> Footer[Footer Component<br/>Always Visible]
    
    ContentArea --> RouteCheck{Route Type?}
    
    RouteCheck -->|AngularJS Route| AngularJSView[AngularJS View Container<br/>phone-list, phone-detail, etc.]
    RouteCheck -->|Angular MFE Route| AngularMFE_Container[Angular MFE Container<br/>Angular 15+ Components]
    RouteCheck -->|EUI Route| EUIContainer[EUI MFE Container<br/>EUI Components]
    RouteCheck -->|Embedded Route| HybridView[Hybrid View<br/>AngularJS + Embedded Angular]
    
    AngularJSView --> PhoneList1[Phone List Component<br/>AngularJS]
    AngularJSView --> PhoneDetail1[Phone Detail Component<br/>AngularJS]
    
    AngularMFE_Container --> AppRoot1[app-root<br/>Angular Component]
    AppRoot1 --> PhoneList2[Phone List Component<br/>Angular 15+]
    
    EUIContainer --> AppRoot2[app-root<br/>Angular Component]
    AppRoot2 --> EUIComponents[EUI Components<br/>Modern UI]
    
    HybridView --> DashboardComp[Dashboard Component<br/>AngularJS]
    HybridView --> EmbeddedMFE[Embedded Container<br/>Angular Component]
    
    style AngularJSApp fill:#ff6b6b,stroke:#c92a2a
    style AngularMFE_Container fill:#4ecdc4,stroke:#0c8599
    style EUIContainer fill:#4ecdc4,stroke:#0c8599
    style HybridView fill:#93c5fd,stroke:#1e40af
```

---

## 📊 Migration Strategy Visualization

```mermaid
gantt
    title Micro-Frontend Migration Timeline
    dateFormat YYYY-MM-DD
    section Foundation
    Single-SPA Setup           :done, foundation1, 2024-01-01, 2w
    SystemJS Configuration     :done, foundation2, after foundation1, 1w
    Angular MFE Scaffold       :done, foundation3, after foundation2, 1w
    section Phase 1
    Phone List Migration       :done, phase1-1, after foundation3, 2w
    Phone Detail Migration     :done, phase1-2, after phase1-1, 2w
    section Phase 2
    EUI Integration            :done, phase2-1, after phase1-2, 2w
    Embedded Components        :done, phase2-2, after phase2-1, 2w
    section Phase 3
    Dashboard Migration        :active, phase3-1, 2024-03-01, 3w
    Reports Migration          :phase3-2, after phase3-1, 3w
    section Future
    Additional Components      :future, phase4-1, after phase3-2, 4w
    Complete Migration         :future, phase4-2, after phase4-1, 12w
```

---

## 🔍 Key Integration Points

| Integration Point | Technology | Purpose |
|------------------|------------|---------|
| **Module Loading** | SystemJS | Dynamic loading of Angular bundles |
| **Module Resolution** | Import Maps | URL mapping for module names |
| **Lifecycle Management** | Single-SPA | Mount/unmount coordination |
| **Route Detection** | Hash-based routing | AngularJS hash + Single-SPA activeWhen |
| **DOM Mounting** | Container Elements | Isolated rendering spaces |
| **Communication** | Custom Events | Cross-framework messaging |
| **State Sharing** | Window object | Shared data between frameworks |
| **Asset Loading** | Webpack Dev Server | Development-time asset serving |

---

## ✅ Benefits Visualization

```mermaid
mindmap
  root((Micro-Frontend<br/>Architecture))
    Gradual Migration
      Zero Downtime
      Incremental Updates
      Risk Reduction
    Modern Development
      TypeScript
      Latest Angular
      Modern Tooling
    Independent Deployment
      Separate Builds
      Version Control
      Team Autonomy
    Technology Evolution
      Framework Updates
      Performance Isolation
      Future-Proof
```

---

*This diagram provides a comprehensive visual guide to the micro-frontend architecture, showing how modern Angular components integrate seamlessly with legacy AngularJS applications using Single-SPA orchestration.*

