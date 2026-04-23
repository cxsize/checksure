import { useState } from 'react';
import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH, FONT_EN, FONT_NUM, fmtTime } from '../tokens';
import { useApp } from '../contexts/AppContext';
import { useNow } from '../hooks/useNow';
import type { TabKey } from '../components/ui/TabBar';
import { TabBar } from '../components/ui/TabBar';
import { Icons } from '../components/ui/Icons';

interface HistoryScreenProps {
  theme: Theme;
  lang: Lang;
  tab: TabKey;
  onTab: (t: TabKey) => void;
}

const MONTH_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_TH   = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const DOW_EN   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface DayEntry {
  date: Date;
  d: string;
  monthTh: string;
  monthEn: string;
  dowTh: string;
  dowEn: string;
  isToday: boolean;
  isFuture: boolean;
  isWeekend: boolean;
  clockIn: string | null;
  clockOut: string | null;
  workedH: string;
  otH: number;
  live: boolean;
}

// Deterministic mock data for past working days (hash from date)
function mockClockData(date: Date): { clockIn: string; clockOut: string; workedH: string; otH: number } {
  const seed = date.getDate() * 13 + date.getMonth() * 7;
  const inH = 7 + (seed % 2);       // 07 or 08
  const inM = (seed * 11) % 45;
  const outH = 16 + (seed % 4);     // 16–19
  const outM = (seed * 7 + 5) % 55;
  const workedMins = (outH - inH) * 60 + (outM - inM);
  const otMins = Math.max(0, workedMins - 480);
  const h = Math.floor(workedMins / 60);
  const m = workedMins % 60;
  return {
    clockIn:  `${String(inH).padStart(2,'0')}:${String(inM).padStart(2,'0')}`,
    clockOut: `${String(outH).padStart(2,'0')}:${String(outM).padStart(2,'0')}`,
    workedH:  `${h}:${String(m).padStart(2,'0')}`,
    otH: otMins / 60,
  };
}

function buildWeek(weekOffset: number, now: Date, clockState: ReturnType<typeof useApp>['clockState']): DayEntry[] {
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
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    let clockIn: string | null = null;
    let clockOut: string | null = null;
    let workedH = '—';
    let otH = 0;
    let live = false;

    if (isToday) {
      if (clockState.clockInTime) {
        clockIn = fmtTime(clockState.clockInTime);
        if (clockState.status === 'out' && clockState.clockOutTime) {
          clockOut = fmtTime(clockState.clockOutTime);
          const workedMs = clockState.clockOutTime.getTime() - clockState.clockInTime.getTime() - clockState.breakMinutes * 60000;
          const wMins = Math.max(0, Math.floor(workedMs / 60000));
          const h = Math.floor(wMins / 60);
          const m = wMins % 60;
          workedH = `${h}:${String(m).padStart(2,'0')}`;
          otH = Math.max(0, wMins - 480) / 60;
        } else {
          live = true;
          // Compute elapsed since clockIn
          const workedMs = now.getTime() - clockState.clockInTime.getTime() - clockState.breakMinutes * 60000;
          const wMins = Math.max(0, Math.floor(workedMs / 60000));
          const h = Math.floor(wMins / 60);
          const m = wMins % 60;
          workedH = `${h}:${String(m).padStart(2,'0')}`;
          otH = Math.max(0, wMins - 480) / 60;
        }
      }
    } else if (!isFuture && !isWeekend) {
      const mock = mockClockData(d);
      clockIn  = mock.clockIn;
      clockOut = mock.clockOut;
      workedH  = mock.workedH;
      otH      = mock.otH;
    }

    days.push({
      date: d, d: String(d.getDate()),
      monthTh: MONTH_TH[d.getMonth()], monthEn: MONTH_EN[d.getMonth()],
      dowTh: DOW_TH[d.getDay()], dowEn: DOW_EN[d.getDay()],
      isToday, isFuture, isWeekend, clockIn, clockOut, workedH, otH, live,
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
  const { clockState } = useApp();
  const now = useNow(60000);
  const [weekOffset, setWeekOffset] = useState(0);

  const days = buildWeek(weekOffset, now, clockState);

  const workDays = days.filter((d) => !d.isWeekend);
  const totalH    = workDays.reduce((s, d) => s + parseH(d.workedH), 0);
  const daysWorked = workDays.filter((d) => d.clockIn).length;
  const totalOtH   = workDays.reduce((s, d) => s + d.otH, 0);

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
              <DayRow key={i} theme={theme} lang={lang} dy={dy} last={i === days.length - 1} />
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
  const dim = dy.isFuture || dy.isWeekend;
  return (
    <div style={{ padding: '14px 16px', borderBottom: last ? 'none' : `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', gap: 14, opacity: dim ? 0.45 : 1 }}>
      <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_TH, fontSize: 11, color: dy.isToday ? theme.primary : theme.inkSoft, textTransform: 'uppercase', fontWeight: 700 }}>
          {lang === 'en' ? dy.dowEn : dy.dowTh}
        </div>
        <div style={{ fontFamily: FONT_NUM, fontSize: 22, fontWeight: 800, color: dy.isToday ? theme.primary : theme.ink, lineHeight: 1, marginTop: 2 }}>{dy.d}</div>
        <div style={{ fontFamily: FONT_TH, fontSize: 10, color: theme.inkMute, marginTop: 2 }}>{lang === 'en' ? dy.monthEn : dy.monthTh}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {dy.isWeekend ? (
          <div style={{ fontFamily: FONT_TH, fontSize: 14, color: theme.inkSoft }}>{lang === 'en' ? 'Day off' : 'วันหยุด'}</div>
        ) : dy.isFuture ? (
          <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkMute }}>—</div>
        ) : (
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
