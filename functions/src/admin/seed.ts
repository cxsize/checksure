/**
 * Seed script: populate Firestore `sites` collection and create initial admin user.
 *
 * Usage (from functions/):
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
 *     npx ts-node src/admin/seed.ts
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

initializeApp(
  isEmulator
    ? { projectId: process.env.GCLOUD_PROJECT ?? 'demo-checksure' }
    : { credential: applicationDefault() },
);

const db = getFirestore('db-checksure');

const SITES = [
  {
    id: 'plant-a',
    name: { th: 'โรงงานพระราม 2', en: 'Rama II Plant' },
    addr: { th: 'สมุทรสาคร', en: 'Samut Sakhon' },
    lat: 13.614,
    lng: 100.499,
    radiusM: 200,
    active: true,
  },
  {
    id: 'plant-b',
    name: { th: 'โรงงานบางนา', en: 'Bang Na Plant' },
    addr: { th: 'สมุทรปราการ', en: 'Samut Prakan' },
    lat: 13.694,
    lng: 100.674,
    radiusM: 200,
    active: true,
  },
  {
    id: 'plant-c',
    name: { th: 'คลังสินค้าลาดกระบัง', en: 'Lat Krabang Warehouse' },
    addr: { th: 'กรุงเทพฯ', en: 'Bangkok' },
    lat: 13.727,
    lng: 100.758,
    radiusM: 200,
    active: true,
  },
];

async function seedSites() {
  const batch = db.batch();
  for (const site of SITES) {
    const { id, ...data } = site;
    batch.set(db.collection('sites').doc(id), data);
  }
  await batch.commit();
  console.log(`Seeded ${SITES.length} sites`);
}

async function seedAdmin() {
  const email = 'admin@checksure.local';
  const password = 'admin123456';

  let uid: string;
  try {
    const user = await getAuth().createUser({ email, password, displayName: 'Admin' });
    uid = user.uid;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'auth/email-already-exists') {
      const user = await getAuth().getUserByEmail(email);
      uid = user.uid;
      console.log('Admin user already exists, updating Firestore doc');
    } else {
      throw err;
    }
  }

  await db.collection('users').doc(uid).set(
    {
      email,
      displayName: 'Admin',
      role: 'admin',
      active: true,
      siteIds: [],
      pictureUrl: '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`Admin user seeded: ${email} / ${password} (uid: ${uid})`);
}

async function seed() {
  await seedSites();
  await seedAdmin();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
