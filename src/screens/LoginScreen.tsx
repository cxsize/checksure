import { useState, useEffect } from 'react';
import liff from '@line/liff';
import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH, FONT_EN } from '../tokens';
import { signInWithLineToken, auth } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Icons } from '../components/ui/Icons';

interface LoginScreenProps {
  theme: Theme;
  lang: Lang;
  onLogin: () => void;
}

export function LoginScreen({ theme, lang, onLogin }: LoginScreenProps) {
  const [liffReady, setLiffReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    liff
      .init({ liffId: import.meta.env.VITE_LIFF_ID ?? '' })
      .then(() => {
        setLiffReady(true);
        // If LIFF already has a session (user returned from LINE auth), proceed immediately
        if (liff.isLoggedIn()) {
          handleLineAuth();
        }
      })
      .catch((err) => {
        // Non-LINE browser or missing LIFF ID — allow dev bypass via button
        console.warn('[LIFF] init failed:', err);
        setLiffReady(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLineAuth() {
    setLoading(true);
    setError(null);
    try {
      const accessToken = liff.getAccessToken();
      if (!accessToken) throw new Error('No LINE access token');

      const apiBase = import.meta.env.VITE_API_BASE_URL as string;
      const res = await fetch(`${apiBase}/lineAuth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const body = (await res.json()) as { customToken?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Auth failed');

      await signInWithLineToken(body.customToken!);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  function handlePress() {
    if (!liffReady) {
      // Dev mode: sign in anonymously against the local Auth emulator
      setLoading(true);
      signInAnonymously(auth)
        .then(() => onLogin())
        .catch((err: Error) => { setError(err.message); setLoading(false); });
      return;
    }
    if (liff.isLoggedIn()) {
      handleLineAuth();
    } else {
      liff.login();
    }
  }

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

      {error && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: theme.warnSoft, color: theme.warn, fontFamily: FONT_TH, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* LINE login button */}
      <button
        onClick={handlePress}
        disabled={loading}
        style={{
          width: '100%', minHeight: 64, borderRadius: 18, border: 'none',
          background: loading ? '#04a044' : '#06C755', color: '#fff', cursor: loading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontFamily: FONT_TH, fontSize: 19, fontWeight: 700,
          boxShadow: '0 8px 20px -8px rgba(6,199,85,0.6)',
          transition: 'background 0.2s',
        }}
      >
        {loading ? (
          <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        ) : (
          <Icons.Line size={24} c="#fff" />
        )}
        {loading
          ? (lang === 'en' ? 'Signing in…' : 'กำลังเข้าสู่ระบบ...')
          : COPY.loginLine[lang]}
      </button>

      <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        {COPY.loginNote[lang]}
      </div>
    </div>
  );
}
