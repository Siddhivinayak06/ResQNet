# Testing Guide - AI Emergency Response System

## Testing Overview

This guide provides comprehensive testing procedures for all features of the AI Emergency Response System.

## 1. Environment Setup for Testing

### Prerequisites
- Chrome, Firefox, or Edge browser
- DevTools enabled (F12)
- Localhost running: `npm run dev`

### Browser Configuration

#### Enable Location Simulation
1. Open DevTools (F12)
2. Go to "More tools" → "Sensors"
3. Enable "Location" simulation
4. Enter test coordinates:
   - Latitude: 40.7128
   - Longitude: -74.0060

#### Enable Offline Mode
1. Open DevTools (F12)
2. Go to "Network" tab
3. Check "Offline" checkbox

#### View Service Worker
1. Open DevTools (F12)
2. Go to "Application" → "Service Workers"
3. Should show registered service worker for localhost:3000

#### View IndexedDB
1. Open DevTools (F12)
2. Go to "Application" → "IndexedDB"
3. Expand "EmergencyResponseDB"
4. View stored reports in "reports" object store

---

## 2. Frontend Component Testing

### Test 2.1: Home Page

**Location**: `http://localhost:3000`

**Test Cases**:

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.1.1 | Page Loads | Visit home URL | Page loads with hero section, features, and CTA |
| 2.1.2 | Navigation Works | Click "Report" link | Navigates to /report page |
| 2.1.3 | SOS Button | Click SOS button | Navigates to /report page |
| 2.1.4 | First Aid Link | Click "First Aid" link | Navigates to /first-aid page |
| 2.1.5 | Dashboard Link | Click "Dashboard" link | Navigates to /dashboard page |
| 2.1.6 | Responsive | Resize browser to mobile | Layout adapts, no overflow |
| 2.1.7 | Dark Theme | Observe colors | Dark background with red accents |
| 2.1.8 | Typography | View headings/body | Clear hierarchy, readable |

---

### Test 2.2: Emergency Report Page

**Location**: `http://localhost:3000/report`

**Prerequisite**: Mock location enabled in sensors

**Test Cases**:

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.2.1 | Form Renders | Visit page | Form with description, location, photo fields |
| 2.2.2 | Location Capture | Click "Capture Location" | Coordinates appear in UI |
| 2.2.3 | Description Input | Type emergency details | Text appears in textarea |
| 2.2.4 | Photo Upload | Select image file | Image preview shows |
| 2.2.5 | Online Status | Check status indicator | Shows "Online" (green) |
| 2.2.6 | Submit Online | Fill form and submit | Redirects to dashboard after 2 seconds |
| 2.2.7 | Offline Status | Turn off internet in DevTools | Status shows "Offline" (red) |
| 2.2.8 | Submit Offline | Fill and submit while offline | Shows "Report saved offline" |
| 2.2.9 | Validation | Submit empty form | Shows error message |
| 2.2.10 | Validation | Submit without location | Shows error: "Please capture location" |

---

### Test 2.3: First Aid Guide Page

**Location**: `http://localhost:3000/first-aid`

**Test Cases**:

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.3.1 | Page Loads | Visit page | Displays accordion with 8 guides |
| 2.3.2 | Expand Section | Click CPR section | Expands showing steps |
| 2.3.3 | Collapse Section | Click expanded section | Collapses |
| 2.3.4 | Multiple Expand | Expand and collapse different guides | Each works independently |
| 2.3.5 | Content Display | Expand any guide | Shows numbered steps clearly |
| 2.3.6 | Warning Box | Scroll down | Shows "Important" warning box |
| 2.3.7 | Emergency Numbers | View bottom section | Shows 911, Poison Control, etc. |
| 2.3.8 | Offline Access | Turn off internet | Page still loads and works |
| 2.3.9 | Responsiveness | Resize to mobile | Accordion still functional |

---

### Test 2.4: Emergency Dashboard Page

**Location**: `http://localhost:3000/dashboard`

**Prerequisite**: Some reports should exist (submit a few)

**Test Cases**:

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.4.1 | Page Loads | Visit page | Shows stats and report list |
| 2.4.2 | Stats Display | View top section | Shows Critical, Medium, Low, Total counts |
| 2.4.3 | Map Renders | View map section | Interactive map displays |
| 2.4.4 | Markers Appear | Observe map | Markers appear for all reports |
| 2.4.5 | Marker Colors | Submit various severities | Red=High, Yellow=Medium, Blue=Low |
| 2.4.6 | Click Marker | Click on map marker | Popup shows report details |
| 2.4.7 | Report List | Scroll down | All reports listed with details |
| 2.4.8 | Severity Badges | View reports | Badges show "Critical", "Medium", "Low" |
| 2.4.9 | Auto-Refresh | Wait 5 seconds | New reports auto-appear |
| 2.4.10 | Manual Refresh | Click refresh button | Reports reload |

---

## 3. Backend API Testing

### Test 3.1: POST /api/reports (Create Report)

**Using Browser Console or curl**:

```javascript
// Test: Create new report
const report = {
  description: "Car accident at Main Street",
  latitude: 40.7128,
  longitude: -74.0060,
  photo: null
};

fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(report)
})
.then(r => r.json())
.then(data => console.log(data));
```

**Expected Response**:
```json
{
  "id": "abc123xyz",
  "description": "Car accident at Main Street",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2026-04-05T10:30:00Z",
  "severity": "high",
  "status": "open"
}
```

**Test Cases**:

| # | Test | Request | Expected |
|---|------|---------|----------|
| 3.1.1 | Valid Report | POST with all fields | Returns 201 + report data |
| 3.1.2 | High Severity | Description: "fire explosion" | severity: "high" |
| 3.1.3 | Medium Severity | Description: "person injured" | severity: "medium" |
| 3.1.4 | Low Severity | Description: "need help" | severity: "low" |
| 3.1.5 | Missing Description | Omit description field | Returns 400 error |
| 3.1.6 | Missing Location | Omit latitude/longitude | Returns 400 error |
| 3.1.7 | Invalid Data | String for coordinates | Returns 400 error |

---

### Test 3.2: GET /api/reports (Fetch Reports)

**Using Browser Console**:

```javascript
fetch('/api/reports')
  .then(r => r.json())
  .then(data => console.log(data));
```

**Expected Response**:
```json
[
  {
    "id": "abc123",
    "description": "...",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": "...",
    "severity": "high",
    "status": "open"
  }
]
```

**Test Cases**:

| # | Test | Expected |
|---|------|----------|
| 3.2.1 | No reports exist | Returns empty array [] |
| 3.2.2 | Reports exist | Returns array with all reports |
| 3.2.3 | Multiple reports | Count matches submitted reports |
| 3.2.4 | Response format | Each report has required fields |
| 3.2.5 | Server error | If error occurs, check console logs |

---

## 4. Offline Functionality Testing

### Test 4.1: Offline Report Storage

**Steps**:
1. Open DevTools → Network
2. Check "Offline" checkbox
3. Go to /report page
4. Fill form with emergency
5. Click "Capture Location"
6. Submit report
7. Check DevTools → Application → IndexedDB

**Expected Results**:
- Form submits successfully
- Shows "Report saved offline" message
- IndexedDB stores report with `synced: false`
- Report appears in dashboard (from local data)

**Test Cases**:

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.1.1 | Offline Save | Submit while offline | Shows offline save message |
| 4.1.2 | Storage Check | View IndexedDB | Report stored locally |
| 4.1.3 | Dashboard Shows | Go to dashboard | Report appears from local data |
| 4.1.4 | Multiple Offline | Submit 3 reports offline | All stored in IndexedDB |
| 4.1.5 | Data Persists | Refresh page | Reports still visible |

---

### Test 4.2: Auto-Sync After Connection

**Steps**:
1. Submit report while offline (Test 4.1)
2. Open DevTools → Network
3. Uncheck "Offline" checkbox
4. Wait 5 seconds or refresh dashboard
5. Check that report appears in API response

**Expected Results**:
- Report automatically syncs to backend
- Dashboard updates with server data
- IndexedDB report marked as synced
- No manual action needed

**Test Cases**:

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.2.1 | Auto Sync Trigger | Turn online after offline save | Sync starts automatically |
| 4.2.2 | Report Sent | Check network tab | POST to /api/reports visible |
| 4.2.3 | Dashboard Updates | Refresh dashboard | Report appears in list |
| 4.2.4 | Map Updates | Check dashboard map | New marker appears |
| 4.2.5 | Storage Cleanup | View IndexedDB | Synced report deleted |

---

### Test 4.3: Service Worker Caching

**Steps**:
1. Open DevTools → Application → Service Workers
2. Verify service worker is "activated"
3. Turn off internet
4. Reload page
5. Verify page loads from cache

**Expected Results**:
- Service Worker active
- Page loads completely offline
- All assets cached and served

**Test Cases**:

| # | Test | Expected |
|---|------|----------|
| 4.3.1 | SW Registered | Service worker appears in DevTools |
| 4.3.2 | SW Active | Status shows "activated" |
| 4.3.3 | Page Cached | Offline page loads fully |
| 4.3.4 | Assets Cached | CSS, JS, images load offline |
| 4.3.5 | Cache Size | DevTools shows cache contents |

---

## 5. Map Functionality Testing

### Test 5.1: Map Display

**Location**: Dashboard page

**Test Cases**:

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 5.1.1 | Map Renders | Load dashboard | Map displays with tiles |
| 5.1.2 | Map Attribution | Check bottom-right | "OpenStreetMap" credit visible |
| 5.1.3 | Initial View | Observe zoom level | World map visible (zoom 2) |
| 5.1.4 | Responsive Size | Resize browser | Map adjusts height/width |
| 5.1.5 | Loading State | Dashboard loading | Shows spinner before map |

---

### Test 5.2: Markers and Interaction

**Prerequisites**: Submit multiple reports with different severities

**Test Cases**:

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 5.2.1 | Marker Colors | Submit 3 reports (high/med/low) | Red, yellow, blue markers |
| 5.2.2 | Click Marker | Click on map marker | Popup shows report details |
| 5.2.3 | Popup Content | View marker popup | Shows description, time, location |
| 5.2.4 | Close Popup | Click elsewhere | Popup closes |
| 5.2.5 | Zoom on Markers | Observe map zoom | Fits bounds to all reports |
| 5.2.6 | Pan & Zoom | Drag/scroll map | Standard map controls work |

---

## 6. Responsiveness Testing

### Test 6.1: Mobile Devices

**Using DevTools Device Toggle**:

| # | Device | Expected |
|---|--------|----------|
| 6.1.1 | iPhone 12 (390x844) | All content fits, readable |
| 6.1.2 | iPad (768x1024) | Tablet layout works |
| 6.1.3 | Desktop (1920x1080) | Full layout with spacing |
| 6.1.4 | Landscape | Content adapts to width |
| 6.1.5 | Touch Events | Buttons respond to tap |

---

### Test 6.2: Responsive Components

| # | Component | Mobile | Tablet | Desktop |
|---|-----------|--------|--------|---------|
| 6.2.1 | Navigation | Stack | Horizontal | Horizontal |
| 6.2.2 | Form Fields | Full width | 80% width | 60% width |
| 6.2.3 | Stats Cards | Stack | 2x2 grid | 4 across |
| 6.2.4 | Report List | Single col | Single col | Responsive |
| 6.2.5 | Map | Full height | Full height | 400px |

---

## 7. Accessibility Testing

### Test 7.1: Keyboard Navigation

**Test Cases**:

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 7.1.1 | Tab Navigation | Press Tab repeatedly | Focus outline visible |
| 7.1.2 | Link Focus | Tab to links | Clickable with Enter |
| 7.1.3 | Button Focus | Tab to buttons | Activated with Enter/Space |
| 7.1.4 | Form Navigation | Tab through form | Logical order |
| 7.1.5 | Focus Order | Check visual flow | Left-to-right, top-to-bottom |

---

### Test 7.2: Screen Reader (NVDA/JAWS)

**Test Cases**:

| # | Test | Expected |
|---|------|----------|
| 7.2.1 | Page Title | "AI Emergency Response System" |
| 7.2.2 | Headings | H1, H2, H3 hierarchy correct |
| 7.2.3 | Images | Alt text present and descriptive |
| 7.2.4 | Form Labels | Labels read before inputs |
| 7.2.5 | Button Text | Buttons have descriptive text |
| 7.2.6 | Link Text | Links are descriptive |
| 7.2.7 | Status Messages | "Offline" / "Success" announced |

---

## 8. Performance Testing

### Test 8.1: Load Time

**Using DevTools Lighthouse**:

1. Open DevTools
2. Click "Lighthouse" tab
3. Run analysis

**Expected Results**:
- Performance: >80
- Accessibility: >90
- Best Practices: >80
- SEO: >90

---

### Test 8.2: Network Performance

| # | Test | Expected |
|---|------|----------|
| 8.2.1 | 3G Connection | Page loads in <5 seconds |
| 8.2.2 | 4G Connection | Page loads in <2 seconds |
| 8.2.3 | Report Submit | API response <500ms |
| 8.2.4 | Dashboard Load | 20 reports load in <2 seconds |
| 8.2.5 | Map Render | Maps render in <1 second |

---

### Test 8.3: Memory Usage

| # | Test | Expected |
|---|------|----------|
| 8.3.1 | Initial Load | <15MB |
| 8.3.2 | 20 Reports | <20MB |
| 8.3.3 | No Memory Leak | Refresh 10x, stable memory |

---

## 9. AI Severity Detection Testing

**Endpoint**: POST /api/reports

**Test Cases**:

| # | Description | Expected Severity |
|---|-------------|-------------------|
| 9.1 | "Building is on fire" | HIGH (red) |
| 9.2 | "Car crash on highway" | HIGH (red) |
| 9.3 | "Person has severe injuries" | HIGH (red) |
| 9.4 | "Person has a fracture" | MEDIUM (yellow) |
| 9.5 | "Someone is bleeding" | MEDIUM (yellow) |
| 9.6 | "Need assistance" | LOW (blue) |
| 9.7 | "Help me please" | LOW (blue) |
| 9.8 | "Person is crying" | LOW (blue) |
| 9.9 | "Critical medical emergency" | HIGH (red) |
| 9.10 | "Minor cut on hand" | LOW (blue) |

---

## 10. Browser Compatibility

### Desktop Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✓ Full Support |
| Firefox | 88+ | ✓ Full Support |
| Safari | 14+ | ✓ Full Support |
| Edge | 90+ | ✓ Full Support |

### Mobile Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome Mobile | 90+ | ✓ Full Support |
| Firefox Mobile | 88+ | ✓ Full Support |
| Safari iOS | 14+ | ✓ Full Support |

---

## 11. Security Testing

### Test 11.1: Input Validation

| # | Test | Input | Expected |
|---|------|-------|----------|
| 11.1.1 | XSS Attack | `<script>alert('xss')</script>` | Script sanitized |
| 11.1.2 | SQL Injection | `'; DROP TABLE--` | Treated as text |
| 11.1.3 | Long Input | 10000 characters | Accepted or validated |
| 11.1.4 | Special Characters | `@#$%^&*()` | Accepted normally |

---

### Test 11.2: Data Privacy

| # | Test | Expected |
|---|------|----------|
| 11.2.1 | Location Accuracy | Real GPS or simulated only |
| 11.2.2 | Photo Storage | Not persisted without consent |
| 11.2.3 | Clear Data | User can delete offline reports |
| 11.2.4 | No Tracking | No analytics without consent |

---

## 12. Error Handling Testing

### Test 12.1: Network Errors

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 12.1.1 | Connection drops | Falls back to offline storage |
| 12.1.2 | API returns 500 | Shows error message, suggests retry |
| 12.1.3 | Timeout | Shows timeout error |
| 12.1.4 | CORS error | Error logged, user not confused |

---

### Test 12.2: User Errors

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 12.2.1 | Empty description | Form shows validation error |
| 12.2.2 | No location | Error: "Please capture location" |
| 12.2.3 | Denied geolocation | Error message explains |
| 12.2.4 | Large photo | Accepted or size warning shown |

---

## 13. Complete User Flow Testing

### Flow A: Online Emergency (Happy Path)
1. Navigate to home
2. Click SOS button
3. Type emergency description: "Traffic accident on Main Street"
4. Click "Capture Location"
5. Click "Submit"
6. Verify redirect to dashboard
7. Verify report appears in list and map

**Expected Time**: ~30 seconds

### Flow B: Offline Emergency with Sync
1. Turn off internet (DevTools)
2. Navigate to /report
3. Verify "Offline" status shown
4. Type description: "Person collapsed"
5. Capture location
6. Submit
7. Verify "Saved offline" message
8. Check IndexedDB for stored report
9. Turn internet back on
10. Wait for auto-sync
11. Verify report appears in dashboard

**Expected Time**: ~2 minutes

### Flow C: Viewing First Aid
1. Navigate to home
2. Click "First Aid Guide"
3. Expand CPR section
4. Read through steps
5. Expand another section (e.g., Bleeding)
6. Verify content is clear and accessible

**Expected Time**: ~1 minute

---

## Test Reporting Template

```markdown
## Test Report
**Date**: [Date]
**Tester**: [Name]
**Browser**: [Browser/Version]
**Device**: [Device Type]

### Summary
- Tests Passed: X/Y
- Tests Failed: 0
- Issues Found: 0

### Detailed Results
[List each test with PASS/FAIL]

### Issues Found
[If any, describe with steps to reproduce]

### Notes
[Any observations or recommendations]
```

---

## Quick Test Checklist

Before submitting for evaluation:

- [ ] Home page loads and looks good
- [ ] All navigation links work
- [ ] Report form submits online
- [ ] Report form saves offline
- [ ] Offline report syncs when online
- [ ] Dashboard shows all reports
- [ ] Map displays with markers
- [ ] First Aid guide has all 8 sections
- [ ] Mobile responsiveness works
- [ ] Service Worker registered
- [ ] No console errors
- [ ] Performance is acceptable

---

**Good luck with testing!**
