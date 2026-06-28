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
- **Role-Based Access Control (RBAC)**: Distinct permissions for Citizens, Volunteers, and Admins via middleware.
- **Secure Authentication**: JWT-based authentication flow with token rotation and rate-limiting.
- **Geospatial Capabilities**: Haversine distance calculations and location-based filtering via MongoDB `2dsphere` indexes.

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Mobile App** | React Native, Expo, TypeScript, React Navigation, Socket.io-client, React Native Maps, Expo Notifications |
| **Web Frontend** | Next.js 14, React, Tailwind CSS, Leaflet.js |
| **Backend API** | Node.js, Express, MongoDB, Mongoose, Socket.io, JWT, Zod, Helmet |

---

## 🏗️ Architecture Overview

ResQNet utilizes a decoupled architecture:
1. **Node.js/Express Backend**: Acts as the central source of truth. It exposes a RESTful API (`/api/v1`) for authentication, incident management, and data retrieval, alongside a Socket.io server for real-time event broadcasting.
2. **Next.js Dashboard**: A web portal for dispatchers and admins. It consumes the REST API and listens to WebSocket events to maintain a real-time live map and incident queue.
3. **React Native Mobile App**: A mobile interface for citizens to report emergencies and for responders to receive tasks. It features offline queuing (via `AsyncStorage`) that automatically flushes to the backend REST API when connectivity is restored.

---

## 📋 Folder Structure

```text
ResQNet/
├── mobile/                  # React Native (Expo) Mobile Application
│   ├── src/
│   │   ├── components/      # Reusable UI (SOSButton, IncidentMap, etc.)
│   │   ├── navigation/      # 3-Tab Bottom Nav + Stack Navigator
│   │   ├── screens/         # Auth, Home, Emergency, Profile, First Aid
│   │   └── services/        # API Axios instance, Socket setup, Notifications
│   └── app.json             # Expo configuration and permissions
│
├── frontend/                # Next.js Web Dashboard
│   ├── app/                 # App Router pages
│   ├── components/          # Web UI components
│   └── lib/                 # Utility functions and API clients
│
└── backend/                 # Node.js REST API & WebSocket Server
    ├── src/
    │   ├── controllers/     # Request handlers (auth, incidents)
    │   ├── models/          # Mongoose schemas (User, Incident, etc.)
    │   ├── routes/          # Express route definitions
    │   ├── middleware/      # RBAC, JWT validation, Zod validation
    │   └── socket/          # Socket.io event handlers
    └── server.ts            # Entry point (binds to 0.0.0.0 for mobile access)
```

---

## 🚀 Installation & Local Setup

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
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/resqnet?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h
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
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
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
EXPO_PUBLIC_API_URL=http://192.168.1.5:5001/api/v1
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.5:5001
```
Start the Expo development server:
```bash
npx expo start --clear
```
Scan the QR code with the Expo Go app on your phone, or press `i`/`a` to open in a simulator.

*Note: Push notifications require a physical device and a development build (`npx expo run:android` or `npx expo run:ios`). Expo Go gracefully degrades this feature.*

---

## 🚢 Production Deployment

### Frontend (Next.js) - To Vercel
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set the root directory to `frontend`
4. Set up environment variables (`NEXT_PUBLIC_API_URL`, etc.)
5. Deploy with one click.

### Docker (Local deployment example)

```dockerfile
FROM node:18-alpine
WORKDIR /frontend/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🧪 Testing

For comprehensive testing guides covering the frontend, backend, accessibility, and offline modes, please refer to the **[TESTING.md](./TESTING.md)** file.

---

## 🤝 Future Enhancements
- Integration with external dispatch services (e.g., 911/112 APIs).
- Media uploads (photos/videos) attached to incident reports.
- Advanced AI severity prediction utilizing NLP on incident descriptions.
- WebRTC video streaming from the emergency scene to the dispatch center.

---
*Built for rapid response and reliable communication during crises.*
