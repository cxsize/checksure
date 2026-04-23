import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH, FONT_EN, FONT_NUM, MOCK_SITES, MOCK_EMPLOYEE, fmtTime, fmtDateTh } from '../tokens';
import { useNow } from '../hooks/useNow';
import { BigButton } from '../components/ui/BigButton';
import { GhostButton } from '../components/ui/GhostButton';
import { StatusChip } from '../components/ui/StatusChip';
import type { TabKey } from '../components/ui/TabBar';
import { TabBar } from '../components/ui/TabBar';
import { BigTime } from '../components/ui/BigTime';
import { Icons } from '../components/ui/Icons';
import type { AppStatus } from '../contexts/AppContext';
import type { CSSProperties } from 'react';

interface HomeScreenProps {
  theme: Theme;
  lang: Lang;
  status: AppStatus;
  clockInTime: Date | null;
  breakStartTime: Date | null;
  breakMinutes: number;
  onClockIn: () => void;
  onClockOut: () => void;
  onBreak: () => void;
  tab: TabKey;
  onTab: (t: TabKey) => void;
}

export function HomeScreen({ theme, lang, status, clockInTime, breakStartTime, breakMinutes, onClockIn, onClockOut, onBreak, tab, onTab }: HomeScreenProps) {
  const now = useNow(60000);
  const site = MOCK_SITES[0];
  const emp = MOCK_EMPLOYEE;

  // Accumulate live break time when currently on break
  const liveBreakMinutes = status === 'break' && breakStartTime
    ? breakMinutes + Math.floor((now.getTime() - breakStartTime.getTime()) / 60000)
    : breakMinutes;

  let workedMs = 0;
  if (clockInTime) {
    workedMs = now.getTime() - clockInTime.getTime() - liveBreakMinutes * 60000;
  }
  const workedH = Math.max(0, Math.floor(workedMs / 3600000));
  const workedM = Math.max(0, Math.floor((workedMs % 3600000) / 60000));
  const isOT = workedH >= 8;

  const iconBox = (icon: React.ReactNode): React.ReactNode => (
    <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 8px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: theme.primarySoft, color: theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_EN, fontSize: 17, fontWeight: 700,
          }}>
            {emp.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft }}>{COPY.hi[lang]}</div>
            <div style={{ fontFamily: FONT_TH, fontSize: 17, fontWeight: 700, color: theme.ink }}>{emp.name[lang]}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 22, border: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: theme.card }}>
            <Icons.Bell size={20} c={theme.ink} sw={1.8} />
            <div style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, background: theme.warn, border: `2px solid ${theme.card}` }} />
          </div>
        </div>

        {/* Hero status card */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: theme.card, borderRadius: 28, padding: 24, boxShadow: `0 2px 0 ${theme.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft, marginBottom: 4 }}>
                  {COPY.today[lang]} · {fmtDateTh(now, lang)}
                </div>
                <BigTime value={fmtTime(now)} theme={theme} size={64} />
              </div>
              <StatusChip status={status} theme={theme} lang={lang} />
            </div>

            {status !== 'out' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: `1px solid ${theme.line}`, paddingTop: 18 }}>
                <Stat theme={theme} label={lang === 'en' ? 'Clock-in' : 'เข้างาน'} value={clockInTime ? fmtTime(clockInTime) : '—'} />
                <Stat theme={theme} label={COPY.hoursWorked[lang]} value={`${workedH}:${String(workedM).padStart(2, '0')}`} highlight={isOT ? theme.primary : undefined} />
                <Stat theme={theme} label={lang === 'en' ? 'Break' : 'พัก'} value={`${liveBreakMinutes}`} unit={COPY.minutes[lang]} />
              </div>
            ) : (
              <div style={{ borderTop: `1px solid ${theme.line}`, paddingTop: 18 }}>
                <div style={{ fontFamily: FONT_TH, fontSize: 14, color: theme.inkSoft, lineHeight: 1.5 }}>
                  {lang === 'en' ? 'Tap below to start your day. Make sure you are inside the site.' : 'แตะปุ่มด้านล่างเพื่อเริ่มต้นวันทำงาน อย่าลืมอยู่ในพื้นที่ทำงาน'}
                </div>
              </div>
            )}

            {isOT && status === 'in' && (
              <div style={{ marginTop: 14, background: theme.primarySoft, color: theme.primary, padding: '10px 14px', borderRadius: 12, fontFamily: FONT_TH, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Clock size={16} c={theme.primary} />
                {lang === 'en' ? `Overtime started · +${workedH - 8}:${String(workedM).padStart(2, '0')}` : `เริ่ม OT แล้ว · +${workedH - 8}:${String(workedM).padStart(2, '0')}`}
              </div>
            )}
          </div>
        </div>

        {/* Site info card */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: theme.card, borderRadius: 20, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${theme.line}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Pin size={20} c={theme.accent} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>{COPY.site[lang]}</div>
              <div style={{ fontFamily: FONT_TH, fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {site.name[lang]}
              </div>
            </div>
            <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.accent, fontWeight: 700, background: theme.accentSoft, padding: '5px 10px', borderRadius: 999 }}>
              {COPY.inArea[lang]}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '20px 20px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {status === 'out' && (
            <BigButton
              theme={theme}
              label={COPY.clockIn[lang]}
              sublabel={lang === 'en' ? 'Verify location and check in' : 'ยืนยันตำแหน่งและลงเวลาเข้า'}
              onClick={onClockIn}
              icon={iconBox(<Icons.Clock size={22} c={theme.primaryInk} />)}
            />
          )}
          {status === 'in' && (
            <>
              <BigButton
                theme={theme}
                label={COPY.clockOut[lang]}
                sublabel={lang === 'en' ? 'End your shift' : 'จบกะงาน'}
                onClick={onClockOut}
                icon={iconBox(<Icons.Clock size={22} c={theme.primaryInk} />)}
              />
              <GhostButton theme={theme} onClick={onBreak}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Icons.Coffee size={20} c={theme.ink} />
                  {COPY.startBreak[lang]}
                </div>
              </GhostButton>
            </>
          )}
          {status === 'break' && (
            <>
              <BigButton
                theme={theme}
                label={COPY.endBreak[lang]}
                sublabel={lang === 'en' ? 'Resume your shift' : 'กลับมาทำงานต่อ'}
                onClick={onBreak}
                color={theme.accent}
                inkColor="#fff"
                icon={iconBox(<Icons.Play size={20} c="#fff" />)}
              />
              <GhostButton theme={theme} onClick={onClockOut}>
                {COPY.clockOut[lang]}
              </GhostButton>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ padding: '4px 20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <QuickAction theme={theme} icon={<Icons.Calendar size={18} c={theme.ink} />} label={lang === 'en' ? 'History' : 'ประวัติ'} sub={lang === 'en' ? 'This week' : 'สัปดาห์นี้'} onClick={() => onTab('history')} />
          <QuickAction theme={theme} icon={<Icons.Wallet size={18} c={theme.ink} />} label={lang === 'en' ? 'Payslip' : 'สลิปเงินเดือน'} sub={lang === 'en' ? 'Apr 2026' : 'เม.ย. 2569'} onClick={() => onTab('profile')} />
        </div>
      </div>

      <TabBar tab={tab} onTab={onTab} theme={theme} lang={lang} />
    </div>
  );
}

function Stat({ theme, label, value, unit, highlight }: { theme: Theme; label: string; value: string; unit?: string; highlight?: string }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.inkSoft, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: FONT_NUM, fontSize: 22, fontWeight: 700, color: highlight ?? theme.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 13, color: theme.inkSoft, marginLeft: 3, fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}

function QuickAction({ theme, icon, label, sub, onClick }: { theme: Theme; icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: theme.card, border: `1px solid ${theme.line}`, borderRadius: 18,
      padding: 16, textAlign: 'left', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start',
    } as CSSProperties}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: FONT_TH, fontSize: 15, fontWeight: 700, color: theme.ink }}>{label}</div>
        <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.inkSoft, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}
