import { initializeApp } from 'firebase/app';
<<<<<<< HEAD
import { getAuth, signInWithCustomToken, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  getFirestore,
=======
import {
  getAuth, signInWithCustomToken,
  signOut as fbSignOut, onAuthStateChanged,
  connectAuthEmulator,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
>>>>>>> f5a1890dcc3c297347a1f7a14f6c4cf4ecd0e81e
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

<<<<<<< HEAD
=======
// Connect to local emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
}

>>>>>>> f5a1890dcc3c297347a1f7a14f6c4cf4ecd0e81e
// ─── Auth ───────────────────────────────────────────────────────────────────

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithLineToken(customToken: string) {
  return signInWithCustomToken(auth, customToken);
}

export async function signOut() {
  return fbSignOut(auth);
}

// ─── User profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  lineId: string;
  displayName: string;
  pictureUrl: string;
  employeeId: string;
  dept: { th: string; en: string };
  assignedSites: string[];
  lang: 'th' | 'en';
  theme: 'warm' | 'neutral' | 'contrast';
  notificationsEnabled: boolean;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function upsertUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  date: string;
  clockIn: Timestamp | null;
  clockOut: Timestamp | null;
  breakMinutes: number;
  workedMinutes: number;
  otMinutes: number;
  siteId: string | null;
  status: 'in' | 'out' | 'break';
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getTodayRecord(uid: string): Promise<AttendanceRecord | null> {
  const snap = await getDoc(doc(db, 'attendance', uid, 'records', todayKey()));
  return snap.exists() ? (snap.data() as AttendanceRecord) : null;
}

export async function clockIn(uid: string, siteId: string): Promise<void> {
  const key = todayKey();
  await setDoc(doc(db, 'attendance', uid, 'records', key), {
    date: key,
    clockIn: serverTimestamp(),
    clockOut: null,
    breakMinutes: 0,
    workedMinutes: 0,
    otMinutes: 0,
    siteId,
    status: 'in',
  });
}

export async function clockOut(uid: string): Promise<void> {
  const key = todayKey();
  const ref = doc(db, 'attendance', uid, 'records', key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const record = snap.data() as AttendanceRecord;
  const clockInTs = record.clockIn as Timestamp;
  const now = Timestamp.now();
  const workedMs = now.toMillis() - clockInTs.toMillis() - record.breakMinutes * 60000;
  const workedMinutes = Math.max(0, Math.floor(workedMs / 60000));
  const otMinutes = Math.max(0, workedMinutes - 480);
  await updateDoc(ref, { clockOut: now, workedMinutes, otMinutes, status: 'out' });
}

export async function startBreak(uid: string): Promise<void> {
  await updateDoc(doc(db, 'attendance', uid, 'records', todayKey()), { status: 'break' });
}

export async function endBreak(uid: string, extraMinutes: number): Promise<void> {
  const key = todayKey();
  const ref = doc(db, 'attendance', uid, 'records', key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = (snap.data() as AttendanceRecord).breakMinutes;
  await updateDoc(ref, { breakMinutes: current + extraMinutes, status: 'in' });
}

export async function getWeekRecords(uid: string): Promise<AttendanceRecord[]> {
  const q = query(collection(db, 'attendance', uid, 'records'), orderBy('date', 'desc'), limit(7));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AttendanceRecord);
}

// ─── Leave requests ───────────────────────────────────────────────────────────

export interface LeaveRequest {
  id?: string;
  type: 'sick' | 'personal' | 'vacation';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

export async function submitLeave(uid: string, req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) {
  const ref = doc(collection(db, 'leaveRequests', uid, 'requests'));
  await setDoc(ref, { ...req, status: 'pending', createdAt: serverTimestamp() });
}

export async function getRecentLeaveRequests(uid: string): Promise<LeaveRequest[]> {
  const q = query(collection(db, 'leaveRequests', uid, 'requests'), orderBy('createdAt', 'desc'), limit(5));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaveRequest));
}
