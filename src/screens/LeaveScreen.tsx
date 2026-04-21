import { useState } from 'react';
import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH } from '../tokens';
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

export function LeaveScreen({ theme, lang, tab, onTab }: LeaveScreenProps) {
  const [type, setType] = useState<LeaveType>('sick');
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    setSent(true);
    setTimeout(() => setSent(false), 1600);
  };

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

        {/* Form rows */}
        <div style={{ padding: '18px 20px 0' }}>
          <FormRow theme={theme} label={COPY.leaveDate[lang]} I={Icons.Calendar} value={lang === 'en' ? 'Tue, 22 Apr 2026' : 'อ. 22 เม.ย. 2569'} />
          <FormRow theme={theme} label={lang === 'en' ? 'To' : 'ถึง'} I={Icons.Calendar} value={lang === 'en' ? 'Tue, 22 Apr 2026 (1 day)' : 'อ. 22 เม.ย. 2569 (1 วัน)'} />
          <FormRow theme={theme} label={COPY.leaveReason[lang]} I={Icons.Leave} value={lang === 'en' ? 'Add a short note…' : 'เขียนเหตุผลสั้น ๆ...'} muted />
        </div>

        {/* Past requests */}
        <div style={{ padding: '20px 20px 24px' }}>
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
          label={sent ? COPY.success[lang] : COPY.submit[lang]}
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

function FormRow({ theme, label, I, value, muted }: { theme: Theme; label: string; I: React.FC<{ size: number; c: string }>; value: string; muted?: boolean }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.line}`, borderRadius: 16, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <I size={18} c={theme.ink} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: FONT_TH, fontSize: 15, fontWeight: 600, color: muted ? theme.inkMute : theme.ink, marginTop: 2 }}>{value}</div>
      </div>
      <Icons.Chevron size={18} c={theme.inkMute} sw={2} />
    </div>
  );
}
