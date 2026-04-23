# EZPeople Check-in

A mobile-first employee check-in app built with React, Firebase, and LINE LIFF. Employees authenticate via LINE, then clock in/out, take breaks, submit leave requests, and view attendance history — all from within the LINE app.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  LINE App (LIFF)                                    │
│  React + TypeScript + Vite                          │
│  Firebase SDK (Auth + Firestore)                    │
└──────────────┬──────────────────────────────────────┘
               │  1. LINE access token
               ▼
┌─────────────────────────────────────────────────────┐
│  Cloud Functions (Node 20, asia-southeast1)         │
│  POST /lineAuth                                     │
│  · Verifies token with LINE API                     │
│  · Upserts user doc in Firestore                    │
│  · Returns Firebase custom token                    │
└──────────────┬──────────────────────────────────────┘
               │  2. Custom token → signInWithCustomToken
               ▼
┌─────────────────────────────────────────────────────┐
│  Firebase Auth  ·  Firestore                        │
│  users/{uid}                                        │
│  attendance/{uid}/records/{date}                    │
│  leaveRequests/{uid}/requests/{requestId}           │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Auth | LINE LIFF + Firebase Custom Auth |
| Database | Cloud Firestore |
| Backend | Firebase Cloud Functions v2 (Gen 2) |
| Local dev | Firebase Emulator Suite in Docker |

## Project Structure

```
.
├── src/
│   ├── screens/          # Full-page views (Login, Home, ClockIn, History, Leave, Profile)
│   ├── components/ui/    # Shared UI components (Icons, TabBar, BigButton, …)
│   ├── contexts/         # AppContext — auth state, user, current screen
│   ├── hooks/            # useNow, useGeolocation
│   ├── services/
│   │   └── firebase.ts   # Firebase SDK init + all Firestore helpers
│   └── tokens.ts         # Design tokens (theme, copy, fonts)
├── functions/
│   └── src/
│       ├── handlers/
│       │   └── auth.ts   # POST /lineAuth endpoint
│       ├── services/
│       │   └── line.ts   # LINE API client
│       └── types.ts      # Shared TypeScript interfaces
├── Dockerfile            # Multi-stage: functions-builder, web-builder, web-dev, emulators
├── docker-compose.yml    # firebase (emulators) + web (Vite dev server)
├── firebase.json         # Emulator ports, Firestore rules/indexes, hosting config
├── firestore.rules       # Per-user read/write security rules
└── firestore.indexes.json
```

## Local Development

Everything runs in Docker — no local installs required beyond Docker itself.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker + Compose plugin)

### First-time setup

**1. Clone and enter the repo**
```bash
git clone https://github.com/cxsize/checksure.git
cd checksure
```

**2. Build the Docker images**
```bash
npm run docker:build
```

**3. Start all services**
```bash
npm run docker:up
```

This starts two containers:

| Service | URL | Description |
|---|---|---|
| Vite dev server | http://localhost:5173 | Frontend with hot-reload |
| Firebase Emulator UI | http://localhost:4000 | Auth, Firestore, Functions dashboard |

> The emulators use project ID `demo-ezpeople`. No real Firebase project is needed for local dev.

### Dev auth bypass

LIFF only works inside the LINE app. In a regular browser the login button calls `signInAnonymously()` against the local Auth emulator, giving you a real Firebase UID so all Firestore operations work normally.

### Stopping

```bash
npm run docker:down
```

Emulator data (users, attendance records) is persisted in a named Docker volume and reloaded automatically on the next `docker:up`.

## Production Setup

### 1. Firebase project

Create a project at [console.firebase.google.com](https://console.firebase.google.com) and enable:
- Authentication → Sign-in method → Custom
- Firestore Database
- Cloud Functions (Blaze plan required)

### 2. LINE LIFF app

In [LINE Developers Console](https://developers.line.biz):
1. Create a provider and a channel (LINE Login)
2. Add a LIFF app with endpoint URL pointing to your hosting domain
3. Copy the LIFF ID

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_LIFF_ID=your-liff-id

# Production Functions URL
VITE_API_BASE_URL=https://asia-southeast1-your-project-id.cloudfunctions.net
```

### 4. Update `.firebaserc`

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 5. Deploy

```bash
# Deploy Firestore rules + indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions

# Build and deploy frontend
npm run build
firebase deploy --only hosting
```

## Firestore Data Model

```
users/{uid}
  lineId          string
  displayName     string
  pictureUrl      string
  employeeId      string
  dept            { th, en }
  assignedSites   string[]
  lang            "th" | "en"
  theme           "warm" | "neutral" | "contrast"
  notificationsEnabled  boolean

attendance/{uid}/records/{YYYY-MM-DD}
  date            string
  clockIn         Timestamp
  clockOut        Timestamp | null
  breakMinutes    number
  workedMinutes   number
  otMinutes       number
  siteId          string | null
  status          "in" | "out" | "break"

leaveRequests/{uid}/requests/{requestId}
  type            "sick" | "personal" | "vacation"
  fromDate        string
  toDate          string
  reason          string
  status          "pending" | "approved" | "rejected"
  createdAt       Timestamp
```

Security rules enforce that every user can only read and write their own documents.

## Available Scripts

| Command | Description |
|---|---|
| `npm run docker:up` | Start all services (emulators + Vite dev server) |
| `npm run docker:build` | Build Docker images (run after Dockerfile changes) |
| `npm run docker:down` | Stop all containers |
| `npm run dev` | Vite dev server only (requires emulators running separately) |
| `npm run build` | TypeScript check + production Vite build |
| `npm run lint` | ESLint |
