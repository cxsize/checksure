/**
 * Admin API client — wraps fetch calls to the adminApi Cloud Function endpoints.
 */

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-ezpeople';
const BASE = import.meta.env.DEV
  ? `http://localhost:5001/${projectId}/asia-southeast1/adminApi`
  : '/api'; // In production, configure Firebase Hosting rewrites to proxy /api → adminApi

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface AdminUser {
  uid: string;
  email?: string;
  displayName?: string;
  role?: string;
  active?: boolean;
  siteIds?: string[];
  pictureUrl?: string;
  dept?: { th: string; en: string };
  employeeId?: string;
}

export async function listUsers(params?: { role?: string; limit?: number; startAfter?: string }) {
  const qs = new URLSearchParams();
  if (params?.role) qs.set('role', params.role);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.startAfter) qs.set('startAfter', params.startAfter);
  const q = qs.toString();
  return request<{ users: AdminUser[]; nextCursor: string | null }>(`/admin/users${q ? `?${q}` : ''}`);
}

export async function getUser(uid: string) {
  return request<AdminUser>(`/admin/users/${uid}`);
}

export async function createUser(data: { email: string; password: string; displayName: string; role?: string; siteIds?: string[] }) {
  return request<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(uid: string, data: { displayName?: string; role?: string; siteIds?: string[] }) {
  return request<AdminUser>(`/admin/users/${uid}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deactivateUser(uid: string) {
  return request<{ uid: string; active: boolean }>(`/admin/users/${uid}/deactivate`, { method: 'PATCH' });
}

export async function activateUser(uid: string) {
  return request<{ uid: string; active: boolean }>(`/admin/users/${uid}/activate`, { method: 'PATCH' });
}

// ─── Sites ───────────────────────────────────────────────────────────────────

export interface AdminSite {
  siteId: string;
  name: { th: string; en: string };
  addr: { th: string; en: string };
  lat: number;
  lng: number;
  radiusM: number;
  active: boolean;
}

export async function listSites(params?: { active?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.active !== undefined) qs.set('active', String(params.active));
  const q = qs.toString();
  return request<{ sites: AdminSite[] }>(`/admin/sites${q ? `?${q}` : ''}`);
}

export async function createSite(data: { id?: string; name: { th: string; en: string }; addr: { th: string; en: string }; lat: number; lng: number; radiusM: number }) {
  return request<AdminSite>('/admin/sites', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSite(siteId: string, data: Partial<{ name: { th: string; en: string }; addr: { th: string; en: string }; lat: number; lng: number; radiusM: number }>) {
  return request<AdminSite>(`/admin/sites/${siteId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deactivateSite(siteId: string) {
  return request<{ siteId: string; active: boolean }>(`/admin/sites/${siteId}/deactivate`, { method: 'PATCH' });
}

export async function activateSite(siteId: string) {
  return request<{ siteId: string; active: boolean }>(`/admin/sites/${siteId}/activate`, { method: 'PATCH' });
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface AttendanceRow {
  id: string;
  date: string;
  shift: number;
  clockIn: string | null;
  clockOut: string | null;
  workedMinutes: number;
  otMinutes: number;
  siteId: string | null;
}

export async function queryAttendance(params: { uid: string; startDate?: string; endDate?: string; limit?: number; startAfter?: string }) {
  const qs = new URLSearchParams({ uid: params.uid });
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.startAfter) qs.set('startAfter', params.startAfter);
  return request<{ records: AttendanceRow[]; nextCursor: string | null }>(`/admin/attendance?${qs}`);
}

// ─── Leave Requests ──────────────────────────────────────────────────────────

export interface LeaveRow {
  id: string;
  uid: string;
  type: 'sick' | 'personal' | 'vacation';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export async function listLeaveRequests(params?: { uid?: string; status?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.uid) qs.set('uid', params.uid);
  if (params?.status) qs.set('status', params.status);
  if (params?.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return request<{ requests: LeaveRow[]; nextCursor: string | null }>(`/admin/leave${q ? `?${q}` : ''}`);
}

export async function approveLeave(uid: string, requestId: string, comment?: string) {
  return request<{ id: string; uid: string; status: string }>(`/admin/leave/${uid}/${requestId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ comment }),
  });
}

export async function rejectLeave(uid: string, requestId: string, comment?: string) {
  return request<{ id: string; uid: string; status: string }>(`/admin/leave/${uid}/${requestId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ comment }),
  });
}
