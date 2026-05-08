import { Router } from 'express';
import { db } from '../../firestore';

export const attendanceRouter = Router();

// GET /admin/attendance?uid=&startDate=&endDate=&limit=&startAfter=
attendanceRouter.get('/', async (req, res) => {
  try {
    const { uid, startDate, endDate, limit: limitStr, startAfter } = req.query as Record<string, string | undefined>;
    const limit = Math.min(Number(limitStr) || 50, 200);

    if (!uid) {
      res.status(400).json({ error: 'uid query parameter is required' });
      return;
    }

    let query = db()
      .collection('attendance').doc(uid).collection('records')
      .orderBy('date', 'desc')
      .limit(limit);

    if (startDate) query = query.where('date', '>=', startDate);
    if (endDate) query = query.where('date', '<=', endDate);
    if (startAfter) {
      const cursor = await db()
        .collection('attendance').doc(uid).collection('records')
        .doc(startAfter).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }

    const snap = await query.get();
    const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
    res.json({ records, nextCursor });
  } catch (err) {
    console.error('[admin/attendance] list', err);
    res.status(500).json({ error: 'Failed to list attendance records' });
  }
});
