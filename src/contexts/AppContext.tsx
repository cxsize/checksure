import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ThemeKey, Theme, Lang } from '../tokens';
import { THEMES } from '../tokens';

// Lightweight User type — no Firebase dependency at context level
interface User { uid: string; displayName: string | null }

export type AppStatus = 'out' | 'in' | 'break';

export interface ClockState {
  status: AppStatus;
  clockInTime: Date | null;
  breakMinutes: number;
  siteId: string | null;
  lastTime: string | null;
}

interface AppContextValue {
  // Auth
  user: User | null;
  authLoading: boolean;
  // Theme
  themeKey: ThemeKey;
  theme: Theme;
  setThemeKey: (k: ThemeKey) => void;
  // Language
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  // Clock state
  clockState: ClockState;
  setClockState: React.Dispatch<React.SetStateAction<ClockState>>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [themeKey, setThemeKey] = useState<ThemeKey>('warm');
  const [lang, setLang] = useState<Lang>('th');
  const [clockState, setClockState] = useState<ClockState>({
    status: 'out',
    clockInTime: null,
    breakMinutes: 0,
    siteId: null,
    lastTime: null,
  });

  useEffect(() => {
    // Skip Firebase auth watcher in dev when Firebase isn't configured
    setAuthLoading(false);
  }, []);

  const toggleLang = () => setLang((l) => (l === 'th' ? 'en' : 'th'));

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
