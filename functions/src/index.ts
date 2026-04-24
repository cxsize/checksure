import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { lineAuth } from './handlers/auth';
export { syncAttendanceToNotion, syncLeaveToNotion } from './handlers/notionTriggers';
