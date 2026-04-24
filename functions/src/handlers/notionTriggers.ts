import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import type { Timestamp } from 'firebase-admin/firestore';
import { upsertAttendance, upsertLeaveRequest } from '../services/notion';

export const syncAttendanceToNotion = onDocumentWritten(
  { document: 'attendance/{uid}/records/{date}', region: 'asia-southeast1' },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return; // Document was deleted

    const { uid, date } = event.params;

    const userSnap = await getFirestore().collection('users').doc(uid).get();
    const user = userSnap.data();

    const clockInTs = after.clockIn as Timestamp | null;
    const clockOutTs = after.clockOut as Timestamp | null;

    try {
      await upsertAttendance({
        uid,
        date,
        displayName: user?.displayName as string | undefined,
        employeeId: user?.employeeId as string | undefined,
        clockIn: clockInTs ? clockInTs.toDate().toISOString() : null,
        clockOut: clockOutTs ? clockOutTs.toDate().toISOString() : null,
        breakMinutes: (after.breakMinutes as number) ?? 0,
        workedMinutes: (after.workedMinutes as number) ?? 0,
        otMinutes: (after.otMinutes as number) ?? 0,
        siteId: (after.siteId as string | null) ?? null,
        status: after.status as 'in' | 'out' | 'break',
      });
    } catch (err) {
      console.error('[syncAttendanceToNotion]', err);
    }
  },
);

export const syncLeaveToNotion = onDocumentWritten(
  { document: 'leaveRequests/{uid}/requests/{requestId}', region: 'asia-southeast1' },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return; // Document was deleted

    const { uid, requestId } = event.params;

    const userSnap = await getFirestore().collection('users').doc(uid).get();
    const user = userSnap.data();

    const createdAtTs = after.createdAt as Timestamp | null;

    try {
      await upsertLeaveRequest({
        uid,
        requestId,
        displayName: user?.displayName as string | undefined,
        employeeId: user?.employeeId as string | undefined,
        type: after.type as 'sick' | 'personal' | 'vacation',
        fromDate: after.fromDate as string,
        toDate: after.toDate as string,
        reason: after.reason as string,
        status: after.status as 'pending' | 'approved' | 'rejected',
        createdAt: createdAtTs ? createdAtTs.toDate().toISOString() : new Date().toISOString(),
      });
    } catch (err) {
      console.error('[syncLeaveToNotion]', err);
    }
  },
);
