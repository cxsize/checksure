import { useState, useEffect, useCallback } from 'react';
import type { Theme, Lang, ThemeKey } from '../tokens';
import { COPY, FONT_TH, FONT_EN, FONT_NUM, THEMES } from '../tokens';
import { Icons } from '../components/ui/Icons';
import { useSites } from '../hooks/useSites';
import { useApp } from '../contexts/AppContext';
import { getMonthRecords, upsertUserProfile } from '../services/firebase';
import type { UserProfile } from '../services/firebase';
import { requestNotificationPermission } from '../services/messaging';

interface ProfileScreenProps {
  theme: Theme;
  lang: Lang;
  profile: UserProfile | null;
  onLangToggle: () => void;
  onSignOut: () => void;
  themeKey: ThemeKey;
  onThemeChange: (k: ThemeKey) => void;
}

const THEME_OPTS: { key: ThemeKey; label: { th: string; en: string } }[] = [
  { key: 'warm',     label: { th: 'อุ่น', en: 'Warm' } },
  { key: 'neutral',  label: { th: 'กลาง', en: 'Neutral' } },
  { key: 'contrast', label: { th: 'เข้ม', en: 'Contrast' } },
];

export function ProfileScreen({ theme, lang, profile, onLangToggle, onSignOut, themeKey, onThemeChange }: ProfileScreenProps) {
  const { sites } = useSites();
  const { user } = useApp();
  const primarySite = sites[0] ?? null;
  const displayName = profile?.displayName || '...';
  const pictureUrl = profile?.pictureUrl || '';
  const avatar = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : '?';
  const deptLabel = profile?.dept?.[lang] || '—';
  const empId = profile?.employeeId || '—';

  // Notification toggle
  const notifEnabled = profile?.notificationsEnabled ?? false;
  const [notifBusy, setNotifBusy] = useState(false);
  const toggleNotifications = useCallback(async () => {
    if (!user?.uid || notifBusy) return;
    setNotifBusy(true);
    try {
      if (!notifEnabled) {
        const token = await requestNotificationPermission(user.uid);
        if (token) {
          await upsertUserProfile(user.uid, { notificationsEnabled: true });
        }
      } else {
        await upsertUserProfile(user.uid, { notificationsEnabled: false });
      }
    } catch (err) {
      console.error('Notification toggle failed:', err);
    } finally {
      setNotifBusy(false);
    }
  }, [user?.uid, notifEnabled, notifBusy]);

  // Monthly stats from Firestore
  const [monthStats, setMonthStats] = useState({ totalH: '0', daysWorked: '0', otH: '0:00' });
  useEffect(() => {
    if (!user?.uid) return;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    getMonthRecords(user.uid, ym).then((records) => {
      const totalMin = records.reduce((s, r) => s + (r.workedMinutes ?? 0), 0);
      const otMin = records.reduce((s, r) => s + (r.otMinutes ?? 0), 0);
      const uniqueDates = new Set(records.filter((r) => r.clockIn).map((r) => r.date));
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const otH = Math.floor(otMin / 60);
      const otM = otMin % 60;
      setMonthStats({
        totalH: `${h}:${String(m).padStart(2, '0')}`,
        daysWorked: String(uniqueDates.size),
        otH: `${otH}:${String(otM).padStart(2, '0')}`,
      });
    }).catch(console.error);
  }, [user?.uid]);

  return (
    <div style={{ background: theme.bg, minHeight: '100%' }}>
        {/* Profile header */}
        <div style={{ padding: '22px 24px 0', background: theme.card, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 24 }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 28, fontWeight: 800, color: theme.ink, letterSpacing: -0.3 }}>
            {COPY.profile[lang]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
            {pictureUrl ? (
              <img src={pictureUrl} alt="" style={{ width: 68, height: 68, borderRadius: 20, objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 68, height: 68, borderRadius: 20, background: theme.primarySoft, color: theme.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_EN, fontSize: 26, fontWeight: 800,
              }}>
                {avatar}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_TH, fontSize: 19, fontWeight: 800, color: theme.ink }}>{displayName}</div>
              <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft, marginTop: 2 }}>{deptLabel}</div>
              <div style={{ fontFamily: FONT_EN, fontSize: 12, color: theme.inkMute, marginTop: 3, letterSpacing: 0.4 }}>{empId}</div>
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: theme.inkSoft, marginBottom: 10, paddingLeft: 4 }}>
            {COPY.thisMonth[lang]}
          </div>
          <div style={{ background: theme.card, borderRadius: 22, padding: 18, border: `1px solid ${theme.line}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <MonthStat theme={theme} value={monthStats.totalH} label={COPY.totalHours[lang]} />
              <MonthStat theme={theme} value={monthStats.daysWorked} label={COPY.daysWorked[lang]} />
              <MonthStat theme={theme} value={monthStats.otH} label={COPY.otThisMonth[lang]} highlight={theme.primary} />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={{ padding: '18px 20px 24px' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: theme.inkSoft, marginBottom: 10, paddingLeft: 4 }}>
            {COPY.settings[lang]}
          </div>
          <div style={{ background: theme.card, borderRadius: 20, border: `1px solid ${theme.line}`, overflow: 'hidden' }}>
            <SettingRow theme={theme} I={Icons.Globe}   label={COPY.language[lang]} value={lang === 'en' ? 'English' : 'ภาษาไทย'} onClick={onLangToggle} />
            <SettingRow theme={theme} I={Icons.Bell}    label={COPY.notif[lang]}    value={notifBusy ? '...' : (notifEnabled ? (lang === 'en' ? 'On' : 'เปิด') : (lang === 'en' ? 'Off' : 'ปิด'))} onClick={toggleNotifications} />
            <SettingRow theme={theme} I={Icons.Pin}     label={COPY.site[lang]}     value={primarySite ? primarySite.name[lang] : '—'} />
            {/* Theme picker */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Refresh size={18} c={theme.ink} sw={2} />
                </div>
                <div style={{ flex: 1, fontFamily: FONT_TH, fontSize: 15, fontWeight: 600, color: theme.ink }}>
                  {lang === 'en' ? 'Theme' : 'ธีม'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {THEME_OPTS.map(({ key, label }) => {
                  const t = THEMES[key];
                  const active = themeKey === key;
                  return (
                    <button key={key} onClick={() => onThemeChange(key)} style={{
                      border: `2px solid ${active ? theme.primary : theme.line}`,
                      background: t.bg, borderRadius: 14, padding: '10px 6px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 5, background: t.primary }} />
                        <div style={{ width: 10, height: 10, borderRadius: 5, background: t.accent }} />
                      </div>
                      <div style={{ fontFamily: FONT_TH, fontSize: 11, fontWeight: 700, color: active ? theme.primary : theme.inkSoft }}>
                        {label[lang]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button onClick={onSignOut} style={{
              border: 'none', background: 'transparent', color: theme.warn,
              fontFamily: FONT_TH, fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '10px 20px',
            }}>
              {COPY.signOut[lang]}
            </button>
          </div>
        </div>
    </div>
  );
}

function MonthStat({ theme, value, label, highlight }: { theme: Theme; value: string; label: string; highlight?: string }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_NUM, fontSize: 26, fontWeight: 800, color: highlight ?? theme.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function SettingRow({ theme, I, label, value, last, onClick }: { theme: Theme; I: React.FC<{ size: number; c: string }>; label: string; value: string; last?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${theme.line}`,
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'transparent', border: 'none',
      cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <I size={18} c={theme.ink} />
      </div>
      <div style={{ flex: 1, fontFamily: FONT_TH, fontSize: 15, fontWeight: 600, color: theme.ink }}>{label}</div>
      <div style={{ fontFamily: FONT_TH, fontSize: 14, color: theme.inkSoft }}>{value}</div>
      <Icons.Chevron size={18} c={theme.inkMute} sw={2} />
    </button>
  );
}
