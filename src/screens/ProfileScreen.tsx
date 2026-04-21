import type { Theme, Lang, ThemeKey } from '../tokens';
import { COPY, FONT_TH, FONT_EN, FONT_NUM, MOCK_EMPLOYEE, MOCK_SITES, THEMES } from '../tokens';
import type { TabKey } from '../components/ui/TabBar';
import { TabBar } from '../components/ui/TabBar';
import { Icons } from '../components/ui/Icons';

interface ProfileScreenProps {
  theme: Theme;
  lang: Lang;
  tab: TabKey;
  onTab: (t: TabKey) => void;
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

export function ProfileScreen({ theme, lang, tab, onTab, onLangToggle, onSignOut, themeKey, onThemeChange }: ProfileScreenProps) {
  const emp = MOCK_EMPLOYEE;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Profile header */}
        <div style={{ padding: '22px 24px 0', background: theme.card, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 24 }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 28, fontWeight: 800, color: theme.ink, letterSpacing: -0.3 }}>
            {COPY.profile[lang]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
            <div style={{
              width: 68, height: 68, borderRadius: 20, background: theme.primarySoft, color: theme.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_EN, fontSize: 26, fontWeight: 800,
            }}>
              {emp.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_TH, fontSize: 19, fontWeight: 800, color: theme.ink }}>{emp.name[lang]}</div>
              <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft, marginTop: 2 }}>{emp.dept[lang]}</div>
              <div style={{ fontFamily: FONT_EN, fontSize: 12, color: theme.inkMute, marginTop: 3, letterSpacing: 0.4 }}>{emp.id}</div>
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
              <MonthStat theme={theme} value="168" label={COPY.totalHours[lang]} />
              <MonthStat theme={theme} value="21"  label={COPY.daysWorked[lang]} />
              <MonthStat theme={theme} value="18.5" label={COPY.otThisMonth[lang]} highlight={theme.primary} />
            </div>
            <button style={{
              marginTop: 16, width: '100%', minHeight: 48, border: 'none', borderRadius: 14,
              background: theme.ink, color: theme.card, cursor: 'pointer',
              fontFamily: FONT_TH, fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icons.Wallet size={18} c={theme.card} />
              {COPY.payslip[lang]}
            </button>
          </div>
        </div>

        {/* Settings */}
        <div style={{ padding: '18px 20px 24px' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: theme.inkSoft, marginBottom: 10, paddingLeft: 4 }}>
            {COPY.settings[lang]}
          </div>
          <div style={{ background: theme.card, borderRadius: 20, border: `1px solid ${theme.line}`, overflow: 'hidden' }}>
            <SettingRow theme={theme} I={Icons.Globe}   label={COPY.language[lang]} value={lang === 'en' ? 'English' : 'ภาษาไทย'} onClick={onLangToggle} />
            <SettingRow theme={theme} I={Icons.Bell}    label={COPY.notif[lang]}    value={lang === 'en' ? 'On' : 'เปิด'} />
            <SettingRow theme={theme} I={Icons.Pin}     label={COPY.site[lang]}     value={MOCK_SITES[0].name[lang]} />
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
      <TabBar tab={tab} onTab={onTab} theme={theme} lang={lang} />
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
