# ResQNet — Real-Time Emergency Rescue Network

ResQNet is a comprehensive, full-stack emergency reporting and rescue coordination platform. It features a React Native mobile application for citizens and responders, a Next.js web dashboard for dispatchers, and a robust Node.js backend powered by MongoDB and Socket.io for real-time synchronization.

## 🚨 Key Features

### Mobile Application (React Native / Expo)
- **Real-Time Map**: Live visualization of nearby incidents using Socket.io and React Native Maps.
- **SOS Button**: 3-second hold to instantly broadcast an emergency with GPS coordinates.
- **Offline First**: Reports are queued in `AsyncStorage` when offline and automatically synced when connectivity is restored.
- **Offline First Aid Guide**: Built-in emergency procedures (CPR, Bleeding, Burns, etc.) accessible without an internet connection.
- **Emergency Contacts**: Quick-call contacts stored locally on the device.
- **Push Notifications**: Real-time alerts for nearby incidents and status updates (gracefully degrades in Expo Go).

### Web Dashboard (Next.js)
- **Centralized Dispatch**: View and manage all incoming emergency reports.
- **Interactive Mapping**: Real-time incident tracking using Leaflet.js.
- **Analytics & Status**: Monitor active, pending, and resolved incidents.

### Backend API (Node.js / Express)
- **Real-Time Sync**: Bi-directional communication using Socket.io.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Citizens, Volunteers, and Admins.
- **Secure Authentication**: JWT-based authentication flow.
- **Geospatial Capabilities**: Haversine distance calculations and location-based filtering.

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Mobile App** | React Native, Expo, TypeScript, React Navigation, Socket.io-client, React Native Maps, Expo Notifications |
| **Web Frontend** | Next.js 14, React, Tailwind CSS, Leaflet.js |
| **Backend API** | Node.js, Express, MongoDB, Mongoose, Socket.io, JWT |

---

## 📋 Project Structure

```text
ResQNet/
├── mobile/                  # React Native (Expo) Mobile Application
│   ├── src/
│   │   ├── components/      # Reusable UI (SOSButton, IncidentMap, etc.)
│   │   ├── navigation/      # 3-Tab Bottom Nav + Stack Navigator
│   │   ├── screens/         # Auth, Home, Emergency, Profile, First Aid
│   │   ├── services/        # API Axios instance, Socket setup, Notifications
│   │   ├── theme/           # Centralized color tokens and shared styles
│   │   └── utils/           # Offline queueing, location helpers
│   └── app.json             # Expo configuration and permissions
│
├── frontend/                # Next.js Web Dashboard
│   ├── app/                 # App Router pages
│   ├── components/          # Web UI components
│   └── lib/                 # Utility functions and API clients
│
└── backend/                 # Node.js REST API & WebSocket Server
    ├── controllers/         # Request handlers (auth, incidents)
    ├── models/              # Mongoose schemas
    ├── routes/              # Express route definitions
    ├── socket/              # Socket.io event handlers
    └── server.js            # Entry point (binds to 0.0.0.0 for mobile access)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- Expo CLI (`npm install -g expo-cli`)
- A physical mobile device (recommended) or simulator for testing

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/resqnet
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:3000
```
Start the backend server:
```bash
npm run dev
# The server runs on http://0.0.0.0:5001 to allow mobile devices on the same WiFi to connect.
```

### 2. Web Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```
Start the Next.js app:
```bash
npm run dev
# Available at http://localhost:3000
```

### 3. Mobile App Setup
```bash
cd mobile
npm install
```
Create a `.env` file in the `mobile` directory. **Important:** Replace `192.168.1.5` with your computer's actual local IP address so the physical device can reach the backend.
```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:5001/api
```
Start the Expo development server:
```bash
npx expo start --clear
```
Scan the QR code with the Expo Go app on your phone, or press `i`/`a` to open in a simulator.

*Note: Push notifications require a physical device and a development build (`npx expo run:android` or `npx expo run:ios`). Expo Go gracefully degrades this feature.*

---

## 📱 Mobile App UI Highlights

- **Dark Mode Aesthetic**: A cohesive, modern dark theme utilizing soft glows and shadow depths.
- **Floating Quick Actions**: One-tap access to First Aid, Emergency Contacts, and Reporting from the Home screen.
- **Smart Feedback**: Haptic vibrations on the SOS button and toast notifications for offline queuing.
- **Accessible**: Screen-reader friendly labels (`accessibilityRole`, `accessibilityLabel`) integrated across all components.

---

## 🔒 Security & Performance
- **Optimized Rendering**: `React.memo` utilized for incident lists to prevent unnecessary re-renders during Socket.io real-time updates.
- **Graceful Error Handling**: Resilient network request intercepts with automatic user logout on expired JWTs.
- **Type Safety**: End-to-end TypeScript implementation in the mobile app.

---

## 🤝 Future Enhancements
- Integration with external dispatch services (e.g., 911/112 APIs).
- Media uploads (photos/videos) attached to incident reports.
- Advanced AI severity prediction utilizing NLP on incident descriptions.
- WebRTC video streaming from the emergency scene to the dispatch center.

---
*Built for rapid response and reliable communication during crises.*
