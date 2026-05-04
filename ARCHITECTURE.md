# AI Emergency Response System - Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER DEVICES (Client Layer)               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Browser / Mobile App                     │ │
│  │  ┌──────────────────────────────────────────────────┐    │ │
│  │  │          Next.js Application (React)             │    │ │
│  │  │  • Home Page                                     │    │ │
│  │  │  • Emergency Report Form                         │    │ │
│  │  │  • First Aid Guide                               │    │ │
│  │  │  • Emergency Dashboard                           │    │ │
│  │  │  • Map Component (Leaflet)                       │    │ │
│  │  └──────────────────────────────────────────────────┘    │ │
│  │                          │                                │ │
│  │  ┌─────────────────────▼─────────────────────┐           │ │
│  │  │  Browser Storage Layer                     │           │ │
│  │  ├─────────────────────────────────────────┤           │ │
│  │  │  • Service Worker (Caching)              │           │ │
│  │  │  • IndexedDB (Offline Reports)           │           │ │
│  │  │  • LocalStorage (User Preferences)       │           │ │
│  │  │  • Geolocation API (GPS)                 │           │ │
│  │  └─────────────────────────────────────────┘           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                    (HTTP/HTTPS Requests)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Server Layer)                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Next.js API Routes (TypeScript)               │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  /api/reports                                    │   │ │
│  │  │  • POST - Create Emergency Report               │   │ │
│  │  │  • GET - Fetch All Reports                      │   │ │
│  │  │  • AI Severity Detection Logic                  │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │       Data Storage (Demo: In-Memory)                  │  │
│  │       Production: MongoDB / PostgreSQL                │  │
│  │                                                        │  │
│  │  Collections:                                         │  │
│  │  • Reports (description, location, timestamp, etc)  │  │
│  │  • Users (optional, for auth)                       │  │
│  │  • Response Teams (optional, for dispatch)          │  │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Online Report Submission Flow

```
┌──────────────┐
│  User Opens  │
│ Report Form  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  User Enters:        │
│  • Description       │
│  • Location (GPS)    │
│  • Photo (optional)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Validate Form       │
│  Input               │
└──────┬───────────────┘
       │ ✓ Valid
       ▼
┌──────────────────────┐
│  Check Network       │
│  Status              │
└──────┬───────────────┘
       │ Online
       ▼
┌──────────────────────────┐
│  POST /api/reports       │
│  with report data        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Backend:                │
│  • Parse request         │
│  • Detect Severity       │
│  • Store in Database     │
│  • Return success        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Frontend:               │
│  • Show "Success"        │
│  • Redirect to Dashboard │
│  • Auto-refresh reports  │
└──────────────────────────┘
```

### Offline Report Submission & Auto-Sync

```
┌──────────────┐
│  User Opens  │
│ Report Form  │
│  (Offline)   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  User Enters:        │
│  • Description       │
│  • Location (GPS)    │
│  • Photo (optional)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Validate Form Input │
└──────┬───────────────┘
       │ ✓ Valid
       ▼
┌──────────────────────┐
│  Check Network       │
│  Status              │
└──────┬───────────────┘
       │ Offline
       ▼
┌──────────────────────────┐
│  Save to IndexedDB:      │
│  • Full report object    │
│  • synced: false flag    │
│  • timestamp             │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Show Message:           │
│  "Report saved offline"  │
└──────┬───────────────────┘
       │
       ▼
    [User regains connection]
       │
       ▼
┌──────────────────────┐
│  Service Worker      │
│  Detects online()    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────┐
│  Trigger Auto-Sync:      │
│  • Get unsynced reports  │
│  • POST each to API      │
│  • Delete after success  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Backend Stores          │
│  and Database Updated    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Dashboard Auto-Updates  │
│  with new reports        │
└──────────────────────────┘
```

## Component Architecture

### Page Components

```
frontend/app/page.tsx (Home)
  ├── Navigation
  ├── Hero Section
  ├── Features Grid
  │   ├── Link to /report
  │   ├── Link to /first-aid
  │   └── Link to /dashboard
  ├── Key Features Section
  ├── CTA Section
  └── Footer

frontend/app/report/page.tsx (Emergency Report)
  ├── Navigation
  ├── Form Container
  │   ├── Description TextArea
  │   ├── Location Capture
  │   │   ├── Get Location Button
  │   │   └── Location Display
  │   ├── Photo Upload Input
  │   └── Submit Button
  ├── Status Indicator (Online/Offline)
  ├── Error Messages
  └── Success Message

frontend/app/first-aid/page.tsx (First Aid)
  ├── Navigation
  ├── Header
  ├── Accordion of Guides
  │   ├── CPR
  │   ├── Bleeding
  │   ├── Burns
  │   ├── Fracture
  │   ├── Choking
  │   ├── Shock
  │   ├── Poisoning
  │   └── Head Injury
  ├── Warning Box
  └── Emergency Numbers

frontend/app/dashboard/page.tsx (Dashboard)
  ├── Navigation
  ├── Stats Cards
  │   ├── Critical Count
  │   ├── Medium Count
  │   ├── Low Count
  │   └── Total Count
  ├── Map Component
  │   └── Leaflet Map with Markers
  ├── Reports List
  │   ├── Severity Badge
  │   ├── Timestamp
  │   ├── Description
  │   ├── Location
  │   └── Status
  └── Refresh Button
```

## State Management Architecture

```
┌─────────────────────────────────┐
│   Global Application State      │
├─────────────────────────────────┤
│ • Online/Offline Status         │
│ • Authenticated User (future)   │
│ • App Theme                     │
└─────────────────────────────────┘
           △
           │
           │ (useContext)
           │
┌──────────┴──────────┐
│                     │
▼                     ▼
┌──────────────┐  ┌──────────────────┐
│ Page-Level   │  │ API/Data Fetch   │
│ State        │  │ State (SWR)      │
│              │  │                  │
│ • Form Data  │  │ • Reports        │
│ • Loading    │  │ • Dashboard Data │
│ • Errors     │  │ • Refresh Trigger│
└──────────────┘  └──────────────────┘
       △                    △
       │                    │
       └────────┬───────────┘
                │
                ▼
         ┌──────────────────┐
         │   Local Storage  │
         ├──────────────────┤
         │ • IndexedDB      │
         │ • Service Worker │
         │ • Browser Cache  │
         └──────────────────┘
```

## API Layer Architecture

```
Client Request
      │
      ▼
┌──────────────────────────┐
│  Next.js Route Handler   │
│  (/api/reports/route.ts) │
├──────────────────────────┤
│ 1. Parse Request         │
│ 2. Validate Input        │
│ 3. Detect Severity       │
│ 4. Process Data          │
│ 5. Store in DB           │
│ 6. Return Response       │
└──────────┬───────────────┘
           │
           ▼
     ┌──────────────┐
     │  Middleware  │
     ├──────────────┤
     │ • CORS       │
     │ • Auth       │
     │ • Validation │
     │ • Logging    │
     └──────┬───────┘
            │
            ▼
    ┌────────────────┐
    │  Controllers   │
    ├────────────────┤
    │ • Create       │
    │ • Read         │
    │ • Update       │
    │ • Delete       │
    └──────┬─────────┘
           │
           ▼
    ┌────────────────────┐
    │  Data Layer        │
    ├────────────────────┤
    │ • In-Memory Array  │
    │   (demo)           │
    │ • MongoDB          │
    │   (production)     │
    └────────────────────┘
```

## Offline & PWA Architecture

```
┌─────────────────────────────────────────────────┐
│         Progressive Web App Layer               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Service Worker (sw.js)                  │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ Events:                             │  │  │
│  │  │ • install - Cache assets           │  │  │
│  │  │ • activate - Cleanup old caches    │  │  │
│  │  │ • fetch - Intercept requests       │  │  │
│  │  │ • sync - Background sync           │  │  │
│  │  │ • message - Inter-process comm     │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Caching Strategy                        │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ • Cache-first (Static assets)      │  │  │
│  │  │ • Network-first (API calls)        │  │  │
│  │  │ • Stale-while-revalidate (Data)   │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Browser Storage                         │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ IndexedDB:                         │  │  │
│  │  │ • Offline Reports                  │  │  │
│  │  │ • Report Metadata                  │  │  │
│  │  │ • Sync Status                      │  │  │
│  │  │                                    │  │  │
│  │  │ LocalStorage:                      │  │  │
│  │  │ • User Preferences                 │  │  │
│  │  │ • Theme Settings                   │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Manifest (manifest.json)                │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ • App name & description           │  │  │
│  │  │ • Icons (192x192, 512x512)         │  │  │
│  │  │ • Start URL & scope                │  │  │
│  │  │ • Display mode (standalone)        │  │  │
│  │  │ • Theme colors                     │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## AI Severity Detection Architecture

```
Emergency Description
         │
         ▼
┌──────────────────────────────┐
│  Text Analysis Module        │
├──────────────────────────────┤
│                              │
│  1. Normalize text           │
│     (lowercase, trim)        │
│                              │
│  2. Search for keywords      │
│     ┌────────────────────┐   │
│     │ HIGH SEVERITY:     │   │
│     │ fire, explosion,   │   │
│     │ crash, accident,   │   │
│     │ critical, severe   │   │
│     └────────────────────┘   │
│     ┌────────────────────┐   │
│     │ MEDIUM SEVERITY:   │   │
│     │ injury, bleeding,  │   │
│     │ fracture, burns    │   │
│     └────────────────────┘   │
│     ┌────────────────────┐   │
│     │ LOW SEVERITY:      │   │
│     │ help, assistance   │   │
│     └────────────────────┘   │
│                              │
│  3. Return severity level    │
│                              │
└────────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Store with       │
    │ Report Record    │
    │                  │
    │ Used for:        │
    │ • Dashboard sort │
    │ • Color coding   │
    │ • Prioritization │
    └──────────────────┘
```

## Map Component Architecture (Leaflet)

```
┌──────────────────────────────────────┐
│     Map Component (map.tsx)          │
├──────────────────────────────────────┤
│                                      │
│  React Effect Hook                   │
│  └─► Initialize Leaflet Map          │
│      └─► Set view (20, 0), zoom: 2   │
│          └─► Add tile layer          │
│              (OpenStreetMap)         │
│                                      │
│  Report List Hook                    │
│  └─► Watch for reports changes       │
│      └─► Clear old markers           │
│          └─► Add new markers:        │
│              ├─► Color by severity   │
│              │   (red/orange/blue)   │
│              ├─► Custom icon HTML    │
│              ├─► Popup with details  │
│              └─► Bind to map         │
│                                      │
│          └─► Fit bounds to all       │
│              emergency locations     │
│                                      │
└──────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│       Client-Side Security              │
├─────────────────────────────────────────┤
│ • Input validation                      │
│ • XSS prevention (React)                │
│ • HTTPS enforcement                     │
│ • Local storage encryption (future)     │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│       API Security                      │
├─────────────────────────────────────────┤
│ • Request validation                    │
│ • Error handling                        │
│ • CORS configuration                    │
│ • Rate limiting (future)                │
│ • Authentication (future)               │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│       Database Security                 │
├─────────────────────────────────────────┤
│ • Data validation                       │
│ • Parameterized queries                 │
│ • User permissions (future)             │
│ • Data encryption at rest (future)      │
└─────────────────────────────────────────┘
```

## Deployment Architecture

### Development
```
Local Machine
    │
    ├─► npm run install:all
    ├─► npm run dev (localhost:3000)
    └─► Service Worker registered
```

### Production
```
                     ┌──────────────────┐
                     │  GitHub Repo     │
                     │  (Source Code)   │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Vercel Deploy   │
                     │  (CI/CD)         │
                     └────────┬─────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌───────────┐  ┌───────────┐  ┌────────────┐
        │  Frontend │  │  Backend  │  │  Static   │
        │  (React)  │  │  (API)    │  │  Files    │
        │  Assets   │  │  Routes   │  │  (CDN)    │
        └───────────┘  └───────────┘  └────────────┘
              │              │              │
              └──────────┬───┴──────────────┘
                         │
                    (Domain)
                         │
                         ▼
                   User's Browser
```

## Performance Optimization Strategy

```
┌────────────────────────────────────────┐
│    Performance Considerations          │
├────────────────────────────────────────┤
│                                        │
│  1. Initial Load                       │
│     • Service Worker caching           │
│     • Code splitting                   │
│     • Tree shaking                     │
│                                        │
│  2. Runtime                            │
│     • React optimization               │
│     • Lazy loading maps                │
│     • Pagination for reports           │
│                                        │
│  3. Offline                            │
│     • IndexedDB for storage            │
│     • Local caching strategy           │
│                                        │
│  4. Map Performance                    │
│     • Marker clustering (future)       │
│     • Heatmap visualization (future)   │
│                                        │
└────────────────────────────────────────┘
```

---

This architecture is designed to be:
- **Scalable**: Can grow from dozens to thousands of reports
- **Reliable**: Offline-first with automatic sync
- **Performant**: Optimized for fast load and interaction times
- **Maintainable**: Clear separation of concerns
- **Extensible**: Ready for additional features and integrations
