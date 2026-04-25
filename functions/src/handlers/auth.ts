import { onRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getLineProfile } from '../services/line';

// Allowed origins for CORS — production + LIFF + local dev
const ALLOWED_ORIGINS = [
  'https://liff.line.me',
  'http://localhost:5173',
  'http://localhost:4173',
];

// Add production origins from environment (set at deploy time)
// e.g. CORS_ORIGIN=https://my-app.web.app
const envOrigin = process.env.CORS_ORIGIN;
if (envOrigin) ALLOWED_ORIGINS.push(envOrigin);

const isEmulator =
  process.env.FUNCTIONS_EMULATOR === 'true' ||
  (process.env.GCLOUD_PROJECT ?? '').startsWith('demo-');

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;       // requests
const RATE_WINDOW_MS = 60000; // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// POST /lineAuth
// Body: { accessToken: string }
// Returns: { customToken: string }
export const lineAuth = onRequest(
  {
    cors: isEmulator ? true : ALLOWED_ORIGINS,
    region: 'asia-southeast1',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Rate limit by IP
    const clientIp = req.ip ?? req.headers['x-forwarded-for'] as string ?? 'unknown';
    if (!isEmulator && isRateLimited(clientIp)) {
      res.status(429).json({ error: 'Too many requests. Try again later.' });
      return;
    }

    const { accessToken } = req.body as { accessToken?: unknown };

    if (!accessToken || typeof accessToken !== 'string') {
      res.status(400).json({ error: 'accessToken is required' });
      return;
    }

    try {
      const profile = await getLineProfile(accessToken);

      // Firestore uid matches the Firebase Auth uid for this user
      const uid = `line_${profile.userId}`;

      // Upsert user document — only fields that come from LINE; app preferences
      // are set by the client via upsertUserProfile()
      await getFirestore()
        .collection('users')
        .doc(uid)
        .set(
          {
            lineId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl ?? '',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      const customToken = await getAuth().createCustomToken(uid);
      res.json({ customToken });
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      const httpStatus = e.status ?? 500;
      const message = httpStatus < 500 ? (e.message ?? 'Auth failed') : 'Internal server error';
      console.error('[lineAuth]', err);
      res.status(httpStatus).json({ error: message });
    }
  },
);
