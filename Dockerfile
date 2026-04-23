# ── Stage 1: build Cloud Functions ──────────────────────────────────────────
FROM node:20-slim AS functions-builder

WORKDIR /build/functions
COPY functions/package*.json ./
RUN npm ci
COPY functions/src ./src
COPY functions/tsconfig.json ./
RUN npm run build

# ── Stage 2: build frontend (production) ─────────────────────────────────────
FROM node:20-slim AS web-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html tsconfig*.json vite.config.ts eslint.config.js ./
COPY src ./src
COPY public ./public

ARG VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID \
    VITE_LIFF_ID \
    VITE_API_BASE_URL

RUN npm run build

# ── Stage 3: frontend dev server (hot-reload) ─────────────────────────────────
FROM node:20-slim AS web-dev

WORKDIR /app
COPY package*.json ./
RUN npm ci

EXPOSE 5173
CMD ["npx", "vite", "--host"]

# ── Stage 4: Java 21 provider ─────────────────────────────────────────────────
# Debian Bookworm (node:20-slim base) does not ship Java 21 in its main or
# backports repos at build time. Copy the JRE straight from the official
# Eclipse Temurin image — no apt repository setup required.
FROM eclipse-temurin:21-jre AS java

# ── Stage 5: Firebase emulators runtime ─────────────────────────────────────
FROM node:20-slim AS emulators

COPY --from=java /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

RUN npm install -g firebase-tools@15 --prefer-offline

# Pre-download Firestore emulator JAR so first container start doesn't stall
RUN firebase setup:emulators:firestore

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
