import type { Theme, Lang } from '../../tokens';
import { COPY, FONT_TH } from '../../tokens';
import { Icons } from './Icons';

export type TabKey = 'home' | 'history' | 'leave' | 'profile';

interface TabBarProps {
  tab: TabKey;
  onTab: (t: TabKey) => void;
  theme: Theme;
  lang: Lang;
}

const TABS: { key: TabKey; copyKey: keyof typeof COPY; Icon: keyof typeof Icons }[] = [
  { key: 'home',    copyKey: 'home',    Icon: 'Home' },
  { key: 'history', copyKey: 'history', Icon: 'Calendar' },
  { key: 'leave',   copyKey: 'leave',   Icon: 'Leave' },
  { key: 'profile', copyKey: 'profile', Icon: 'Person' },
];

export function TabBar({ tab, onTab, theme, lang }: TabBarProps) {
  return (
    <div style={{
      flexShrink: 0,
      background: theme.card,
      borderTop: `1px solid ${theme.line}`,
      display: 'flex',
      padding: '10px 8px 28px',
    }}>
      {TABS.map(({ key, copyKey, Icon }) => {
        const active = tab === key;
        const I = Icons[Icon] as React.FC<{ size: number; c: string; sw: number }>;
        return (
          <button
            key={key}
            onClick={() => onTab(key)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: active ? theme.primary : theme.inkMute,
            }}
          >
            <I size={26} c={active ? theme.primary : theme.inkMute} sw={active ? 2.2 : 1.8} />
            <div style={{ fontFamily: FONT_TH, fontSize: 12, fontWeight: active ? 700 : 500 }}>
              {COPY[copyKey][lang]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
