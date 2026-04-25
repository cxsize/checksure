import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ThemeKey, Theme, Lang } from '../tokens';
import { fmtTime, THEMES } from '../tokens';
import { onAuthChange, getTodayShifts, getUserProfile, upsertUserProfile } from '../services/firebase';
import type { AttendanceRecord, UserProfile } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';

interface User { uid: string; displayName: string | null; isAnonymous: boolean }

export type AppStatus = 'out' | 'in';

export interface ClockState {
  status: AppStatus;
  clockInTime: Date | null;
  clockOutTime: Date | null;
  siteId: string | null;
  lastTime: string | null;
  shift: number; // current shift number today (1-based)
}

interface AppContextValue {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
  clockLoading: boolean;
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
  siteId: null,
  lastTime: null,
  shift: 0,
};

function recordToClockState(record: AttendanceRecord, shift: number): ClockState {
  const clockInDate = record.clockIn instanceof Timestamp ? record.clockIn.toDate() : null;
  const clockOutDate = record.clockOut instanceof Timestamp ? record.clockOut.toDate() : null;
  const latestTime = clockOutDate ?? clockInDate;
  const status: AppStatus = record.clockOut ? 'out' : 'in';
  return {
    status,
    clockInTime: clockInDate,
    clockOutTime: clockOutDate,
    siteId: record.siteId,
    lastTime: latestTime ? fmtTime(latestTime) : null,
    shift,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [themeKey, _setThemeKey] = useState<ThemeKey>(
    () => (localStorage.getItem('themeKey') as ThemeKey | null) ?? 'warm',
  );
  const [lang, _setLang] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang | null) ?? 'th',
  );
  const [clockState, setClockState] = useState<ClockState>(DEFAULT_CLOCK);

  // Hydrate clockState + user profile from Firestore after auth resolves
  const hydrateUserData = useCallback(async (uid: string) => {
    setClockLoading(true);
    try {
      const [shifts, userProfile] = await Promise.all([
        getTodayShifts(uid),
        getUserProfile(uid),
      ]);
      if (shifts.length > 0) {
        const latest = shifts[shifts.length - 1];
        setClockState(recordToClockState(latest, shifts.length));
      } else {
        setClockState(DEFAULT_CLOCK);
      }
      setProfile(userProfile);
      // Apply saved preferences from Firestore
      if (userProfile?.lang) {
        localStorage.setItem('lang', userProfile.lang);
        _setLang(userProfile.lang);
      }
      if (userProfile?.theme) {
        localStorage.setItem('themeKey', userProfile.theme);
        _setThemeKey(userProfile.theme);
      }
    } catch (err) {
      console.error('Failed to hydrate user data:', err);
      setClockState(DEFAULT_CLOCK);
    } finally {
      setClockLoading(false);
    }
  }, []);

  // Firebase auth state listener — fires once on mount with cached session
  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      // In production, sign out stale anonymous sessions so LINE login can take over
      if (fbUser && fbUser.isAnonymous && !import.meta.env.DEV) {
        await fbUser.delete().catch(() => {});
        setUser(null);
        setAuthLoading(false);
        return;
      }
      if (fbUser) {
        setUser({ uid: fbUser.uid, displayName: fbUser.displayName, isAnonymous: fbUser.isAnonymous });
        hydrateUserData(fbUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        setClockState(DEFAULT_CLOCK);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [hydrateUserData]);

  const setThemeKey = (k: ThemeKey) => {
    localStorage.setItem('themeKey', k);
    _setThemeKey(k);
    if (user?.uid) upsertUserProfile(user.uid, { theme: k }).catch(console.error);
  };

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l);
    _setLang(l);
    if (user?.uid) upsertUserProfile(user.uid, { lang: l }).catch(console.error);
  };

  const toggleLang = () => setLang(lang === 'th' ? 'en' : 'th');

  return (
    <AppContext.Provider value={{
      user, profile, authLoading, clockLoading,
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
