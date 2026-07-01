# 🛡️ GuardianX – AI-Powered Smart City Emergency & Civic Intelligence Platform

> **One Platform for Emergency Response, Civic Issue Management, and Intelligent City Governance**

GuardianX is a next-generation Smart City platform that combines **real-time emergency response**, **AI-powered civic issue management**, **government command center**, **volunteer coordination**, **live incident tracking**, and **disaster intelligence** into one unified ecosystem.

Originally developed as **ResQNet**, GuardianX expands the concept into a complete Smart City solution powered by Artificial Intelligence, Real-Time Communication, Geospatial Services, and Predictive Analytics.

---

# 🌍 Sustainable Development Goals (SDGs)

GuardianX contributes to:

- ❤️ SDG 3 – Good Health & Well-being
- 🏗 SDG 9 – Industry, Innovation & Infrastructure
- 🏙 SDG 11 – Sustainable Cities & Communities
- 🌱 SDG 13 – Climate Action
- ⚖ SDG 16 – Peace, Justice & Strong Institutions

---

# 📌 Problem Statement

Cities face two major challenges:

### 🚨 Emergency Response

- Road Accidents
- Medical Emergencies
- Fire Incidents
- Floods
- Missing Persons
- Natural Disasters

Emergency reporting is often delayed due to poor communication and lack of coordination.

---

### 🏙 Civic Issues

Citizens struggle to report:

- Potholes
- Garbage Overflow
- Water Leakage
- Broken Streetlights
- Illegal Dumping
- Damaged Roads
- Sewage Problems
- Fallen Trees

Most complaints remain unresolved because reporting systems are fragmented and lack transparency.

---

GuardianX solves both problems through a unified AI-powered platform.

---

# 🚀 Key Features

## 🚨 Emergency Response Module

- SOS Emergency Button
- Live GPS Sharing
- Medical Emergency Reporting
- Fire Reporting
- Road Accident Reporting
- Flood Reporting
- Missing Person Reporting
- Offline Emergency Reporting
- First Aid Guide
- Emergency Contacts
- Incident Timeline
- Live Status Tracking
- Nearby Hospital Finder
- Nearby Shelter Finder

---

## 🏙 CivicMind Module

Citizens can report:

- Potholes
- Garbage Overflow
- Broken Streetlights
- Water Leakage
- Illegal Dumping
- Sewage Problems
- Damaged Roads
- Fallen Trees
- Traffic Signal Failure
- Public Property Damage

Each report includes:

- GPS Location
- Images
- Description
- Priority
- Status
- Timeline
- Assigned Department

---

# 🤖 AI Features

## AI Vision

Users simply upload a photo.

GuardianX automatically detects:

### Emergency

- Fire
- Road Accident
- Flood

### Civic

- Garbage
- Pothole
- Water Leakage
- Fallen Tree
- Broken Streetlight
- Road Blockage

Powered by:

- YOLO
- OpenCV

---

## AI Severity Prediction

Automatically predicts incident priority.

Example:

| Incident | Priority |
|------------|------------|
| Fire | Critical |
| Major Accident | High |
| Flood | Critical |
| Garbage | Medium |
| Small Pothole | Low |

---

## Smart Routing Engine

Automatically forwards incidents to:

- Fire Department
- Ambulance
- Police
- Municipal Corporation
- Water Department
- Electricity Department
- Disaster Management

---

## AI Chat Assistant

Citizens can ask:

- Where is my complaint?
- Where is the nearest hospital?
- CPR instructions
- Flood safety

Officials can ask:

- Show unresolved incidents
- Show critical reports
- Show today's emergencies
- Display hotspot areas

Future Ready:

- Gemini
- OpenAI
- Llama
- LangChain
- LangGraph

---

# 🌪 Disaster Intelligence

Supports:

- Weather Alerts
- Flood Alerts
- Cyclone Alerts
- Earthquake Alerts
- Heatwave Alerts

Citizens receive proactive notifications.

---

# 🤝 Volunteer Network

Volunteers can:

- Accept Missions
- Reject Missions
- Share Live GPS
- Upload Rescue Progress
- Complete Rescue Missions
- Track History
- Earn Contribution Points

---

# 🏛 Government Command Center

The web dashboard provides:

- Live Incident Map
- Civic Complaint Map
- Emergency Queue
- Department Queue
- Volunteer Tracking
- Analytics
- Response Time
- Heatmaps
- Incident Timeline
- Department Performance
- Citizen Feedback
- Disaster Alerts

---

# 👥 User Roles

## 👤 Citizen

- Report Emergencies
- Report Civic Issues
- SOS
- View Reports
- AI Assistant
- Notifications
- Profile
- First Aid Guide

---

## 🚑 Volunteer

Everything a Citizen can do plus:

- Accept Missions
- Live Tracking
- Mission Updates
- Rescue Progress
- Mission History

---

## 🏢 Department Admin

- Manage Incidents
- Manage Civic Complaints
- Assign Volunteers
- Analytics
- Heatmaps
- Live Dashboard

---

## ⚙ Super Admin

- User Management
- Department Management
- System Settings
- AI Settings
- Full Analytics
- Audit Logs

---

# 📱 Mobile Application

Built using:

- React Native
- Expo
- TypeScript

Features:

- Bottom Navigation
- SOS
- Live Maps
- Notifications
- Offline Mode
- AI Reporting
- Civic Reporting
- Profile
- Mission Tracking

---

# 💻 Web Dashboard

Built using:

- Next.js
- React
- Tailwind CSS

Features:

- Smart City Dashboard
- Interactive Maps
- Charts
- Department Analytics
- Incident Queue
- Volunteer Management
- User Management

---

# ⚙ Backend

Built using:

- Node.js
- Express.js
- MongoDB
- Socket.io

Features:

- JWT Authentication
- Role Based Access
- REST API
- WebSockets
- File Upload
- AI Services
- Notification Service

---

# 🛠 Tech Stack

## Mobile

- React Native
- Expo
- TypeScript
- React Navigation
- React Native Maps

## Web

- Next.js
- React
- Tailwind CSS

## Backend

- Node.js
- Express.js
- Socket.io
- JWT
- Zod

## Database

- MongoDB
- Redis (Caching)

## AI

- YOLO
- OpenCV
- Gemini
- LangChain
- LangGraph

## Maps

- OpenStreetMap
- Leaflet
- Google Maps API

## Notifications

- Firebase Cloud Messaging

## Storage

- AWS S3
- MinIO

## DevOps

- Docker
- BullMQ
- GitHub Actions

---

# 🏗 System Architecture

```
Citizen Mobile App
        │
        ▼
 REST API + Socket.io
        │
        ▼
 AI Vision Service
        │
        ▼
 Severity Prediction
        │
        ▼
 Smart Routing Engine
        │
        ▼
 Government Dashboard
        │
        ▼
 Department Admin
        │
        ▼
 Volunteers / Responders
        │
        ▼
 Citizen Notifications
```

---

# 📂 Project Structure

```
GuardianX
│
├── mobile
│   ├── src
│   │   ├── components
│   │   ├── screens
│   │   ├── navigation
│   │   ├── hooks
│   │   ├── services
│   │   ├── context
│   │   ├── store
│   │   ├── utils
│   │   └── assets
│
├── frontend
│   ├── app
│   ├── components
│   ├── hooks
│   ├── services
│   ├── lib
│   └── styles
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── middleware
│   ├── services
│   ├── repositories
│   ├── socket
│   ├── models
│   ├── config
│   ├── utils
│   └── ai
│
└── docs
```

---

# 🔄 Workflow

```
Citizen

↓

Login

↓

Emergency / Civic Report

↓

Photo + GPS + Description

↓

AI Classification

↓

Severity Prediction

↓

Department Assignment

↓

Real-Time Socket.io

↓

Dashboard Update

↓

Volunteer Notification

↓

Department Action

↓

Status Updates

↓

Citizen Notification

↓

Analytics
```

---

# 🔐 Security

- JWT Authentication
- Refresh Tokens
- Role Based Access Control
- Protected APIs
- Rate Limiting
- Helmet
- Input Validation
- Password Hashing
- Audit Logs
- Secure File Upload

---

# 📊 Analytics

- Incident Trends
- Civic Trends
- Department Performance
- Volunteer Performance
- Response Time
- Heatmaps
- Monthly Reports
- Export Reports

---

# 🚀 Future Scope

- Drone Integration
- AI Flood Prediction
- Satellite Image Analysis
- IoT Sensors
- Air Quality Monitoring
- Smart Ambulance Routing
- Digital Twin
- Voice Reporting
- Regional Language Support
- Offline Mesh Networking

---

# 📦 Installation

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Mobile

```bash
cd mobile
npm install
npx expo start
```

---

# 🧪 Testing

```bash
npm run test
```

---

# 📸 Screenshots

Add screenshots here:

- Login
- Home
- SOS
- Report Emergency
- Report Civic Issue
- AI Detection
- Live Map
- Dashboard
- Analytics

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository

2. Create a feature branch

3. Commit changes

4. Push the branch

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨💻 Developed By

**Siddhivinayak Sawant**

GuardianX — AI-Powered Smart City Emergency & Civic Intelligence Platform

Built with ❤️ using React Native, Next.js, Node.js, MongoDB, AI, and Real-Time Technologies.
