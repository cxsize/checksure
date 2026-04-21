import { useState } from 'react';
import { useApp } from './contexts/AppContext';
import { fmtTime } from './tokens';
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
  const { theme, lang, toggleLang, themeKey, setThemeKey, clockState, setClockState } = useApp();
  const [flow, setFlow] = useState<Flow>('login');
  const [tab, setTab] = useState<TabKey>('home');
  const [lastSiteId, setLastSiteId] = useState<string>('plant-a');

  const goClockIn  = () => setFlow('locating-in');
  const goClockOut = () => setFlow('locating-out');

  const toggleBreak = () =>
    setClockState((s) => ({ ...s, status: s.status === 'in' ? 'break' : 'in' }));

  const confirmIn = (siteId: string) => {
    const t = new Date();
    setLastSiteId(siteId);
    setClockState((s) => ({ ...s, status: 'in', clockInTime: t, breakMinutes: 0, siteId, lastTime: fmtTime(t) }));
    setFlow('success-in');
  };

  const confirmOut = (_siteId: string) => {
    const t = new Date();
    setClockState((s) => ({ ...s, status: 'out', lastTime: fmtTime(t) }));
    setFlow('success-out');
  };

  const handleSignOut = () => {
    setFlow('login');
    setClockState({ status: 'out', clockInTime: null, breakMinutes: 0, siteId: null, lastTime: null });
  };

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
