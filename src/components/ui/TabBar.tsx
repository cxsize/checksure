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
      paddingBottom: 28,
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
              minHeight: 56,
              border: 'none',
              background: active ? theme.primarySoft : 'transparent',
              borderRadius: 0,
              cursor: 'pointer',
              padding: '10px 4px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              color: active ? theme.primary : theme.inkMute,
              transition: 'background 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <I size={22} c={active ? theme.primary : theme.inkMute} sw={active ? 2.2 : 1.8} />
            <div style={{ fontFamily: FONT_TH, fontSize: 11, fontWeight: active ? 700 : 500 }}>
              {COPY[copyKey][lang]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
