import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const db = getFirestore();
const messaging = getMessaging();

/**
 * Runs every weekday at 07:30 ICT (00:30 UTC).
 * Sends a push notification to employees who haven't clocked in yet today.
 */
export const clockInReminder = onSchedule(
  {
    schedule: '30 0 * * 1-5', // 00:30 UTC = 07:30 ICT, Mon-Fri
    timeZone: 'Asia/Bangkok',
    region: 'asia-southeast1',
  },
  async () => {
    const today = formatDate(new Date());

    // Get all active users with notificationsEnabled
    const usersSnap = await db
      .collection('users')
      .where('active', '!=', false)
      .where('notificationsEnabled', '==', true)
      .get();

    const sendPromises: Promise<void>[] = [];

    for (const userDoc of usersSnap.docs) {
      sendPromises.push(checkAndNotify(userDoc.id, userDoc.data(), today));
    }

    const results = await Promise.allSettled(sendPromises);
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`Clock-in reminder: ${sent} sent, ${failed} failed`);
  },
);

async function checkAndNotify(uid: string, userData: FirebaseFirestore.DocumentData, today: string) {
  // Check if user already has a clock-in record for today
  const recordsSnap = await db
    .collection('attendance')
    .doc(uid)
    .collection('records')
    .where('date', '==', today)
    .limit(1)
    .get();

  if (!recordsSnap.empty) return; // Already clocked in

  // Get user's FCM tokens
  const tokensSnap = await db.collection('users').doc(uid).collection('fcmTokens').get();
  if (tokensSnap.empty) return;

  const tokens = tokensSnap.docs.map((d) => d.data().token as string);
  const lang = userData.lang || 'th';

  const title = lang === 'en' ? 'Clock-in Reminder' : 'แจ้งเตือนลงเวลาเข้างาน';
  const body = lang === 'en'
    ? "Good morning! Don't forget to clock in today."
    : 'สวัสดีตอนเช้า! อย่าลืมลงเวลาเข้างานวันนี้';

  // Send to all registered devices
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { type: 'clock_reminder', date: today },
    webpush: {
      fcmOptions: { link: '/' },
    },
  });

  // Clean up invalid tokens
  const invalidTokens: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (resp.error && (
      resp.error.code === 'messaging/invalid-registration-token' ||
      resp.error.code === 'messaging/registration-token-not-registered'
    )) {
      invalidTokens.push(tokens[idx]);
    }
  });

  if (invalidTokens.length > 0) {
    const batch = db.batch();
    for (const token of invalidTokens) {
      batch.delete(db.collection('users').doc(uid).collection('fcmTokens').doc(token));
    }
    await batch.commit();
  }
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
