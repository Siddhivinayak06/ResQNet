# AI Emergency Response System - Full-Stack Setup

## 1. Folder Structure

```text
ResQNet/
├── frontend/app/                      # Next.js App Router frontend
├── frontend/components/               # Shared UI and dashboard components
├── frontend/lib/                      # Frontend auth/offline/api utilities
│   ├── api-client.ts         # Frontend API client for Express backend
│   ├── auth-context.tsx      # JWT auth state management
│   ├── offline.ts            # IndexedDB and offline sync utilities
│   └── socket-client.ts      # Socket.io client singleton
├── frontend/public/
│   └── sw.js                 # Service Worker for offline support
├── backend/                  # Node.js + Express + MongoDB API server
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js            # Express app and route wiring
│       ├── server.js         # HTTP server + Socket.io bootstrap
│       ├── config/
│       │   ├── database.js   # MongoDB connection
│       │   └── env.js        # Environment parsing
│       ├── middleware/
│       │   ├── auth.js       # JWT auth middleware
│       │   └── authorizeRoles.js
│       ├── models/
│       │   ├── User.js
│       │   ├── EmergencyReport.js
│       │   ├── ResponderProfile.js
│       │   └── HospitalProfile.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── report.routes.js
│       │   ├── responder.routes.js
│       │   ├── hospital.routes.js
│       │   └── admin.routes.js
│       ├── services/
│       │   ├── seed.js       # Demo data seed on startup
│       │   └── socket.js     # Realtime event emitters
│       └── utils/
│           ├── jwt.js
│           ├── severity.js
│           └── reportFormatter.js
├── .env.example              # Frontend env template
└── package.json              # Root scripts for frontend + fullstack dev
```

## 2. Frontend and Backend Setup

### Install dependencies

```bash
npm install
npm --prefix backend install
```

### Run only frontend (Next.js)

```bash
npm run dev
```

### Run only backend (Express)

```bash
npm run dev:backend
```

### Run full-stack together

```bash
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

## 3. API Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Emergency Reports
- `GET /api/reports` (role-aware results)
- `POST /api/reports` (citizen/admin)
- `PATCH /api/reports/:id/assign` (responder/admin)
- `PATCH /api/reports/:id/status` (responder/hospital/admin)

### Responders
- `GET /api/responders` (admin/hospital/responder)
- `PATCH /api/responders/me/status` (responder)

### Hospitals
- `GET /api/hospitals` (authenticated)

### Admin
- `GET /api/admin/stats` (admin)

### Health
- `GET /health`

## 4. Database Connection

MongoDB is connected in `backend/src/config/database.js` using Mongoose:

- Reads URI from `MONGODB_URI`
- Uses `mongoose.connect(...)` on backend startup
- Seeds demo users and sample emergency data on first boot when `SEED_DEMO_DATA=true`

## 5. Environment Configuration

### Frontend (`.env.local`)

Copy from `.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/resqnet
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:3000
SEED_DEMO_DATA=true
```

## Role-Based Access

Supported roles:
- Citizen: report emergency and view own reports
- Responder: accept/update emergency requests
- Hospital: receive patient alerts and view hospital traffic
- Admin: view system-level stats and manage operations

## Realtime + Offline

- Realtime: Socket.io events (`report:created`, `report:updated`, `responder:updated`)
- Offline: Service Worker + IndexedDB queue with auto sync on reconnection
