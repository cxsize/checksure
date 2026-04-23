import { onRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getLineProfile } from '../services/line';

// POST /lineAuth
// Body: { accessToken: string }
// Returns: { customToken: string }
export const lineAuth = onRequest(
  { cors: true, region: 'asia-southeast1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
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
