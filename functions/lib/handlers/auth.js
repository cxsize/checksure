"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineAuth = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const line_1 = require("../services/line");
// POST /lineAuth
// Body: { accessToken: string }
// Returns: { customToken: string }
exports.lineAuth = (0, https_1.onRequest)({ cors: true, region: 'asia-southeast1' }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { accessToken } = req.body;
    if (!accessToken || typeof accessToken !== 'string') {
        res.status(400).json({ error: 'accessToken is required' });
        return;
    }
    try {
        const profile = await (0, line_1.getLineProfile)(accessToken);
        // Firestore uid matches the Firebase Auth uid for this user
        const uid = `line_${profile.userId}`;
        // Upsert user document — only fields that come from LINE; app preferences
        // are set by the client via upsertUserProfile()
        await (0, firestore_1.getFirestore)()
            .collection('users')
            .doc(uid)
            .set({
            lineId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl ?? '',
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        const customToken = await (0, auth_1.getAuth)().createCustomToken(uid);
        res.json({ customToken });
    }
    catch (err) {
        const e = err;
        const httpStatus = e.status ?? 500;
        const message = httpStatus < 500 ? (e.message ?? 'Auth failed') : 'Internal server error';
        console.error('[lineAuth]', err);
        res.status(httpStatus).json({ error: message });
    }
});
//# sourceMappingURL=auth.js.map