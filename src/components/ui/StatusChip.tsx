import type { Theme, Lang } from '../../tokens';
import { COPY, FONT_TH } from '../../tokens';

type Status = 'in' | 'out' | 'break';

interface StatusChipProps {
  status: Status;
  theme: Theme;
  lang: Lang;
}

export function StatusChip({ status, theme, lang }: StatusChipProps) {
  const variants = {
    in:    { bg: theme.accentSoft,   fg: theme.accent,   dot: theme.accent,   key: 'clockedIn'    } as const,
    out:   { bg: theme.chipBg,       fg: theme.inkSoft,  dot: theme.inkMute,  key: 'notClockedIn' } as const,
    break: { bg: theme.primarySoft,  fg: theme.primary,  dot: theme.primary,  key: 'onBreak'      } as const,
  };
  const v = variants[status];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: v.bg,
      color: v.fg,
      borderRadius: 999,
      padding: '8px 14px',
      fontFamily: FONT_TH,
      fontSize: 14,
      fontWeight: 600,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: v.dot,
        boxShadow: status === 'in' ? `0 0 0 4px ${v.bg}` : 'none',
      }} />
      {COPY[v.key][lang]}
    </div>
  );
}
