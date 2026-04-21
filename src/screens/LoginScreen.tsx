import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH, FONT_EN } from '../tokens';
import { Icons } from '../components/ui/Icons';

interface LoginScreenProps {
  theme: Theme;
  lang: Lang;
  onLogin: () => void;
}

export function LoginScreen({ theme, lang, onLogin }: LoginScreenProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 28px 32px', background: theme.bg }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
        {/* Brand mark */}
        <div style={{
          width: 112, height: 112, borderRadius: 32, background: theme.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 20px 40px -12px ${theme.primary}66`,
          position: 'relative',
        }}>
          <Icons.Clock size={58} c={theme.primaryInk} sw={2.4} />
          <div style={{
            position: 'absolute', right: -6, bottom: -6, width: 36, height: 36,
            borderRadius: 18, background: theme.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${theme.bg}`,
          }}>
            <Icons.Pin size={18} c="#fff" sw={2.4} />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 38, fontWeight: 800, color: theme.ink, letterSpacing: -0.5, lineHeight: 1.05 }}>
            {COPY.appName[lang]}
          </div>
          <div style={{ fontFamily: FONT_EN, fontSize: 14, color: theme.inkSoft, marginTop: 10, letterSpacing: 0.3 }}>
            {lang === 'en' ? 'Clock in where it matters' : 'ลงเวลาง่าย ๆ ตรงที่ทำงานจริง'}
          </div>
        </div>
      </div>

      {/* Illustration placeholder */}
      <div style={{
        height: 120, borderRadius: 20, marginBottom: 24,
        background: `repeating-linear-gradient(135deg, ${theme.surface}, ${theme.surface} 8px, ${theme.line} 8px, ${theme.line} 9px)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px dashed ${theme.line}`,
      }}>
        <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: theme.inkMute, background: theme.bg, padding: '4px 10px', borderRadius: 6 }}>
          [illustration · friendly factory worker]
        </div>
      </div>

      {/* LINE login button */}
      <button onClick={onLogin} style={{
        width: '100%', minHeight: 64, borderRadius: 18, border: 'none',
        background: '#06C755', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        fontFamily: FONT_TH, fontSize: 19, fontWeight: 700,
        boxShadow: '0 8px 20px -8px rgba(6,199,85,0.6)',
      }}>
        <Icons.Line size={24} c="#fff" />
        {COPY.loginLine[lang]}
      </button>

      <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        {COPY.loginNote[lang]}
      </div>
    </div>
  );
}
