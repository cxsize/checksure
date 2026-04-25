import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firestore';

export const leaveRouter = Router();

// GET /admin/leave?uid=&status=&limit=&startAfter=
// If uid is omitted, returns leave requests across all users
leaveRouter.get('/', async (req, res) => {
  try {
    const { uid, status, limit: limitStr, startAfter } = req.query as Record<string, string | undefined>;
    const limit = Math.min(Number(limitStr) || 50, 200);

    if (uid) {
      // Query specific user's leave requests
      let query = db()
        .collection('leaveRequests').doc(uid).collection('requests')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) query = query.where('status', '==', status);
      if (startAfter) {
        const cursor = await db()
          .collection('leaveRequests').doc(uid).collection('requests')
          .doc(startAfter).get();
        if (cursor.exists) query = query.startAfter(cursor);
      }

      const snap = await query.get();
      const requests = snap.docs.map((d) => ({ id: d.id, uid, ...d.data() }));
      const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
      res.json({ requests, nextCursor });
    } else {
      // Query across all users using collectionGroup
      let query = db()
        .collectionGroup('requests')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) query = query.where('status', '==', status);

      const snap = await query.get();
      const requests = snap.docs.map((d) => {
        // Path: leaveRequests/{uid}/requests/{requestId}
        const pathParts = d.ref.path.split('/');
        const reqUid = pathParts[1];
        return { id: d.id, uid: reqUid, ...d.data() };
      });
      const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
      res.json({ requests, nextCursor });
    }
  } catch (err) {
    console.error('[admin/leave] list', err);
    res.status(500).json({ error: 'Failed to list leave requests' });
  }
});

// GET /admin/leave/:uid/:requestId
leaveRouter.get('/:uid/:requestId', async (req, res) => {
  try {
    const { uid, requestId } = req.params;
    const docRef = db().collection('leaveRequests').doc(uid).collection('requests').doc(requestId);
    const snap = await docRef.get();
    if (!snap.exists) { res.status(404).json({ error: 'Leave request not found' }); return; }
    res.json({ id: snap.id, uid, ...snap.data() });
  } catch (err) {
    console.error('[admin/leave] get', err);
    res.status(500).json({ error: 'Failed to get leave request' });
  }
});

// PATCH /admin/leave/:uid/:requestId/approve
leaveRouter.patch('/:uid/:requestId/approve', async (req, res) => {
  try {
    const { uid, requestId } = req.params;
    const { comment } = req.body as { comment?: string };
    const docRef = db().collection('leaveRequests').doc(uid).collection('requests').doc(requestId);

    const snap = await docRef.get();
    if (!snap.exists) { res.status(404).json({ error: 'Leave request not found' }); return; }

    const updates: Record<string, unknown> = {
      status: 'approved',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: (req as unknown as { adminUser?: { uid: string } }).adminUser?.uid || 'admin',
    };
    if (comment) updates.reviewComment = comment;

    await docRef.update(updates);
    res.json({ id: requestId, uid, status: 'approved' });
  } catch (err) {
    console.error('[admin/leave] approve', err);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// PATCH /admin/leave/:uid/:requestId/reject
leaveRouter.patch('/:uid/:requestId/reject', async (req, res) => {
  try {
    const { uid, requestId } = req.params;
    const { comment } = req.body as { comment?: string };
    const docRef = db().collection('leaveRequests').doc(uid).collection('requests').doc(requestId);

    const snap = await docRef.get();
    if (!snap.exists) { res.status(404).json({ error: 'Leave request not found' }); return; }

    const updates: Record<string, unknown> = {
      status: 'rejected',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: (req as unknown as { adminUser?: { uid: string } }).adminUser?.uid || 'admin',
    };
    if (comment) updates.reviewComment = comment;

    await docRef.update(updates);
    res.json({ id: requestId, uid, status: 'rejected' });
  } catch (err) {
    console.error('[admin/leave] reject', err);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});
