import type { Theme } from '../../tokens';
import { FONT_NUM } from '../../tokens';

interface BigTimeProps {
  value: string;
  theme: Theme;
  size?: number;
  weight?: number;
}

export function BigTime({ value, theme, size = 64, weight = 700 }: BigTimeProps) {
  return (
    <div style={{
      fontFamily: FONT_NUM,
      fontSize: size,
      fontWeight: weight,
      color: theme.ink,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: -1.5,
      lineHeight: 1,
    }}>
      {value}
    </div>
  );
}
