import type { Theme, Lang } from '../../tokens';
import { COPY, FONT_TH } from '../../tokens';

type Status = 'in' | 'out';

interface StatusChipProps {
  status: Status;
  theme: Theme;
  lang: Lang;
}

export function StatusChip({ status, theme, lang }: StatusChipProps) {
  const variants = {
    in:    { bg: theme.accentSoft,   fg: theme.accent,   dot: theme.accent,   key: 'clockedIn'    } as const,
    out:   { bg: theme.chipBg,       fg: theme.inkSoft,  dot: theme.inkMute,  key: 'notClockedIn' } as const,
  };
  const v = variants[status];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: v.bg,
      color: v.fg,
      borderRadius: 999,
      padding: '4px 10px 4px 8px',
      fontFamily: FONT_TH,
      fontSize: 11,
      fontWeight: 700,
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        background: v.dot,
        boxShadow: status === 'in' ? `0 0 0 3px ${v.bg}` : 'none',
      }} />
      {COPY[v.key][lang]}
    </div>
  );
}
