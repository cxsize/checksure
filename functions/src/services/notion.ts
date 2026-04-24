import { Client } from '@notionhq/client';
import type {
  CreatePageParameters,
  UpdatePageParameters,
} from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const ATTENDANCE_DB = process.env.NOTION_ATTENDANCE_DB_ID ?? '';
const LEAVE_DB = process.env.NOTION_LEAVE_DB_ID ?? '';

type Properties = CreatePageParameters['properties'] & UpdatePageParameters['properties'];

export interface AttendanceSyncData {
  uid: string;
  date: string;
  displayName?: string;
  employeeId?: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workedMinutes: number;
  otMinutes: number;
  siteId: string | null;
  status: 'in' | 'out' | 'break';
}

export interface LeaveSyncData {
  uid: string;
  requestId: string;
  displayName?: string;
  employeeId?: string;
  type: 'sick' | 'personal' | 'vacation';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

async function findPageByFirestoreId(databaseId: string, firestoreId: string): Promise<string | null> {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Firestore ID',
      rich_text: { equals: firestoreId },
    },
  });
  return response.results[0]?.id ?? null;
}

export async function upsertAttendance(data: AttendanceSyncData): Promise<void> {
  if (!ATTENDANCE_DB) {
    console.warn('[notion] NOTION_ATTENDANCE_DB_ID not set — skipping attendance sync');
    return;
  }

  const firestoreId = `${data.uid}_${data.date}`;
  const title = `${data.displayName ?? data.uid} – ${data.date}`;

  const properties: Properties = {
    Name: { title: [{ text: { content: title } }] },
    'Firestore ID': { rich_text: [{ text: { content: firestoreId } }] },
    Date: { date: { start: data.date } },
    'Employee ID': { rich_text: [{ text: { content: data.employeeId ?? '' } }] },
    'Clock In': { rich_text: [{ text: { content: data.clockIn ?? '' } }] },
    'Clock Out': { rich_text: [{ text: { content: data.clockOut ?? '' } }] },
    'Break Minutes': { number: data.breakMinutes },
    'Worked Minutes': { number: data.workedMinutes },
    'OT Minutes': { number: data.otMinutes },
    Site: { rich_text: [{ text: { content: data.siteId ?? '' } }] },
    Status: { select: { name: data.status } },
  };

  const existingPageId = await findPageByFirestoreId(ATTENDANCE_DB, firestoreId);
  if (existingPageId) {
    await notion.pages.update({ page_id: existingPageId, properties });
  } else {
    await notion.pages.create({ parent: { database_id: ATTENDANCE_DB }, properties });
  }
}

export async function upsertLeaveRequest(data: LeaveSyncData): Promise<void> {
  if (!LEAVE_DB) {
    console.warn('[notion] NOTION_LEAVE_DB_ID not set — skipping leave sync');
    return;
  }

  const firestoreId = `${data.uid}_${data.requestId}`;
  const title = `${data.displayName ?? data.uid} – ${data.type} (${data.fromDate})`;

  const properties: Properties = {
    Name: { title: [{ text: { content: title } }] },
    'Firestore ID': { rich_text: [{ text: { content: firestoreId } }] },
    Type: { select: { name: data.type } },
    'From Date': { date: { start: data.fromDate } },
    'To Date': { date: { start: data.toDate } },
    Reason: { rich_text: [{ text: { content: data.reason } }] },
    Status: { select: { name: data.status } },
    'Created At': { date: { start: data.createdAt } },
  };

  const existingPageId = await findPageByFirestoreId(LEAVE_DB, firestoreId);
  if (existingPageId) {
    await notion.pages.update({ page_id: existingPageId, properties });
  } else {
    await notion.pages.create({ parent: { database_id: LEAVE_DB }, properties });
  }
}
