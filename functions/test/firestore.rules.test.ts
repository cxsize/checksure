import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

const PROJECT_ID = 'rules-test';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules, host: 'localhost', port: 8080 },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// ─── Users ────────────────────────────────────────────────────────────────────

describe('users rules', () => {
  it('allows authenticated user to read own profile', async () => {
    // Seed data via admin
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/user1'), {
        displayName: 'Test', lang: 'th', theme: 'warm', notificationsEnabled: false,
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(getDoc(doc(user1.firestore(), 'users/user1')));
  });

  it('denies authenticated user from reading another user profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/user2'), { displayName: 'Other' });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(getDoc(doc(user1.firestore(), 'users/user2')));
  });

  it('denies unauthenticated read', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/user1'), { displayName: 'Test' });
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), 'users/user1')));
  });

  it('allows user to update own preferences (lang, theme, notificationsEnabled)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/user1'), {
        displayName: 'Test', lang: 'th', theme: 'warm', notificationsEnabled: false,
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(
      updateDoc(doc(user1.firestore(), 'users/user1'), { lang: 'en' }),
    );
    await assertSucceeds(
      updateDoc(doc(user1.firestore(), 'users/user1'), { theme: 'contrast' }),
    );
    await assertSucceeds(
      updateDoc(doc(user1.firestore(), 'users/user1'), { notificationsEnabled: true }),
    );
  });

  it('denies user from updating non-preference fields', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/user1'), {
        displayName: 'Test', lang: 'th', theme: 'warm', role: 'employee',
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      updateDoc(doc(user1.firestore(), 'users/user1'), { role: 'admin' }),
    );
    await assertFails(
      updateDoc(doc(user1.firestore(), 'users/user1'), { displayName: 'Hacker' }),
    );
  });

  it('denies client from creating user document', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'users/user1'), { displayName: 'New' }),
    );
  });

  it('denies client from deleting user document', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/user1'), { displayName: 'Test' });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(deleteDoc(doc(user1.firestore(), 'users/user1')));
  });
});

// ─── Attendance ───────────────────────────────────────────────────────────────

describe('attendance rules', () => {
  const validRecord = {
    date: '2026-04-25',
    shift: 1,
    clockIn: serverTimestamp(),
    clockOut: null,
    workedMinutes: 0,
    otMinutes: 0,
    siteId: 'plant-a',
  };

  it('allows user to create valid attendance record', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(
      setDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1'), validRecord),
    );
  });

  it('denies creating record for another user', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'attendance/user2/records/2026-04-25_shift1'), validRecord),
    );
  });

  it('denies creating record with non-null clockOut', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        ...validRecord,
        clockOut: serverTimestamp(),
      }),
    );
  });

  it('denies creating record with non-zero workedMinutes', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        ...validRecord,
        workedMinutes: 480,
      }),
    );
  });

  it('denies creating record missing required fields', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        date: '2026-04-25',
        shift: 1,
        // missing clockIn, clockOut, workedMinutes, otMinutes, siteId
      }),
    );
  });

  it('allows user to update clockOut on own open record', async () => {
    // Seed an open record via admin
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        date: '2026-04-25',
        shift: 1,
        clockIn: new Date('2026-04-25T09:00:00'),
        clockOut: null,
        workedMinutes: 0,
        otMinutes: 0,
        siteId: 'plant-a',
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(
      updateDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        clockOut: serverTimestamp(),
      }),
    );
  });

  it('denies updating clockOut on already-closed record', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        date: '2026-04-25',
        shift: 1,
        clockIn: new Date('2026-04-25T09:00:00'),
        clockOut: new Date('2026-04-25T17:00:00'),
        workedMinutes: 480,
        otMinutes: 0,
        siteId: 'plant-a',
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      updateDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        clockOut: serverTimestamp(),
      }),
    );
  });

  it('denies changing clockIn on update', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        date: '2026-04-25',
        shift: 1,
        clockIn: new Date('2026-04-25T09:00:00'),
        clockOut: null,
        workedMinutes: 0,
        otMinutes: 0,
        siteId: 'plant-a',
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      updateDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        clockIn: new Date('2026-04-25T08:00:00'),
      }),
    );
  });

  it('allows user to read own attendance', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        date: '2026-04-25', shift: 1, clockIn: new Date(), clockOut: null,
        workedMinutes: 0, otMinutes: 0, siteId: 'plant-a',
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(getDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1')));
  });

  it('denies reading another user attendance', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'attendance/user2/records/2026-04-25_shift1'), {
        date: '2026-04-25', shift: 1, clockIn: new Date(), clockOut: null,
        workedMinutes: 0, otMinutes: 0, siteId: 'plant-a',
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(getDoc(doc(user1.firestore(), 'attendance/user2/records/2026-04-25_shift1')));
  });

  it('denies deleting attendance records', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'attendance/user1/records/2026-04-25_shift1'), {
        date: '2026-04-25', shift: 1, clockIn: new Date(), clockOut: null,
        workedMinutes: 0, otMinutes: 0, siteId: 'plant-a',
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(deleteDoc(doc(user1.firestore(), 'attendance/user1/records/2026-04-25_shift1')));
  });
});

// ─── Leave Requests ──────────────────────────────────────────────────────────

describe('leave request rules', () => {
  it('allows user to create valid leave request', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(
      setDoc(doc(user1.firestore(), 'leaveRequests/user1/requests/req1'), {
        type: 'sick',
        fromDate: '2026-04-28',
        toDate: '2026-04-29',
        reason: 'Flu',
        status: 'pending',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('denies creating leave request with non-pending status', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'leaveRequests/user1/requests/req1'), {
        type: 'sick',
        fromDate: '2026-04-28',
        toDate: '2026-04-29',
        reason: 'Flu',
        status: 'approved',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('denies creating leave request with invalid type', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'leaveRequests/user1/requests/req1'), {
        type: 'unlimited',
        fromDate: '2026-04-28',
        toDate: '2026-04-29',
        reason: 'PTO',
        status: 'pending',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('denies creating leave request for another user', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'leaveRequests/user2/requests/req1'), {
        type: 'sick',
        fromDate: '2026-04-28',
        toDate: '2026-04-29',
        reason: 'Flu',
        status: 'pending',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('denies updating leave requests', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'leaveRequests/user1/requests/req1'), {
        type: 'sick', fromDate: '2026-04-28', toDate: '2026-04-29',
        reason: 'Flu', status: 'pending', createdAt: new Date(),
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      updateDoc(doc(user1.firestore(), 'leaveRequests/user1/requests/req1'), { status: 'approved' }),
    );
  });

  it('allows user to cancel (delete) own pending leave request', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'leaveRequests/user1/requests/req1'), {
        type: 'sick', fromDate: '2026-04-28', toDate: '2026-04-29',
        reason: 'Flu', status: 'pending', createdAt: new Date(),
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(deleteDoc(doc(user1.firestore(), 'leaveRequests/user1/requests/req1')));
  });

  it('denies cancelling approved leave request', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'leaveRequests/user1/requests/req1'), {
        type: 'sick', fromDate: '2026-04-28', toDate: '2026-04-29',
        reason: 'Flu', status: 'approved', createdAt: new Date(),
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(deleteDoc(doc(user1.firestore(), 'leaveRequests/user1/requests/req1')));
  });

  it('denies cancelling another user leave request', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'leaveRequests/user2/requests/req1'), {
        type: 'sick', fromDate: '2026-04-28', toDate: '2026-04-29',
        reason: 'Flu', status: 'pending', createdAt: new Date(),
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(deleteDoc(doc(user1.firestore(), 'leaveRequests/user2/requests/req1')));
  });
});

// ─── Sites ───────────────────────────────────────────────────────────────────

describe('sites rules', () => {
  it('allows authenticated user to read sites', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sites/plant-a'), {
        name: { en: 'Plant A', th: 'โรงงาน A' },
        lat: 13.7, lng: 100.5, radiusM: 200, active: true,
      });
    });

    const user1 = testEnv.authenticatedContext('user1');
    await assertSucceeds(getDoc(doc(user1.firestore(), 'sites/plant-a')));
  });

  it('denies unauthenticated read of sites', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sites/plant-a'), { name: { en: 'Plant A' } });
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), 'sites/plant-a')));
  });

  it('denies client write to sites', async () => {
    const user1 = testEnv.authenticatedContext('user1');
    await assertFails(
      setDoc(doc(user1.firestore(), 'sites/new-site'), { name: { en: 'Fake' } }),
    );
  });
});
