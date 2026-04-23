import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ThemeKey, Theme, Lang } from '../tokens';
import { THEMES } from '../tokens';
import { onAuthChange } from '../services/firebase';

interface User { uid: string; displayName: string | null }

export type AppStatus = 'out' | 'in' | 'break';

export interface ClockState {
  status: AppStatus;
  clockInTime: Date | null;
  clockOutTime: Date | null;
  breakStartTime: Date | null;
  breakMinutes: number;
  siteId: string | null;
  lastTime: string | null;
}

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  themeKey: ThemeKey;
  theme: Theme;
  setThemeKey: (k: ThemeKey) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  clockState: ClockState;
  setClockState: React.Dispatch<React.SetStateAction<ClockState>>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const DEFAULT_CLOCK: ClockState = {
  status: 'out',
  clockInTime: null,
  clockOutTime: null,
  breakStartTime: null,
  breakMinutes: 0,
  siteId: null,
  lastTime: null,
};

function loadClock(): ClockState {
  try {
    const raw = sessionStorage.getItem('clockState');
    if (!raw) return DEFAULT_CLOCK;
    const p = JSON.parse(raw) as Partial<ClockState & { clockInTime: string; clockOutTime: string; breakStartTime: string }>;
    return {
      ...DEFAULT_CLOCK,
      ...p,
      clockInTime:    p.clockInTime    ? new Date(p.clockInTime)    : null,
      clockOutTime:   p.clockOutTime   ? new Date(p.clockOutTime)   : null,
      breakStartTime: p.breakStartTime ? new Date(p.breakStartTime) : null,
    };
  } catch {
    return DEFAULT_CLOCK;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [themeKey, _setThemeKey] = useState<ThemeKey>(
    () => (localStorage.getItem('themeKey') as ThemeKey | null) ?? 'warm',
  );
  const [lang, _setLang] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang | null) ?? 'th',
  );
  const [clockState, setClockState] = useState<ClockState>(loadClock);

  // Firebase auth state listener — fires once on mount with cached session
  useEffect(() => {
    const unsubscribe = onAuthChange((fbUser) => {
      setUser(fbUser ? { uid: fbUser.uid, displayName: fbUser.displayName } : null);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('clockState', JSON.stringify(clockState));
    } catch { /* quota */ }
  }, [clockState]);

  const setThemeKey = (k: ThemeKey) => {
    localStorage.setItem('themeKey', k);
    _setThemeKey(k);
  };

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l);
    _setLang(l);
  };

  const toggleLang = () => setLang(lang === 'th' ? 'en' : 'th');

  return (
    <AppContext.Provider value={{
      user, authLoading,
      themeKey, theme: THEMES[themeKey], setThemeKey,
      lang, setLang, toggleLang,
      clockState, setClockState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
