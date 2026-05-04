# Role-Based Access Control (RBAC) Implementation

## Overview

Complete RBAC system with 4 roles has been successfully implemented. Each role has a dedicated dashboard with role-specific features, permissions, and UI.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Auth Provider (Context)                │
│  - Handles login/logout, token management, role checking   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
   ┌────▼───┐  ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
   │Citizen │  │Responder│ │Hospital│  │ Admin  │
   │ Role   │  │  Role   │ │  Role  │  │ Role   │
   └────────┘  └─────────┘ └────────┘  └────────┘
        │            │            │              │
   ┌────▼────────────▼────────────▼──────────────▼──────┐
   │            Protected API Endpoints                 │
   │  - /api/auth/login, /register, /logout             │
   │  - /api/protected/reports                          │
   │  - /api/protected/responders                        │
   │  - /api/protected/hospitals                         │
   └────────────────────────────────────────────────────┘
        │
   ┌────▼──────────────────────────────────┐
   │      In-Memory Database (Mock)         │
   │  - Users, Reports, Responders, Hospitals
   └───────────────────────────────────────┘
```

## Implementation Details

### 1. Authentication Layer

**Files:**
- `/frontend/lib/auth-types.ts` - TypeScript interfaces
- `/frontend/lib/auth-context.tsx` - React Context for auth state
- `/frontend/lib/jwt.ts` - Token creation/verification
- `/frontend/lib/database.ts` - Mock in-memory database
- `/frontend/app/api/auth/login/route.ts` - Login endpoint
- `/frontend/app/api/auth/register/route.ts` - Registration endpoint
- `/frontend/app/api/auth/logout/route.ts` - Logout endpoint

**Features:**
- Simple JWT-like token system (base64 encoded for demo)
- User authentication with email/password
- Session persistence using localStorage
- Token expiration (24 hours)
- Role-based access control checks

### 2. Four Roles with Distinct Dashboards

#### Citizen Dashboard (`frontend/components/dashboards/citizen-dashboard.tsx`)
**Permissions:**
- Create emergency reports
- View own reports
- Track report status
- View first aid guide

**Stats:**
- Open reports
- In-progress reports
- Resolved reports
- Total reports

**Actions:**
- Report new emergency
- Track status changes

#### Responder Dashboard (`frontend/components/dashboards/responder-dashboard.tsx`)
**Permissions:**
- View all active emergencies
- Accept emergency assignments
- Update status
- View other responders
- See team availability

**Stats:**
- Active emergencies
- Assigned to responder
- Available team members
- Total responders

**Actions:**
- Accept emergency call
- Update location/status
- Coordinate with team

#### Hospital Dashboard (`frontend/components/dashboards/hospital-dashboard.tsx`)
**Permissions:**
- View incoming patients
- Monitor bed capacity
- Prepare for arrivals
- See network hospitals
- Track occupancy

**Stats:**
- Incoming patients
- Available beds
- Current patients
- Total capacity

**Actions:**
- Prepare facility
- Monitor capacity
- Share resources with network

#### Admin Dashboard (`frontend/components/dashboards/admin-dashboard.tsx`)
**Permissions:**
- View all emergencies
- Monitor responder status
- Track hospital capacity
- System analytics
- Performance metrics

**Stats:**
- Total emergencies
- Active vs resolved
- Responder availability
- Hospital capacity overview
- Success rate

**Actions:**
- System monitoring
- Generate reports
- Optimize resources

### 3. Protected API Endpoints

#### Authentication Endpoints

```
POST /api/auth/login
  Request: { email, password }
  Response: { token, user }

POST /api/auth/register
  Request: { email, password, name, role }
  Response: { token, user }

POST /api/auth/logout
  Response: { success }
```

#### Protected Endpoints

```
GET /api/protected/reports
  Auth: Required
  Filters: Based on user role
  Response: [Report[]]

POST /api/protected/reports
  Auth: Required
  Request: { description, latitude, longitude, severity, photo }
  Response: { Report }

GET /api/protected/responders
  Auth: Required (Admin/Hospital/Responder only)
  Response: [Responder[]]

PUT /api/protected/responders
  Auth: Required (Responder only)
  Request: { latitude, longitude, status }
  Response: { Responder }

GET /api/protected/hospitals
  Auth: Required
  Response: [Hospital[]]
```

### 4. Demo Credentials

All demo accounts use password: `password123`

```
Citizen:
  Email: citizen@example.com
  Role: citizen
  Features: Report emergencies, track status

Responder:
  Email: responder@example.com
  Role: responder
  Features: Accept calls, coordinate with team

Hospital:
  Email: admin@hospital.com
  Role: hospital
  Features: Prepare facilities, monitor capacity

Admin:
  Email: admin@ers.com
  Role: admin
  Features: System monitoring, analytics
```

## Data Flow

### Emergency Reporting Flow

```
1. Citizen creates report at /report
   ↓
2. Form submits to POST /api/protected/reports
   ↓
3. Backend validates and stores in database
   ↓
4. Report appears in:
   - Citizen Dashboard (my reports)
   - Responder Dashboard (active calls)
   - Hospital Dashboard (incoming patients)
   - Admin Dashboard (all reports)
   ↓
5. Responder accepts emergency
   ↓
6. Report status changes to "in-progress"
   ↓
7. Hospital prepares facility
   ↓
8. Report resolved, status → "resolved"
```

### Role-Based Access Control

```
Request → API Endpoint
    ↓
Extract token from header/cookie
    ↓
Verify token (check expiration)
    ↓
Extract user role from token
    ↓
Check role permission
    ↓
YES → Process request → Return data filtered by role
NO  → Return 401 Unauthorized
```

## Key Security Features

1. **Token Verification**: All protected endpoints verify JWT tokens
2. **Role Checking**: Operations check user role before processing
3. **Data Filtering**: Reports filtered based on user role
4. **HTTP-Only Cookies**: Tokens stored securely (can be enabled)
5. **CORS**: Cross-origin requests controlled

## Database Schema

### Users
```
{
  id: string
  email: string
  password: string (hashed in production)
  name: string
  role: 'citizen' | 'responder' | 'hospital' | 'admin'
  phone?: string
  location?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### Reports
```
{
  id: string
  description: string
  latitude: number
  longitude: number
  timestamp: string
  severity: 'high' | 'medium' | 'low'
  status: 'open' | 'assigned' | 'in-progress' | 'resolved'
  reportedBy: string (user id)
  assignedTo?: string (responder id)
  assignedToHospital?: string (hospital id)
  photo?: string
}
```

## Testing the RBAC System

### 1. Test Citizen Role
```bash
1. Go to /login
2. Enter: citizen@example.com / password123
3. See citizen-specific dashboard
4. Navigate to /report and submit emergency
5. See report in "My Reports" dashboard section
```

### 2. Test Responder Role
```bash
1. Go to /login
2. Enter: responder@example.com / password123
3. See active emergencies from citizens
4. View team members and their status
5. Accept emergency assignments
```

### 3. Test Hospital Role
```bash
1. Go to /login
2. Enter: admin@hospital.com / password123
3. See incoming patients
4. Monitor bed capacity
5. View hospital network capacity
```

### 4. Test Admin Role
```bash
1. Go to /login
2. Enter: admin@ers.com / password123
3. See all system metrics
4. Monitor responders and hospitals
5. View recent emergencies
```

## Upgrading to Production

### Required Changes

1. **Database**: Replace in-memory `database.ts` with:
   - MongoDB Atlas
   - Supabase PostgreSQL
   - AWS RDS
   - Firebase

2. **Authentication**: Upgrade JWT to:
   - jsonwebtoken library
   - RSA key pairs
   - Refresh tokens
   - Secure cookie handling

3. **Password Hashing**: Add bcrypt:
   ```bash
   npm install bcrypt
   ```

4. **Real Maps**: Replace mock map with:
   - Google Maps API
   - Mapbox
   - OpenStreetMap

5. **Environment Variables**:
   ```env
   DATABASE_URL=your-db-url
   JWT_SECRET=your-secret-key
   GOOGLE_MAPS_API_KEY=your-api-key
   ```

## File Structure

```
frontend/app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── register/route.ts
│   │   └── logout/route.ts
│   └── protected/
│       ├── reports/route.ts
│       ├── responders/route.ts
│       └── hospitals/route.ts
├── login/page.tsx
├── register/page.tsx
├── dashboard/page.tsx
└── page.tsx

frontend/lib/
├── auth-types.ts
├── auth-context.tsx
├── jwt.ts
├── database.ts
└── offline.ts

frontend/components/
├── dashboards/
│   ├── citizen-dashboard.tsx
│   ├── responder-dashboard.tsx
│   ├── hospital-dashboard.tsx
│   └── admin-dashboard.tsx
├── navigation.tsx
├── sos-button.tsx
├── map.tsx
└── ui/
```

## Next Steps

1. Test all 4 roles thoroughly
2. Integrate with real database
3. Add real geolocation services
4. Implement push notifications
5. Add real-time updates with WebSockets
6. Deploy to production
