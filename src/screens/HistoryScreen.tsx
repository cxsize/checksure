import { useState, useEffect } from 'react';
import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH, FONT_EN, FONT_NUM, MONTH_TH, MONTH_EN, DOW_TH, DOW_EN, fmtTime } from '../tokens';
import { useApp } from '../contexts/AppContext';
import { useNow } from '../hooks/useNow';
import { getWeekRecords } from '../services/firebase';
import type { AttendanceRecord } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';
import type { TabKey } from '../components/ui/TabBar';
import { TabBar } from '../components/ui/TabBar';
import { Icons } from '../components/ui/Icons';

interface HistoryScreenProps {
  theme: Theme;
  lang: Lang;
  tab: TabKey;
  onTab: (t: TabKey) => void;
}


interface ShiftEntry {
  shift: number;
  clockIn: string | null;
  clockOut: string | null;
  workedH: string;
}

interface DayEntry {
  date: Date;
  dateKey: string;
  d: string;
  monthTh: string;
  monthEn: string;
  dowTh: string;
  dowEn: string;
  isToday: boolean;
  isFuture: boolean;
  clockIn: string | null;
  clockOut: string | null;
  workedH: string;
  otH: number;
  live: boolean;
  shifts: number;
  shiftDetails: ShiftEntry[];
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTimestamp(ts: Timestamp | null): string | null {
  if (!(ts instanceof Timestamp)) return null;
  const d = ts.toDate();
  return fmtTime(d);
}

function buildWeek(weekOffset: number, now: Date, clockState: ReturnType<typeof useApp>['clockState'], records: Map<string, AttendanceRecord[]>): DayEntry[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Monday of the current/offset week
  const dw = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dw === 0 ? 6 : dw - 1) + weekOffset * 7);

  const days: DayEntry[] = [];
  // Build Sun→Mon descending (index 6 = Sun, 0 = Mon)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);

    const isToday   = d.getTime() === today.getTime();
    const isFuture  = d.getTime() > today.getTime();
    let clockIn: string | null = null;
    let clockOut: string | null = null;
    let workedH = '—';
    let otH = 0;
    let live = false;
    let shifts = 0;
    let shiftDetails: ShiftEntry[] = [];
    const dateKey = toDateKey(d);

    if (isToday) {
      // For today, also check Firestore records for completed earlier shifts
      const todayRecords = records.get(dateKey);
      if (todayRecords && todayRecords.length > 0) {
        shifts = todayRecords.length;
        // If the user is currently clocked in, that's tracked in clockState
        if (clockState.status === 'in') shifts = Math.max(shifts, clockState.shift);
        clockIn = fmtTimestamp(todayRecords[0].clockIn);
        // Build shift details from records
        shiftDetails = todayRecords.slice(-3).map((rec) => {
          const wMins = rec.workedMinutes ?? 0;
          const hh = Math.floor(wMins / 60);
          const mm = wMins % 60;
          return {
            shift: rec.shift,
            clockIn: fmtTimestamp(rec.clockIn),
            clockOut: fmtTimestamp(rec.clockOut),
            workedH: rec.clockOut ? `${hh}:${String(mm).padStart(2, '0')}` : '—',
          };
        });
        // Sum worked time from all Firestore records
        const totalWorked = todayRecords.reduce((sum, s) => sum + (s.workedMinutes ?? 0), 0);
        const totalOt = todayRecords.reduce((sum, s) => sum + (s.otMinutes ?? 0), 0);
        // If currently clocked in, add live time
        if (clockState.status === 'in' && clockState.clockInTime) {
          live = true;
          const liveMs = now.getTime() - clockState.clockInTime.getTime();
          const liveMins = Math.max(0, Math.floor(liveMs / 60000));
          const combined = totalWorked + liveMins;
          const h = Math.floor(combined / 60);
          const m = combined % 60;
          workedH = `${h}:${String(m).padStart(2, '0')}`;
          otH = Math.max(0, combined - 480) / 60;
          clockOut = null;
        } else if (clockState.status === 'out' && clockState.clockOutTime) {
          clockOut = fmtTime(clockState.clockOutTime);
          const h = Math.floor(totalWorked / 60);
          const m = totalWorked % 60;
          workedH = `${h}:${String(m).padStart(2, '0')}`;
          otH = totalOt / 60;
        }
      } else if (clockState.clockInTime) {
        // No Firestore records yet, but user has clocked in this session
        clockIn = fmtTime(clockState.clockInTime);
        shifts = clockState.shift;
        if (clockState.status === 'out' && clockState.clockOutTime) {
          clockOut = fmtTime(clockState.clockOutTime);
          const workedMs = clockState.clockOutTime.getTime() - clockState.clockInTime.getTime();
          const wMins = Math.max(0, Math.floor(workedMs / 60000));
          const h = Math.floor(wMins / 60);
          const m = wMins % 60;
          workedH = `${h}:${String(m).padStart(2, '0')}`;
          otH = Math.max(0, wMins - 480) / 60;
        } else {
          live = true;
          const workedMs = now.getTime() - clockState.clockInTime.getTime();
          const wMins = Math.max(0, Math.floor(workedMs / 60000));
          const h = Math.floor(wMins / 60);
          const m = wMins % 60;
          workedH = `${h}:${String(m).padStart(2, '0')}`;
          otH = Math.max(0, wMins - 480) / 60;
        }
      }
    } else if (!isFuture) {
      const dayShifts = records.get(dateKey);
      if (dayShifts && dayShifts.length > 0) {
        shifts = dayShifts.length;
        clockIn = fmtTimestamp(dayShifts[0].clockIn);
        const lastShift = dayShifts[dayShifts.length - 1];
        clockOut = fmtTimestamp(lastShift.clockOut);
        const totalWorked = dayShifts.reduce((sum, s) => sum + (s.workedMinutes ?? 0), 0);
        const totalOt = dayShifts.reduce((sum, s) => sum + (s.otMinutes ?? 0), 0);
        const h = Math.floor(totalWorked / 60);
        const m = totalWorked % 60;
        workedH = `${h}:${String(m).padStart(2, '0')}`;
        otH = totalOt / 60;
        // Last 3 shifts for detail view
        shiftDetails = dayShifts.slice(-3).map((rec) => {
          const wMins = rec.workedMinutes ?? 0;
          const hh = Math.floor(wMins / 60);
          const mm = wMins % 60;
          return {
            shift: rec.shift,
            clockIn: fmtTimestamp(rec.clockIn),
            clockOut: fmtTimestamp(rec.clockOut),
            workedH: `${hh}:${String(mm).padStart(2, '0')}`,
          };
        });
      }
    }

    days.push({
      date: d, dateKey, d: String(d.getDate()),
      monthTh: MONTH_TH[d.getMonth()], monthEn: MONTH_EN[d.getMonth()],
      dowTh: DOW_TH[d.getDay()], dowEn: DOW_EN[d.getDay()],
      isToday, isFuture, clockIn, clockOut, workedH, otH, live, shifts, shiftDetails,
    });
  }
  return days;
}

function parseH(workedH: string): number {
  if (workedH === '—') return 0;
  const [h, m] = workedH.split(':').map(Number);
  return h + m / 60;
}

function weekRangeLabel(days: DayEntry[], lang: Lang): string {
  const mon = days[days.length - 1].date;
  const sun = days[0].date;
  if (lang === 'en') {
    const sameMonth = mon.getMonth() === sun.getMonth();
    return sameMonth
      ? `${MONTH_EN[mon.getMonth()]} ${mon.getDate()}–${sun.getDate()}, ${mon.getFullYear()}`
      : `${MONTH_EN[mon.getMonth()]} ${mon.getDate()} – ${MONTH_EN[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`;
  } else {
    return `${mon.getDate()}–${sun.getDate()} ${MONTH_TH[mon.getMonth()]} ${mon.getFullYear() + 543}`;
  }
}

export function HistoryScreen({ theme, lang, tab, onTab }: HistoryScreenProps) {
  const { clockState, user } = useApp();
  const now = useNow(60000);
  const [weekOffset, setWeekOffset] = useState(0);
  const [records, setRecords] = useState<Map<string, AttendanceRecord[]>>(new Map());

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    const load = async () => {
      try {
        const recs = await getWeekRecords(user.uid);
        if (cancelled) return;
        const map = new Map<string, AttendanceRecord[]>();
        for (const r of recs) {
          const existing = map.get(r.date) ?? [];
          existing.push(r);
          map.set(r.date, existing);
        }
        for (const [, shifts] of map) {
          shifts.sort((a, b) => (a.shift ?? 1) - (b.shift ?? 1));
        }
        setRecords(map);
      } catch (err) { console.error(err); }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const days = buildWeek(weekOffset, now, clockState, records);

  const totalH    = days.reduce((s, d) => s + parseH(d.workedH), 0);
  const daysWorked = days.filter((d) => d.clockIn).length;
  const totalOtH   = days.reduce((s, d) => s + d.otH, 0);

  const totalHStr   = `${Math.floor(totalH)}:${String(Math.round((totalH % 1) * 60)).padStart(2,'0')}`;
  const totalOtStr  = totalOtH > 0 ? `${Math.floor(totalOtH)}:${String(Math.round((totalOtH % 1) * 60)).padStart(2,'0')}` : '0:00';

  const weekLabel = weekOffset === 0
    ? (lang === 'en' ? 'This week' : 'สัปดาห์นี้')
    : weekOffset === -1
      ? (lang === 'en' ? 'Last week' : 'สัปดาห์ที่แล้ว')
      : (lang === 'en' ? `${Math.abs(weekOffset)} weeks ago` : `${Math.abs(weekOffset)} สัปดาห์ที่แล้ว`);

  const navBtnStyle = (disabled: boolean) => ({
    width: 36, height: 36, borderRadius: 18,
    border: `1px solid ${disabled ? theme.line : theme.line}`,
    background: disabled ? theme.surface : theme.card,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Header with week navigation */}
        <div style={{ padding: '22px 24px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_TH, fontSize: 28, fontWeight: 800, color: theme.ink, letterSpacing: -0.3 }}>
              {COPY.history[lang]}
            </div>
            <div style={{ fontFamily: FONT_EN, fontSize: 13, color: theme.inkSoft, marginTop: 2 }}>
              {weekLabel} · {weekRangeLabel(days, lang)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button onClick={() => setWeekOffset((w) => w - 1)} style={navBtnStyle(false) as React.CSSProperties}>
              <Icons.Chevron dir="left" size={18} c={theme.ink} sw={2} />
            </button>
            <button
              onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
              disabled={weekOffset >= 0}
              style={navBtnStyle(weekOffset >= 0) as React.CSSProperties}
            >
              <Icons.Chevron size={18} c={weekOffset >= 0 ? theme.inkMute : theme.ink} sw={2} />
            </button>
          </div>
        </div>

        {/* Summary tiles */}
        <div style={{ padding: '0 20px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Tile theme={theme} v={totalHStr}         unit={lang === 'en' ? 'h' : 'ชม.'} label={COPY.totalHours[lang]} />
          <Tile theme={theme} v={String(daysWorked)} unit={lang === 'en' ? 'd' : 'วัน'} label={COPY.daysWorked[lang]} />
          <Tile theme={theme} v={totalOtStr}         unit={lang === 'en' ? 'h' : 'ชม.'} label={COPY.overtime[lang]} highlight={totalOtH > 0 ? theme.primary : undefined} />
        </div>

        {/* Day list */}
        <div style={{ padding: '18px 20px 24px' }}>
          <div style={{ background: theme.card, borderRadius: 22, overflow: 'hidden', border: `1px solid ${theme.line}` }}>
            {days.map((dy, i) => (
              <DayRow key={dy.dateKey} theme={theme} lang={lang} dy={dy} last={i === days.length - 1} />
            ))}
          </div>
        </div>
      </div>
      <TabBar tab={tab} onTab={onTab} theme={theme} lang={lang} />
    </div>
  );
}

function Tile({ theme, v, unit, label, highlight }: { theme: Theme; v: string; unit: string; label: string; highlight?: string }) {
  return (
    <div style={{ background: theme.card, borderRadius: 18, padding: '14px 12px', border: `1px solid ${theme.line}` }}>
      <div style={{ fontFamily: FONT_NUM, fontSize: 26, fontWeight: 800, color: highlight ?? theme.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {v}<span style={{ fontSize: 12, color: theme.inkSoft, marginLeft: 3, fontWeight: 600 }}>{unit}</span>
      </div>
      <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

function DayRow({ theme, lang, dy, last }: { theme: Theme; lang: Lang; dy: DayEntry; last: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const dim = dy.isFuture;
  const tappable = !dim && dy.shiftDetails.length > 0;

  return (
    <div style={{ borderBottom: last ? 'none' : `1px solid ${theme.line}` }}>
      <div
        onClick={tappable ? () => setExpanded((v) => !v) : undefined}
        style={{
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
          opacity: dim ? 0.45 : 1,
          cursor: tappable ? 'pointer' : 'default',
        }}
      >
        <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 11, color: dy.isToday ? theme.primary : theme.inkSoft, textTransform: 'uppercase', fontWeight: 700 }}>
            {lang === 'en' ? dy.dowEn : dy.dowTh}
          </div>
          <div style={{ fontFamily: FONT_NUM, fontSize: 22, fontWeight: 800, color: dy.isToday ? theme.primary : theme.ink, lineHeight: 1, marginTop: 2 }}>{dy.d}</div>
          <div style={{ fontFamily: FONT_TH, fontSize: 10, color: theme.inkMute, marginTop: 2 }}>{lang === 'en' ? dy.monthEn : dy.monthTh}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {dy.isFuture ? (
            <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkMute }}>—</div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <TimeCol theme={theme} label={lang === 'en' ? 'In' : 'เข้า'} v={dy.clockIn ?? '—'} />
                <div style={{ width: 16, height: 1, background: theme.line }} />
                <TimeCol
                  theme={theme}
                  label={lang === 'en' ? 'Out' : 'ออก'}
                  v={dy.clockOut ?? (dy.live ? (lang === 'en' ? 'Now' : 'อยู่') : '—')}
                  live={dy.live}
                />
              </div>
              {dy.shifts > 1 && (
                <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {dy.shifts} {lang === 'en' ? 'shifts' : 'กะ'}
                  <Icons.Chevron size={12} c={theme.inkMute} sw={2} dir={expanded ? 'up' : 'down'} />
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: FONT_NUM, fontSize: 18, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{dy.workedH}</div>
          {dy.otH > 0.05 && (
            <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.primary, fontWeight: 700, marginTop: 2 }}>
              +{dy.otH.toFixed(1)} {lang === 'en' ? 'OT' : 'ล่วงเวลา'}
            </div>
          )}
        </div>
      </div>

      {/* Expanded shift details */}
      {expanded && dy.shiftDetails.length > 0 && (
        <div style={{ padding: '0 16px 14px 62px' }}>
          <div style={{ background: theme.surface, borderRadius: 12, overflow: 'hidden', border: `1px solid ${theme.line}` }}>
            {dy.shiftDetails.map((sh, i) => (
              <div key={sh.shift} style={{
                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < dy.shiftDetails.length - 1 ? `1px solid ${theme.line}` : 'none',
              }}>
                <div style={{
                  fontFamily: FONT_TH, fontSize: 11, fontWeight: 700, color: theme.primaryInk,
                  background: theme.primary, borderRadius: 6, padding: '2px 8px', flexShrink: 0,
                }}>
                  {lang === 'en' ? `S${sh.shift}` : `กะ${sh.shift}`}
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: FONT_NUM, fontSize: 13, fontWeight: 600, color: theme.ink }}>{sh.clockIn ?? '—'}</span>
                  <span style={{ color: theme.inkMute }}>→</span>
                  <span style={{ fontFamily: FONT_NUM, fontSize: 13, fontWeight: 600, color: theme.ink }}>{sh.clockOut ?? '—'}</span>
                </div>
                <div style={{ fontFamily: FONT_NUM, fontSize: 13, fontWeight: 700, color: theme.inkSoft }}>{sh.workedH}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeCol({ theme, label, v, live }: { theme: Theme; label: string; v: string; live?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_TH, fontSize: 10, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 700, color: live ? theme.accent : theme.ink, fontVariantNumeric: 'tabular-nums', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
        {live && <div style={{ width: 6, height: 6, borderRadius: 3, background: theme.accent, animation: 'pulse 1.4s ease-out infinite' }} />}
        {v}
      </div>
    </div>
  );
}
