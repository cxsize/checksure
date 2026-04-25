import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { lineAuth } from './handlers/auth';
export { onAttendanceUpdate } from './handlers/attendance';
export { clockInReminder } from './handlers/clockReminder';
export { adminApi } from './admin/app';
