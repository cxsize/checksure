import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Theme } from '../../tokens';
import { FONT_TH, FONT_EN } from '../../tokens';
import { Icons } from './Icons';

interface BigButtonProps {
  label: string | ReactNode;
  sublabel?: string;
  onClick?: () => void;
  theme: Theme;
  color?: string;
  inkColor?: string;
  icon?: ReactNode;
  disabled?: boolean;
  style?: CSSProperties;
}

export function BigButton({ label, sublabel, onClick, theme, color, inkColor, icon, disabled, style }: BigButtonProps) {
  const bg = disabled ? theme.line : (color ?? theme.primary);
  const ink = disabled ? theme.inkMute : (inkColor ?? theme.primaryInk);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => { if (!disabled && ref.current) ref.current.style.transform = 'scale(0.98)'; }}
      onPointerUp={() => { if (ref.current) ref.current.style.transform = ''; }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = ''; }}
      style={{
        width: '100%',
        minHeight: 72,
        border: 'none',
        borderRadius: 20,
        background: bg,
        color: ink,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '14px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: disabled ? 'none' : '0 8px 20px -8px rgba(0,0,0,0.2)',
        transition: 'transform .12s, box-shadow .12s',
        ...style,
      }}
    >
      {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1, textAlign: 'left' }}>
        {typeof label === 'string' ? (
          <div style={{ fontFamily: FONT_TH, fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>{label}</div>
        ) : label}
        {sublabel && (
          <div style={{ fontFamily: FONT_EN, fontSize: 13, fontWeight: 500, opacity: 0.8, marginTop: 4, letterSpacing: 0.2 }}>
            {sublabel}
          </div>
        )}
      </div>
      <Icons.Arrow size={22} c={ink} />
    </button>
  );
}
