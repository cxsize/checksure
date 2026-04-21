import type { CSSProperties, ReactNode } from 'react';
import type { Theme } from '../../tokens';
import { FONT_TH } from '../../tokens';

interface GhostButtonProps {
  children: ReactNode;
  onClick?: () => void;
  theme: Theme;
  style?: CSSProperties;
}

export function GhostButton({ children, onClick, theme, style }: GhostButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 56,
        borderRadius: 16,
        background: 'transparent',
        color: theme.ink,
        border: `1.5px solid ${theme.line}`,
        fontFamily: FONT_TH,
        fontSize: 17,
        fontWeight: 600,
        cursor: 'pointer',
        padding: '8px 16px',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
