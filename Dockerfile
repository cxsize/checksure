# ── Stage 1: build Cloud Functions ──────────────────────────────────────────
FROM node:20-slim AS functions-builder

WORKDIR /build/functions
COPY functions/package*.json ./
RUN npm ci
COPY functions/src ./src
COPY functions/tsconfig.json ./
RUN npm run build

# ── Stage 2: Firebase emulators runtime ─────────────────────────────────────
FROM node:20-slim

# Firestore emulator requires a JRE
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g firebase-tools@15 --prefer-offline

WORKDIR /app

# Project config
COPY firebase.json .firebaserc firestore.rules firestore.indexes.json ./

# Functions runtime deps + compiled output
COPY functions/package*.json ./functions/
RUN cd functions && npm ci --omit=dev
COPY --from=functions-builder /build/functions/lib ./functions/lib

# Emulator data persisted via a mounted volume at /data
VOLUME ["/data"]

EXPOSE 4000 5001 8080 9099

CMD ["firebase", "emulators:start", \
     "--project", "demo-ezpeople", \
     "--only", "auth,functions,firestore", \
     "--import", "/data", \
     "--export-on-exit"]
