import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const usersRouter = Router();
const db = () => getFirestore();

// GET /admin/users?role=&limit=&startAfter=
usersRouter.get('/', async (req, res) => {
  try {
    const { role, limit: limitStr, startAfter } = req.query as Record<string, string | undefined>;
    const limit = Math.min(Number(limitStr) || 20, 100);

    let query = db().collection('users').orderBy('displayName').limit(limit);
    if (role) query = query.where('role', '==', role);
    if (startAfter) {
      const cursor = await db().collection('users').doc(startAfter).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }

    const snap = await query.get();
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
    res.json({ users, nextCursor });
  } catch (err) {
    console.error('[admin/users] list', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// GET /admin/users/:uid
usersRouter.get('/:uid', async (req, res) => {
  try {
    const doc = await db().collection('users').doc(req.params.uid).get();
    if (!doc.exists) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ uid: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[admin/users] get', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /admin/users  — create employee with email/password
usersRouter.post('/', async (req, res) => {
  try {
    const { email, password, displayName, role, siteIds } = req.body as {
      email?: string; password?: string; displayName?: string;
      role?: string; siteIds?: string[];
    };

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'email, password, and displayName are required' });
      return;
    }

    const validRole = role === 'admin' ? 'admin' : 'employee';
    const userRecord = await getAuth().createUser({ email, password, displayName });

    await db().collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: validRole,
      siteIds: siteIds ?? [],
      active: true,
      pictureUrl: '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ uid: userRecord.uid, email, displayName, role: validRole });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'auth/email-already-exists') {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    console.error('[admin/users] create', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /admin/users/:uid
usersRouter.patch('/:uid', async (req, res) => {
  try {
    const { displayName, role, siteIds } = req.body as {
      displayName?: string; role?: string; siteIds?: string[];
    };

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (displayName !== undefined) updates.displayName = displayName;
    if (role !== undefined) updates.role = role === 'admin' ? 'admin' : 'employee';
    if (siteIds !== undefined) updates.siteIds = siteIds;

    await db().collection('users').doc(req.params.uid).update(updates);

    if (displayName) {
      await getAuth().updateUser(req.params.uid, { displayName });
    }

    const doc = await db().collection('users').doc(req.params.uid).get();
    res.json({ uid: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[admin/users] update', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH /admin/users/:uid/deactivate
usersRouter.patch('/:uid/deactivate', async (req, res) => {
  try {
    await getAuth().updateUser(req.params.uid, { disabled: true });
    await db().collection('users').doc(req.params.uid).update({
      active: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ uid: req.params.uid, active: false });
  } catch (err) {
    console.error('[admin/users] deactivate', err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// PATCH /admin/users/:uid/activate
usersRouter.patch('/:uid/activate', async (req, res) => {
  try {
    await getAuth().updateUser(req.params.uid, { disabled: false });
    await db().collection('users').doc(req.params.uid).update({
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ uid: req.params.uid, active: true });
  } catch (err) {
    console.error('[admin/users] activate', err);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});
