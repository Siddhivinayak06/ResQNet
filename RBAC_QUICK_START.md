# RBAC System - Quick Start Guide

## What Was Built

A complete **Role-Based Access Control (RBAC)** system with 4 distinct roles, each with:
- Dedicated dashboard
- Role-specific permissions
- Protected API endpoints
- Role-aware features

## The 4 Roles

### 1. CITIZEN (Report Emergencies)
**Dashboard**: My Emergency Reports
- Create and submit emergencies
- Track status (Open → In-Progress → Resolved)
- View report history
- Statistics on personal reports

**Test Account**:
```
Email: citizen@example.com
Password: password123
```

### 2. RESPONDER (Emergency Response Team)
**Dashboard**: Active Emergencies
- View all active emergency calls
- Accept assignments
- See other responders and their status
- Coordinate team response

**Test Account**:
```
Email: responder@example.com
Password: password123
```

### 3. HOSPITAL (Medical Facilities)
**Dashboard**: Hospital Alerts
- See incoming patient notifications
- Monitor bed availability
- Track hospital capacity
- Coordinate with other hospitals

**Test Account**:
```
Email: admin@hospital.com
Password: password123
```

### 4. ADMIN (System Administrator)
**Dashboard**: System Administration
- Full system overview
- All emergencies (real-time)
- Responder status monitoring
- Hospital capacity tracking
- Performance metrics and success rates

**Test Account**:
```
Email: admin@ers.com
Password: password123
```

## How to Test

### Step 1: Start the Application
```bash
npm run install:all
npm run dev
# Visit http://localhost:3000
```

### Step 2: Test Each Role

#### Test as Citizen
1. Go to `/login`
2. Enter: `citizen@example.com` / `password123`
3. Click "Report New Emergency" button
4. Submit a test emergency
5. See it appear in "My Reports" with status tracking

#### Test as Responder
1. Go to `/login` (click logout first)
2. Enter: `responder@example.com` / `password123`
3. See the "Active Emergencies" from citizens
4. View "Responder Team" section showing all responders
5. See "Available Responders" count

#### Test as Hospital
1. Go to `/login` (click logout first)
2. Enter: `admin@hospital.com` / `password123`
3. See "Incoming Patients" section
4. Monitor "Hospital Network" bed capacity
5. See occupancy percentages

#### Test as Admin
1. Go to `/login` (click logout first)
2. Enter: `admin@ers.com` / `password123`
3. See complete system overview
4. Monitor all responders in real-time
5. Track hospital capacity across network
6. View all recent emergencies

## Key Files

### Authentication
- `frontend/lib/auth-types.ts` - Type definitions
- `frontend/lib/auth-context.tsx` - Auth state management
- `frontend/lib/jwt.ts` - Token handling
- `frontend/lib/database.ts` - Mock database with demo data
- `frontend/app/api/auth/*` - Auth endpoints

### Dashboards
- `frontend/components/dashboards/citizen-dashboard.tsx`
- `frontend/components/dashboards/responder-dashboard.tsx`
- `frontend/components/dashboards/hospital-dashboard.tsx`
- `frontend/components/dashboards/admin-dashboard.tsx`

### Protected APIs
- `frontend/app/api/protected/reports/route.ts`
- `frontend/app/api/protected/responders/route.ts`
- `frontend/app/api/protected/hospitals/route.ts`

## Features by Role

### Citizen Can:
- ✅ Report emergencies with location & description
- ✅ Upload photos
- ✅ Track status changes
- ✅ View personal report history

### Responder Can:
- ✅ View active emergency calls
- ✅ See team members and locations
- ✅ Accept emergency assignments
- ✅ Update availability status

### Hospital Can:
- ✅ See incoming patient alerts
- ✅ Monitor emergency capacity
- ✅ Track bed availability
- ✅ View hospital network capacity

### Admin Can:
- ✅ See all emergencies system-wide
- ✅ Monitor responder status in real-time
- ✅ Track hospital capacity
- ✅ View system statistics
- ✅ Monitor success rates

## API Endpoints

### Public
```
POST /api/auth/login - User login
POST /api/auth/register - Create account
POST /api/auth/logout - Sign out
GET /api/reports - Get all reports (no auth)
```

### Protected (Require Authentication)
```
GET /api/protected/reports - Get filtered reports
POST /api/protected/reports - Create new report
GET /api/protected/responders - Get responders
PUT /api/protected/responders - Update responder status
GET /api/protected/hospitals - Get hospitals
```

## Demo Data

### Pre-loaded Users
- 1 Citizen
- 1 Responder (+ 1 other responder in team)
- 1 Hospital (+ 1 other hospital in network)
- 1 Admin

### Pre-loaded Data
- 2 Responders with locations and statuses
- 2 Hospitals with capacity information
- Empty emergency reports list (add your own!)

## User Flow

```
User visits / → Home page
  ↓
Click "Sign In" or "Create Account"
  ↓
Choose role during registration (or use demo account)
  ↓
Login with credentials
  ↓
Redirected to role-specific dashboard
  ↓
Perform role-specific actions
  ↓
Logout when done
```

## Dashboard Components

Each dashboard has:
1. **Header** - Welcome message, user role, logout button
2. **Statistics** - Role-specific key metrics
3. **Main Content** - Role-specific features
4. **Lists** - Relevant data (reports, responders, hospitals)
5. **Actions** - Buttons for role-specific actions

## Authentication Flow

```
1. User enters email/password
   ↓
2. POST to /api/auth/login
   ↓
3. Backend verifies credentials
   ↓
4. Creates JWT token
   ↓
5. Stores in context + localStorage
   ↓
6. Redirects to /dashboard
   ↓
7. Dashboard verifies auth & loads role-specific content
```

## Protected Route Protection

- Login page redirects to dashboard if already logged in
- Dashboard redirects to login if not authenticated
- API endpoints return 401 if token is missing/invalid
- Token checked on every API request
- Automatic token refresh on next page visit

## Data Isolation by Role

Citizens see:
- Only their own reports

Responders see:
- All active (non-resolved) reports
- Their assigned reports

Hospitals see:
- All incoming patient reports

Admin see:
- All reports system-wide

## Customization Tips

### To add a new role:
1. Add role type to `UserRole` enum
2. Create new dashboard component
3. Add role check in API endpoints
4. Add filter logic in data fetching

### To connect real database:
1. Replace `/frontend/lib/database.ts` with DB client
2. Update API endpoints to query real DB
3. Add environment variables for DB connection
4. Update TypeScript types if schema changes

### To add real authentication:
1. Replace simple JWT with `jsonwebtoken` package
2. Add password hashing with `bcrypt`
3. Implement refresh tokens
4. Add session management

## Troubleshooting

### Can't login?
- Check demo credentials above
- Make sure `/api/auth/login` endpoint exists
- Check browser console for errors

### Wrong dashboard shows?
- Clear localStorage: Open DevTools → Application → Clear All
- Make sure database.ts initialized properly

### Can't see data on dashboard?
- Check that `/api/protected/*` endpoints are accessible
- Verify token is being sent in API requests
- Check browser network tab for API responses

### Need to reset?
- App uses in-memory database (resets on restart)
- Simply `npm run dev` again to fresh start

## Next Steps

1. **Test thoroughly** - Try all 4 roles
2. **Add features** - Customize dashboards as needed
3. **Connect database** - Replace mock data
4. **Deploy** - Push to Vercel
5. **Monitor** - Track system performance

## Support

For issues or questions:
1. Check RBAC_IMPLEMENTATION.md for detailed docs
2. Review API endpoint specifications
3. Check console logs for error messages
4. Verify all demo accounts are working
