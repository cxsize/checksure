import { useState, useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import { fmtTime } from './tokens';
import {
  clockIn as fbClockIn,
  clockOut as fbClockOut,
  signOut as fbSignOut,
} from './services/firebase';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ClockInScreen } from './screens/ClockInScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { LeaveScreen } from './screens/LeaveScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import type { TabKey } from './components/ui/TabBar';

type Flow = 'login' | 'app' | 'locating-in' | 'locating-out' | 'success-in' | 'success-out';

export function App() {
  const { theme, lang, toggleLang, themeKey, setThemeKey, clockState, setClockState, user, authLoading } = useApp();
  const [flow, setFlow] = useState<Flow>('login');
  const [tab, setTab] = useState<TabKey>('home');
  const [lastSiteId, setLastSiteId] = useState<string>('plant-a');

  // Skip login screen if Firebase auth session is already active
  useEffect(() => {
    if (!authLoading && user !== null && flow === 'login') {
      setFlow('app');
    }
  }, [user, authLoading, flow]);

  const goClockIn  = () => setFlow('locating-in');
  const goClockOut = () => setFlow('locating-out');

  const toggleBreak = () =>
    setClockState((s) => {
      if (s.status === 'in') {
        return { ...s, status: 'break', breakStartTime: new Date() };
      }
      const elapsed = s.breakStartTime
        ? Math.floor((Date.now() - s.breakStartTime.getTime()) / 60000)
        : 0;
      return { ...s, status: 'in', breakMinutes: s.breakMinutes + elapsed, breakStartTime: null };
    });

  const confirmIn = (siteId: string) => {
    const t = new Date();
    setLastSiteId(siteId);
    setClockState((s) => ({
      ...s,
      status: 'in',
      clockInTime: t,
      clockOutTime: null,
      breakMinutes: 0,
      breakStartTime: null,
      siteId,
      lastTime: fmtTime(t),
    }));
    setFlow('success-in');
    if (user?.uid) fbClockIn(user.uid, siteId).catch(console.error);
  };

  const confirmOut = (_siteId: string) => {
    const t = new Date();
    setClockState((s) => {
      const breakElapsed = s.status === 'break' && s.breakStartTime
        ? Math.floor((t.getTime() - s.breakStartTime.getTime()) / 60000)
        : 0;
      return {
        ...s,
        status: 'out',
        clockOutTime: t,
        lastTime: fmtTime(t),
        breakMinutes: s.breakMinutes + breakElapsed,
        breakStartTime: null,
      };
    });
    setFlow('success-out');
    if (user?.uid) fbClockOut(user.uid).catch(console.error);
  };

  const handleSignOut = async () => {
    await fbSignOut();
    setFlow('login');
    setClockState({
      status: 'out',
      clockInTime: null,
      clockOutTime: null,
      breakStartTime: null,
      breakMinutes: 0,
      siteId: null,
      lastTime: null,
    });
  };

  // Show nothing while we wait for Firebase to resolve the cached auth session
  if (authLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${theme.line}`, borderTopColor: theme.primary, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  if (flow === 'login') {
    return <LoginScreen theme={theme} lang={lang} onLogin={() => setFlow('app')} />;
  }
  if (flow === 'locating-in') {
    return <ClockInScreen theme={theme} lang={lang} mode="in"  onConfirm={confirmIn}  onCancel={() => setFlow('app')} />;
  }
  if (flow === 'locating-out') {
    return <ClockInScreen theme={theme} lang={lang} mode="out" onConfirm={confirmOut} onCancel={() => setFlow('app')} />;
  }
  if (flow === 'success-in') {
    return <SuccessScreen theme={theme} lang={lang} mode="in"  time={clockState.lastTime ?? ''} siteId={lastSiteId} onDone={() => setFlow('app')} />;
  }
  if (flow === 'success-out') {
    return <SuccessScreen theme={theme} lang={lang} mode="out" time={clockState.lastTime ?? ''} siteId={lastSiteId} onDone={() => setFlow('app')} />;
  }

  switch (tab) {
    case 'home':
      return (
        <HomeScreen
          theme={theme} lang={lang}
          status={clockState.status}
          clockInTime={clockState.clockInTime}
          breakStartTime={clockState.breakStartTime}
          breakMinutes={clockState.breakMinutes}
          onClockIn={goClockIn} onClockOut={goClockOut} onBreak={toggleBreak}
          tab={tab} onTab={setTab}
        />
      );
    case 'history':
      return <HistoryScreen theme={theme} lang={lang} tab={tab} onTab={setTab} />;
    case 'leave':
      return <LeaveScreen    theme={theme} lang={lang} tab={tab} onTab={setTab} />;
    case 'profile':
      return <ProfileScreen  theme={theme} lang={lang} tab={tab} onTab={setTab} onLangToggle={toggleLang} onSignOut={handleSignOut} themeKey={themeKey} onThemeChange={setThemeKey} />;
  }
}

export default App;
