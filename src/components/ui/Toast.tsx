import { useEffect } from 'react';
import type { Theme } from '../../tokens';
import { FONT_TH } from '../../tokens';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  theme: Theme;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, type, theme, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const bg = type === 'error' ? theme.warnSoft : theme.accentSoft;
  const fg = type === 'error' ? theme.warn : theme.accent;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 20, right: 20, zIndex: 9999,
      background: bg, color: fg, padding: '14px 18px', borderRadius: 16,
      fontFamily: FONT_TH, fontSize: 14, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      animation: 'slideUp 0.25s ease-out',
    }}>
      {message}
    </div>
  );
}
