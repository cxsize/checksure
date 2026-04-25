import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithCustomToken,
  signOut as fbSignOut, onAuthStateChanged,
  connectAuthEmulator,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
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
const firestoreDb = import.meta.env.VITE_FIRESTORE_DB || '(default)';
export const db = getFirestore(app, firestoreDb);

// Connect to local emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
}

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
  shift: number;
  clockIn: Timestamp | null;
  clockOut: Timestamp | null;
  workedMinutes: number;
  otMinutes: number;
  siteId: string | null;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get all shifts for today, ordered by shift number */
export async function getTodayShifts(uid: string): Promise<AttendanceRecord[]> {
  const key = todayKey();
  const q = query(
    collection(db, 'attendance', uid, 'records'),
    orderBy('shift', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as AttendanceRecord)
    .filter((r) => r.date === key);
}

export async function clockIn(uid: string, siteId: string): Promise<number> {
  const key = todayKey();
  // Find existing shifts today to determine shift number
  const existing = await getTodayShifts(uid);
  const shiftNum = existing.length + 1;
  const docId = `${key}_shift${shiftNum}`;
  await setDoc(doc(db, 'attendance', uid, 'records', docId), {
    date: key,
    shift: shiftNum,
    clockIn: serverTimestamp(),
    clockOut: null,
    workedMinutes: 0,
    otMinutes: 0,
    siteId,
  });
  return shiftNum;
}

export async function clockOut(uid: string): Promise<void> {
  const key = todayKey();
  // Find the latest open shift (no clockOut)
  const shifts = await getTodayShifts(uid);
  const openShift = shifts.find((s) => s.clockOut === null);
  if (!openShift) return;
  const docId = `${key}_shift${openShift.shift}`;
  const ref = doc(db, 'attendance', uid, 'records', docId);
  // workedMinutes/otMinutes are calculated server-side by onAttendanceUpdate Cloud Function.
  await updateDoc(ref, { clockOut: serverTimestamp() });
}

/** Get all records (all shifts), most recent first */
export async function getWeekRecords(uid: string): Promise<AttendanceRecord[]> {
  const q = query(collection(db, 'attendance', uid, 'records'), orderBy('date', 'desc'), limit(60));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AttendanceRecord);
}

/** Get all records for a given month (YYYY-MM) */
export async function getMonthRecords(uid: string, yearMonth: string): Promise<AttendanceRecord[]> {
  const startDate = `${yearMonth}-01`;
  const endDate = `${yearMonth}-31`; // safe: Firestore string compare handles this
  const q = query(
    collection(db, 'attendance', uid, 'records'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AttendanceRecord);
}

// ─── Sites ───────────────────────────────────────────────────────────────────

export interface SiteRecord {
  name: { th: string; en: string };
  addr: { th: string; en: string };
  lat: number;
  lng: number;
  radiusM: number;
  active: boolean;
}

export async function getSites(): Promise<(SiteRecord & { id: string })[]> {
  const q = query(collection(db, 'sites'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SiteRecord) }));
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

export async function cancelLeaveRequest(uid: string, requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'leaveRequests', uid, 'requests', requestId));
}
