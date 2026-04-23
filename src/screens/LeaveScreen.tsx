import { useState } from 'react';
import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH } from '../tokens';
import { useApp } from '../contexts/AppContext';
import { submitLeave } from '../services/firebase';
import { BigButton } from '../components/ui/BigButton';
import type { TabKey } from '../components/ui/TabBar';
import { TabBar } from '../components/ui/TabBar';
import { Icons } from '../components/ui/Icons';

interface LeaveScreenProps {
  theme: Theme;
  lang: Lang;
  tab: TabKey;
  onTab: (t: TabKey) => void;
}

type LeaveType = 'sick' | 'personal' | 'vacation';

const PAST_REQUESTS = [
  { date: { th: '8 เม.ย. 2569', en: '8 Apr 2026' },  type: 'leaveSick'     as const, status: 'approved' as const },
  { date: { th: '25 มี.ค. 2569', en: '25 Mar 2026' }, type: 'leavePersonal' as const, status: 'approved' as const },
  { date: { th: '2 มี.ค. 2569', en: '2 Mar 2026' },   type: 'leaveVacation' as const, status: 'pending'  as const },
];

const LEAVE_TYPES: { id: LeaveType; key: 'leaveSick' | 'leavePersonal' | 'leaveVacation'; Icon: keyof typeof Icons }[] = [
  { id: 'sick',     key: 'leaveSick',     Icon: 'Leave' },
  { id: 'personal', key: 'leavePersonal', Icon: 'Person' },
  { id: 'vacation', key: 'leaveVacation', Icon: 'Coffee' },
];

const MONTH_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_TH = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
const DOW_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmtDisplayDate(iso: string, lang: Lang): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  const dw = d.getDay();
  return lang === 'en'
    ? `${DOW_EN[dw]}, ${day} ${MONTH_EN[m]} ${y}`
    : `${DOW_TH[dw]} ${day} ${MONTH_TH[m]} ${y + 543}`;
}

function daysBetween(from: string, to: string): number {
  const d1 = new Date(from + 'T12:00:00');
  const d2 = new Date(to + 'T12:00:00');
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function LeaveScreen({ theme, lang, tab, onTab }: LeaveScreenProps) {
  const { user } = useApp();
  const [type, setType] = useState<LeaveType>('sick');
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleToDate = (v: string) => {
    setToDate(v < fromDate ? fromDate : v);
  };

  const handleFromDate = (v: string) => {
    setFromDate(v);
    if (toDate < v) setToDate(v);
  };

  const handleSubmit = async () => {
    if (sending || sent) return;
    setSending(true);
    try {
      if (user?.uid) {
        await submitLeave(user.uid, { type, fromDate, toDate, reason });
      }
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } catch (e) {
      console.error('submitLeave failed:', e);
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } finally {
      setSending(false);
    }
  };

  const days = daysBetween(fromDate, toDate);
  const toLabel = lang === 'en'
    ? `${fmtDisplayDate(toDate, lang)} (${days} day${days !== 1 ? 's' : ''})`
    : `${fmtDisplayDate(toDate, lang)} (${days} วัน)`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '22px 24px 12px' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 28, fontWeight: 800, color: theme.ink, letterSpacing: -0.3 }}>
            {COPY.requestLeave[lang]}
          </div>
        </div>

        {/* Leave type picker */}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: theme.inkSoft, marginBottom: 10, paddingLeft: 4 }}>
            {COPY.leaveType[lang]}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {LEAVE_TYPES.map(({ id, key, Icon }) => {
              const active = type === id;
              const I = Icons[Icon] as React.FC<{ size: number; c: string; sw: number }>;
              return (
                <button key={id} onClick={() => setType(id)} style={{
                  border: `2px solid ${active ? theme.primary : theme.line}`,
                  background: active ? theme.primarySoft : theme.card,
                  borderRadius: 18, padding: '16px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                }}>
                  <I size={26} c={active ? theme.primary : theme.ink} sw={2} />
                  <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: active ? theme.primary : theme.ink }}>
                    {COPY[key][lang]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date fields */}
        <div style={{ padding: '18px 20px 0' }}>
          <DateField theme={theme} lang={lang}
            label={COPY.leaveDate[lang]} value={fromDate} onChange={handleFromDate}
          />
          <DateField theme={theme} lang={lang}
            label={lang === 'en' ? 'To' : 'ถึง'} value={toDate} onChange={handleToDate}
            displayOverride={toLabel}
          />

          {/* Reason textarea */}
          <div style={{ background: theme.card, border: `1px solid ${theme.line}`, borderRadius: 16, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Icons.Leave size={18} c={theme.ink} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, marginBottom: 6 }}>
                  {COPY.leaveReason[lang]}
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={lang === 'en' ? 'Add a short note…' : 'เขียนเหตุผลสั้น ๆ...'}
                  rows={3}
                  style={{
                    width: '100%', border: 'none', outline: 'none', resize: 'none',
                    background: 'transparent', fontFamily: FONT_TH, fontSize: 15,
                    color: theme.ink, lineHeight: 1.5, display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Past requests */}
        <div style={{ padding: '4px 20px 24px' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: theme.inkSoft, marginBottom: 10, paddingLeft: 4 }}>
            {lang === 'en' ? 'Recent requests' : 'คำขอที่ผ่านมา'}
          </div>
          <div style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.line}`, overflow: 'hidden' }}>
            {PAST_REQUESTS.map((p, i) => (
              <div key={i} style={{ padding: '12px 14px', borderBottom: i === PAST_REQUESTS.length - 1 ? 'none' : `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT_TH, fontSize: 14, fontWeight: 600, color: theme.ink }}>{COPY[p.type][lang]}</div>
                  <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.inkSoft, marginTop: 2 }}>{p.date[lang]}</div>
                </div>
                <div style={{
                  fontFamily: FONT_TH, fontSize: 11, fontWeight: 700,
                  background: p.status === 'approved' ? theme.accentSoft : theme.primarySoft,
                  color:      p.status === 'approved' ? theme.accent    : theme.primary,
                  padding: '5px 10px', borderRadius: 999,
                }}>
                  {p.status === 'approved' ? (lang === 'en' ? 'Approved' : 'อนุมัติ') : (lang === 'en' ? 'Pending' : 'รออนุมัติ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 20px 12px', background: theme.bg, borderTop: `1px solid ${theme.line}` }}>
        <BigButton
          theme={theme}
          label={sent ? COPY.success[lang] : sending ? (lang === 'en' ? 'Submitting…' : 'กำลังส่ง...') : COPY.submit[lang]}
          onClick={handleSubmit}
          color={sent ? theme.accent : theme.primary}
          inkColor="#fff"
          icon={
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sent ? <Icons.Check size={20} c="#fff" sw={3} /> : <Icons.Arrow size={20} c="#fff" />}
            </div>
          }
        />
      </div>
      <TabBar tab={tab} onTab={onTab} theme={theme} lang={lang} />
    </div>
  );
}

interface DateFieldProps {
  theme: Theme;
  lang: Lang;
  label: string;
  value: string;
  onChange: (v: string) => void;
  displayOverride?: string;
}

function DateField({ theme, lang, label, value, onChange, displayOverride }: DateFieldProps) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.line}`, borderRadius: 16, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icons.Calendar size={18} c={theme.ink} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: FONT_TH, fontSize: 15, fontWeight: 600, color: theme.ink, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayOverride ?? fmtDisplayDate(value, lang)}
        </div>
      </div>
      <Icons.Chevron size={18} c={theme.inkMute} sw={2} />
      {/* Invisible overlay triggers native date picker */}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
      />
    </div>
  );
}
