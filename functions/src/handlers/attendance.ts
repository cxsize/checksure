import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

/**
 * When an attendance record is updated with a clockOut timestamp,
 * calculate workedMinutes and otMinutes server-side to avoid client clock drift.
 */
export const onAttendanceUpdate = onDocumentUpdated(
  {
    document: 'attendance/{uid}/records/{date}',
    region: 'asia-southeast1',
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Only trigger when clockOut is first set (was null, now has a value)
    if (before.clockOut !== null || !(after.clockOut instanceof Timestamp)) return;

    // Avoid infinite loop — if workedMinutes is already calculated by this function, skip
    if (after.workedMinutes > 0) return;

    const clockIn = after.clockIn as Timestamp;
    const clockOut = after.clockOut as Timestamp;
    if (!(clockIn instanceof Timestamp)) return;

    const workedMs = clockOut.toMillis() - clockIn.toMillis();
    const workedMinutes = Math.max(0, Math.floor(workedMs / 60000));
    const otMinutes = Math.max(0, workedMinutes - 480); // 8h = 480min

    await getFirestore()
      .doc(event.data!.after.ref.path)
      .update({ workedMinutes, otMinutes });
  },
);
