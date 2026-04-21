import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH, FONT_EN, FONT_NUM } from '../tokens';
import type { TabKey } from '../components/ui/TabBar';
import { TabBar } from '../components/ui/TabBar';

interface HistoryScreenProps {
  theme: Theme;
  lang: Lang;
  tab: TabKey;
  onTab: (t: TabKey) => void;
}

const DAYS = [
  { d: '21', m: 'เม.ย.', mEn: 'Apr', dow: { th: 'จ', en: 'Mon' }, in: '08:02', out: null,    h: '—',    ot: 0,   today: true, status: 'live' },
  { d: '20', m: 'เม.ย.', mEn: 'Apr', dow: { th: 'อา', en: 'Sun' }, in: null,    out: null,    h: '—',    ot: 0,   off: true },
  { d: '19', m: 'เม.ย.', mEn: 'Apr', dow: { th: 'ส', en: 'Sat' }, in: '08:12', out: '19:06', h: '9:54', ot: 1.9 },
  { d: '18', m: 'เม.ย.', mEn: 'Apr', dow: { th: 'ศ', en: 'Fri' }, in: '07:58', out: '17:31', h: '8:33', ot: 0.5 },
  { d: '17', m: 'เม.ย.', mEn: 'Apr', dow: { th: 'พฤ', en: 'Thu' }, in: '08:04', out: '17:02', h: '8:08', ot: 0.1 },
  { d: '16', m: 'เม.ย.', mEn: 'Apr', dow: { th: 'พ', en: 'Wed' }, in: '08:01', out: '17:00', h: '8:08', ot: 0 },
  { d: '15', m: 'เม.ย.', mEn: 'Apr', dow: { th: 'อ', en: 'Tue' }, in: '08:03', out: '18:12', h: '9:19', ot: 1.2 },
];

export function HistoryScreen({ theme, lang, tab, onTab }: HistoryScreenProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '22px 24px 12px' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 28, fontWeight: 800, color: theme.ink, letterSpacing: -0.3 }}>
            {COPY.history[lang]}
          </div>
          <div style={{ fontFamily: FONT_EN, fontSize: 13, color: theme.inkSoft, marginTop: 2 }}>
            {lang === 'en' ? 'This week · Apr 15–21, 2026' : 'สัปดาห์นี้ · 15–21 เม.ย. 2569'}
          </div>
        </div>

        {/* Summary tiles */}
        <div style={{ padding: '0 20px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Tile theme={theme} v="52.4" unit={lang === 'en' ? 'h' : 'ชม.'} label={COPY.totalHours[lang]} />
          <Tile theme={theme} v="5"    unit={lang === 'en' ? 'd' : 'วัน'} label={COPY.daysWorked[lang]} />
          <Tile theme={theme} v="4.7"  unit={lang === 'en' ? 'h' : 'ชม.'} label={COPY.overtime[lang]} highlight={theme.primary} />
        </div>

        {/* Day list */}
        <div style={{ padding: '18px 20px 24px' }}>
          <div style={{ background: theme.card, borderRadius: 22, overflow: 'hidden', border: `1px solid ${theme.line}` }}>
            {DAYS.map((dy, i) => (
              <DayRow key={i} theme={theme} lang={lang} dy={dy} last={i === DAYS.length - 1} />
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

function DayRow({ theme, lang, dy, last }: { theme: Theme; lang: Lang; dy: typeof DAYS[number]; last: boolean }) {
  const isOff = (dy as { off?: boolean }).off;
  const live = dy.status === 'live';
  return (
    <div style={{ padding: '14px 16px', borderBottom: last ? 'none' : `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', gap: 14, opacity: isOff ? 0.55 : 1 }}>
      <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, textTransform: 'uppercase', fontWeight: 600 }}>
          {dy.dow[lang]}
        </div>
        <div style={{ fontFamily: FONT_NUM, fontSize: 22, fontWeight: 800, color: theme.ink, lineHeight: 1, marginTop: 2 }}>{dy.d}</div>
        <div style={{ fontFamily: FONT_TH, fontSize: 10, color: theme.inkMute, marginTop: 2 }}>{lang === 'en' ? dy.mEn : dy.m}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isOff ? (
          <div style={{ fontFamily: FONT_TH, fontSize: 14, color: theme.inkSoft }}>{lang === 'en' ? 'Day off' : 'วันหยุด'}</div>
        ) : (
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <TimeCol theme={theme} label={lang === 'en' ? 'In' : 'เข้า'} v={dy.in ?? '—'} />
            <div style={{ width: 16, height: 1, background: theme.line }} />
            <TimeCol theme={theme} label={lang === 'en' ? 'Out' : 'ออก'} v={dy.out ?? (live ? (lang === 'en' ? 'Now' : 'อยู่') : '—')} live={live && !dy.out} theme2={theme} />
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_NUM, fontSize: 18, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{dy.h}</div>
        {dy.ot > 0 && (
          <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.primary, fontWeight: 700, marginTop: 2 }}>
            +{dy.ot} {lang === 'en' ? 'OT' : 'ล่วงเวลา'}
          </div>
        )}
      </div>
    </div>
  );
}

function TimeCol({ theme, label, v, live, theme2 }: { theme: Theme; label: string; v: string; live?: boolean; theme2?: Theme }) {
  const t = theme2 ?? theme;
  return (
    <div>
      <div style={{ fontFamily: FONT_TH, fontSize: 10, color: t.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: FONT_NUM, fontSize: 15, fontWeight: 700, color: live ? t.accent : t.ink, fontVariantNumeric: 'tabular-nums', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
        {live && <div style={{ width: 6, height: 6, borderRadius: 3, background: t.accent, animation: 'pulse 1.4s ease-out infinite' }} />}
        {v}
      </div>
    </div>
  );
}
