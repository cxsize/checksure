export type ThemeKey = 'warm' | 'neutral' | 'contrast';

export interface Theme {
  bg: string;
  card: string;
  surface: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  line: string;
  primary: string;
  primaryInk: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  warn: string;
  warnSoft: string;
  chipBg: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
  warm: {
    bg: '#FBF4EC',
    card: '#FFFFFF',
    surface: '#FFF9F2',
    ink: '#2B1D15',
    inkSoft: '#6B5648',
    inkMute: '#9A8678',
    line: '#EDE2D4',
    primary: '#E06B3E',
    primaryInk: '#FFFFFF',
    primarySoft: '#FBDFCF',
    accent: '#2F5D50',
    accentSoft: '#D8E8DF',
    warn: '#D14B4B',
    warnSoft: '#FADEDE',
    chipBg: '#F4E8D9',
  },
  neutral: {
    bg: '#F4F5F6',
    card: '#FFFFFF',
    surface: '#FAFAFB',
    ink: '#111417',
    inkSoft: '#4A5058',
    inkMute: '#8A9099',
    line: '#E6E8EB',
    primary: '#2563EB',
    primaryInk: '#FFFFFF',
    primarySoft: '#DCE7FB',
    accent: '#0D9488',
    accentSoft: '#CFEEE9',
    warn: '#DC2626',
    warnSoft: '#FCE0E0',
    chipBg: '#EEF0F2',
  },
  contrast: {
    bg: '#0F1115',
    card: '#1A1D23',
    surface: '#242831',
    ink: '#FFFFFF',
    inkSoft: '#B9C0CB',
    inkMute: '#7B8494',
    line: '#2F343D',
    primary: '#FFB020',
    primaryInk: '#0F1115',
    primarySoft: '#3A2E14',
    accent: '#4ADE80',
    accentSoft: '#1F3A2A',
    warn: '#F87171',
    warnSoft: '#3A1E1E',
    chipBg: '#242831',
  },
};

export const FONT_TH = '"Noto Sans Thai", "Noto Sans Thai Looped", system-ui, sans-serif';
export const FONT_EN = '"Plus Jakarta Sans", "Noto Sans Thai", system-ui, sans-serif';
export const FONT_NUM = '"Plus Jakarta Sans", "SF Pro Display", system-ui, sans-serif';

export type Lang = 'th' | 'en';

export type CopyKey = keyof typeof COPY;
export const COPY = {
  appName:       { th: 'เช็คชัวร์', en: 'CheckSure' },
  welcome:       { th: 'ยินดีต้อนรับ', en: 'Welcome' },
  loginLine:     { th: 'เข้าสู่ระบบด้วย LINE', en: 'Continue with LINE' },
  loginNote:     { th: 'ใช้บัญชี LINE ของคุณเพื่อเริ่มใช้งาน', en: 'Use your LINE account to get started' },
  hi:            { th: 'สวัสดี', en: 'Hi' },
  today:         { th: 'วันนี้', en: 'Today' },
  notClockedIn:  { th: 'ยังไม่ได้ลงเวลา', en: 'Not clocked in' },
  clockedIn:     { th: 'กำลังทำงาน', en: 'Clocked in' },
  onBreak:       { th: 'กำลังพัก', en: 'On break' },
  clockIn:       { th: 'ลงเวลาเข้า', en: 'Clock In' },
  clockOut:      { th: 'ลงเวลาออก', en: 'Clock Out' },
  startBreak:    { th: 'เริ่มพัก', en: 'Start Break' },
  endBreak:      { th: 'จบพัก', en: 'End Break' },
  hoursWorked:   { th: 'ชั่วโมงทำงาน', en: 'Hours worked' },
  hours:         { th: 'ชม.', en: 'h' },
  minutes:       { th: 'นาที', en: 'min' },
  overtime:      { th: 'ล่วงเวลา', en: 'OT' },
  site:          { th: 'สถานที่', en: 'Site' },
  pickSite:      { th: 'เลือกสถานที่ทำงาน', en: 'Choose a site' },
  inArea:        { th: 'อยู่ในพื้นที่', en: 'Inside area' },
  outArea:       { th: 'อยู่นอกพื้นที่', en: 'Outside area' },
  distance:      { th: 'ห่าง', en: 'Distance' },
  meters:        { th: 'ม.', en: 'm' },
  confirmIn:     { th: 'ยืนยันเข้างาน', en: 'Confirm clock-in' },
  confirmOut:    { th: 'ยืนยันออกงาน', en: 'Confirm clock-out' },
  success:       { th: 'สำเร็จ', en: 'Done!' },
  successIn:     { th: 'ลงเวลาเข้าเรียบร้อย', en: "You're clocked in" },
  successOut:    { th: 'ลงเวลาออกเรียบร้อย', en: "You're clocked out" },
  backHome:      { th: 'กลับหน้าหลัก', en: 'Back to home' },
  home:          { th: 'หน้าหลัก', en: 'Home' },
  history:       { th: 'ประวัติ', en: 'History' },
  leave:         { th: 'ลา', en: 'Leave' },
  profile:       { th: 'โปรไฟล์', en: 'Profile' },
  summary:       { th: 'สรุป', en: 'Summary' },
  thisMonth:     { th: 'เดือนนี้', en: 'This month' },
  totalHours:    { th: 'ชั่วโมงรวม', en: 'Total hours' },
  daysWorked:    { th: 'วันทำงาน', en: 'Days worked' },
  otThisMonth:   { th: 'OT เดือนนี้', en: 'OT this month' },
  payslip:       { th: 'ดูสลิปเงินเดือน', en: 'View payslip' },
  requestLeave:  { th: 'ขอลา', en: 'Request leave' },
  leaveType:     { th: 'ประเภทการลา', en: 'Leave type' },
  leaveSick:     { th: 'ลาป่วย', en: 'Sick' },
  leavePersonal: { th: 'ลากิจ', en: 'Personal' },
  leaveVacation: { th: 'ลาพักร้อน', en: 'Vacation' },
  leaveDate:     { th: 'วันที่', en: 'Date' },
  leaveReason:   { th: 'เหตุผล', en: 'Reason' },
  submit:        { th: 'ส่งคำขอ', en: 'Submit' },
  cancel:        { th: 'ยกเลิก', en: 'Cancel' },
  continue:      { th: 'ต่อไป', en: 'Continue' },
  locating:      { th: 'กำลังค้นหาตำแหน่ง...', en: 'Finding your location...' },
  notifReminder: { th: 'อย่าลืมลงเวลา', en: "Don't forget to clock in" },
  empId:         { th: 'รหัสพนักงาน', en: 'Employee ID' },
  dept:          { th: 'แผนก', en: 'Department' },
  settings:      { th: 'ตั้งค่า', en: 'Settings' },
  language:      { th: 'ภาษา', en: 'Language' },
  notif:         { th: 'การแจ้งเตือน', en: 'Notifications' },
  signOut:       { th: 'ออกจากระบบ', en: 'Sign out' },
} as const;

export function c(key: CopyKey, lang: Lang): string {
  return COPY[key][lang];
}

export interface SiteData {
  id: string;
  name: { th: string; en: string };
  addr: { th: string; en: string };
  lat: number;
  lng: number;
  radiusM: number;
  distance: number;
  inside: boolean;
}

export const MOCK_SITES: SiteData[] = [
  { id: 'plant-a', name: { th: 'โรงงานพระราม 2', en: 'Rama II Plant' },     addr: { th: 'สมุทรสาคร', en: 'Samut Sakhon' },   lat: 13.614, lng: 100.499, radiusM: 200, distance: 24,   inside: true },
  { id: 'plant-b', name: { th: 'โรงงานบางนา', en: 'Bang Na Plant' },        addr: { th: 'สมุทรปราการ', en: 'Samut Prakan' }, lat: 13.694, lng: 100.674, radiusM: 200, distance: 1480, inside: false },
  { id: 'plant-c', name: { th: 'คลังสินค้าลาดกระบัง', en: 'Lat Krabang Warehouse' }, addr: { th: 'กรุงเทพฯ', en: 'Bangkok' }, lat: 13.727, lng: 100.758, radiusM: 200, distance: 8200, inside: false },
];

export const MOCK_EMPLOYEE = {
  name: { th: 'สมชาย ใจดี', en: 'Somchai Jaidee' },
  id: 'EMP-20481',
  dept: { th: 'ฝ่ายผลิต · สาย A', en: 'Production · Line A' },
  avatar: 'SJ',
};

export function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fmtDateTh(d: Date, lang: Lang): string {
  const monthsTh = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const daysTh = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const daysEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  if (lang === 'th') {
    return `${daysTh[d.getDay()]} ${d.getDate()} ${monthsTh[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
  return `${daysEn[d.getDay()]} ${d.getDate()} ${monthsEn[d.getMonth()]} ${d.getFullYear()}`;
}
