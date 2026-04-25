import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firestore';

export const sitesRouter = Router();

// GET /admin/sites?active=true
sitesRouter.get('/', async (req, res) => {
  try {
    const { active } = req.query as Record<string, string | undefined>;
    let query = db().collection('sites').orderBy('name.en');
    if (active !== undefined) query = query.where('active', '==', active === 'true');

    const snap = await query.get();
    const sites = snap.docs.map((d) => ({ siteId: d.id, ...d.data() }));
    res.json({ sites });
  } catch (err) {
    console.error('[admin/sites] list', err);
    res.status(500).json({ error: 'Failed to list sites' });
  }
});

// GET /admin/sites/:siteId
sitesRouter.get('/:siteId', async (req, res) => {
  try {
    const doc = await db().collection('sites').doc(req.params.siteId).get();
    if (!doc.exists) { res.status(404).json({ error: 'Site not found' }); return; }
    res.json({ siteId: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[admin/sites] get', err);
    res.status(500).json({ error: 'Failed to get site' });
  }
});

// POST /admin/sites
sitesRouter.post('/', async (req, res) => {
  try {
    const { id, name, addr, lat, lng, radiusM } = req.body as {
      id?: string; name?: { th: string; en: string };
      addr?: { th: string; en: string };
      lat?: number; lng?: number; radiusM?: number;
    };

    if (!name || !addr || lat === undefined || lng === undefined || radiusM === undefined) {
      res.status(400).json({ error: 'name, addr, lat, lng, and radiusM are required' });
      return;
    }

    const data = {
      name, addr, lat, lng, radiusM,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    let siteId: string;
    if (id) {
      await db().collection('sites').doc(id).set(data);
      siteId = id;
    } else {
      const ref = await db().collection('sites').add(data);
      siteId = ref.id;
    }

    res.status(201).json({ siteId, ...data });
  } catch (err) {
    console.error('[admin/sites] create', err);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// PATCH /admin/sites/:siteId
sitesRouter.patch('/:siteId', async (req, res) => {
  try {
    const { name, addr, lat, lng, radiusM } = req.body as {
      name?: { th: string; en: string };
      addr?: { th: string; en: string };
      lat?: number; lng?: number; radiusM?: number;
    };

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (name !== undefined) updates.name = name;
    if (addr !== undefined) updates.addr = addr;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;
    if (radiusM !== undefined) updates.radiusM = radiusM;

    await db().collection('sites').doc(req.params.siteId).update(updates);
    const doc = await db().collection('sites').doc(req.params.siteId).get();
    res.json({ siteId: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[admin/sites] update', err);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// PATCH /admin/sites/:siteId/deactivate
sitesRouter.patch('/:siteId/deactivate', async (req, res) => {
  try {
    await db().collection('sites').doc(req.params.siteId).update({
      active: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ siteId: req.params.siteId, active: false });
  } catch (err) {
    console.error('[admin/sites] deactivate', err);
    res.status(500).json({ error: 'Failed to deactivate site' });
  }
});

// PATCH /admin/sites/:siteId/activate
sitesRouter.patch('/:siteId/activate', async (req, res) => {
  try {
    await db().collection('sites').doc(req.params.siteId).update({
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ siteId: req.params.siteId, active: true });
  } catch (err) {
    console.error('[admin/sites] activate', err);
    res.status(500).json({ error: 'Failed to activate site' });
  }
});
