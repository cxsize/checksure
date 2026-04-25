import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useApp } from './contexts/AppContext';
import { fmtTime } from './tokens';
import {
  clockIn as fbClockIn,
  clockOut as fbClockOut,
  signOut as fbSignOut,
} from './services/firebase';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { Toast } from './components/ui/Toast';
import { onForegroundMessage } from './services/messaging';
import { enqueue } from './services/offlineQueue';
import { useOfflineSync } from './hooks/useOfflineSync';
import type { TabKey } from './components/ui/TabBar';

// Lazy-loaded screens (not needed on initial render)
const ClockInScreen = lazy(() => import('./screens/ClockInScreen').then(m => ({ default: m.ClockInScreen })));
const SuccessScreen = lazy(() => import('./screens/SuccessScreen').then(m => ({ default: m.SuccessScreen })));
const HistoryScreen = lazy(() => import('./screens/HistoryScreen').then(m => ({ default: m.HistoryScreen })));
const LeaveScreen   = lazy(() => import('./screens/LeaveScreen').then(m => ({ default: m.LeaveScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));

type Flow = 'login' | 'app' | 'locating-in' | 'locating-out' | 'success-in' | 'success-out';

interface ToastState {
  message: string;
  type: 'error' | 'success';
}

export function App() {
  const { theme, lang, toggleLang, themeKey, setThemeKey, clockState, setClockState, user, profile, authLoading, clockLoading } = useApp();
  const [flow, setFlow] = useState<Flow>('login');
  const [tab, setTab] = useState<TabKey>('home');
  const [lastSiteId, setLastSiteId] = useState<string>('plant-a');
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const fcmUnsubRef = useRef<(() => void) | null>(null);

  // Replay any queued offline clock actions when connectivity resumes
  useOfflineSync(user?.uid);

  // Listen for foreground FCM messages and show as toast
  useEffect(() => {
    if (user && profile?.notificationsEnabled) {
      fcmUnsubRef.current = onForegroundMessage(({ title, body }) => {
        setToast({ message: body || title || 'Notification', type: 'success' });
      });
    }
    return () => { fcmUnsubRef.current?.(); fcmUnsubRef.current = null; };
  }, [user, profile?.notificationsEnabled]);

  // Derive effective flow: auto-redirect to app if authenticated
  const effectiveFlow = (!authLoading && user !== null && flow === 'login') ? 'app' : flow;

  const goClockIn  = () => setFlow('locating-in');
  const goClockOut = () => setFlow('locating-out');

  const confirmIn = async (siteId: string) => {
    const t = new Date();
    const prevState = { ...clockState };
    setLastSiteId(siteId);
    setClockState((s) => ({
      ...s,
      status: 'in',
      clockInTime: t,
      clockOutTime: null,
      siteId,
      lastTime: fmtTime(t),
      shift: s.shift + 1,
    }));
    setFlow('success-in');
    if (user?.uid) {
      try {
        await fbClockIn(user.uid, siteId);
      } catch (err) {
        console.error('Clock-in failed:', err);
        if (!navigator.onLine) {
          // Offline: queue for later sync, keep optimistic UI
          await enqueue({ type: 'clockIn', uid: user.uid, siteId, timestamp: t.getTime() });
          setToast({
            message: lang === 'en' ? 'Saved offline. Will sync when back online.' : 'บันทึกแบบออฟไลน์ จะซิงค์เมื่อออนไลน์',
            type: 'success',
          });
        } else {
          setClockState(prevState);
          setFlow('app');
          setToast({
            message: lang === 'en' ? 'Clock-in failed. Please try again.' : 'ลงเวลาเข้าไม่สำเร็จ กรุณาลองใหม่',
            type: 'error',
          });
        }
      }
    }
  };

  const confirmOut = async () => {
    const t = new Date();
    const prevState = { ...clockState };
    setClockState((s) => ({
      ...s,
      status: 'out',
      clockOutTime: t,
      lastTime: fmtTime(t),
    }));
    setFlow('success-out');
    if (user?.uid) {
      try {
        await fbClockOut(user.uid);
      } catch (err) {
        console.error('Clock-out failed:', err);
        if (!navigator.onLine) {
          await enqueue({ type: 'clockOut', uid: user.uid, timestamp: t.getTime() });
          setToast({
            message: lang === 'en' ? 'Saved offline. Will sync when back online.' : 'บันทึกแบบออฟไลน์ จะซิงค์เมื่อออนไลน์',
            type: 'success',
          });
        } else {
          setClockState(prevState);
          setFlow('app');
          setToast({
            message: lang === 'en' ? 'Clock-out failed. Please try again.' : 'ลงเวลาออกไม่สำเร็จ กรุณาลองใหม่',
            type: 'error',
          });
        }
      }
    }
  };

  const handleSignOut = async () => {
    await fbSignOut();
    setFlow('login');
    setClockState({
      status: 'out',
      clockInTime: null,
      clockOutTime: null,
      siteId: null,
      lastTime: null,
      shift: 0,
    });
  };

  // Show spinner while we wait for Firebase auth or clock state hydration from Firestore
  if (authLoading || clockLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${theme.line}`, borderTopColor: theme.primary, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  const toastOverlay = toast ? <Toast message={toast.message} type={toast.type} theme={theme} onDismiss={dismissToast} /> : null;
  const fallback = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${theme.line}`, borderTopColor: theme.primary, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
    </div>
  );

  if (effectiveFlow === 'login') {
    return <LoginScreen theme={theme} lang={lang} onLogin={() => setFlow('app')} />;
  }
  if (effectiveFlow === 'locating-in') {
    return <Suspense fallback={fallback}><ClockInScreen theme={theme} lang={lang} mode="in"  assignedSiteIds={profile?.assignedSites} onConfirm={confirmIn}  onCancel={() => setFlow('app')} /></Suspense>;
  }
  if (effectiveFlow === 'locating-out') {
    return <Suspense fallback={fallback}><ClockInScreen theme={theme} lang={lang} mode="out" assignedSiteIds={profile?.assignedSites} onConfirm={confirmOut} onCancel={() => setFlow('app')} /></Suspense>;
  }
  if (effectiveFlow === 'success-in') {
    return <Suspense fallback={fallback}><SuccessScreen theme={theme} lang={lang} mode="in"  time={clockState.lastTime ?? ''} siteId={lastSiteId} onDone={() => setFlow('app')} /></Suspense>;
  }
  if (effectiveFlow === 'success-out') {
    return <Suspense fallback={fallback}><SuccessScreen theme={theme} lang={lang} mode="out" time={clockState.lastTime ?? ''} siteId={lastSiteId} onDone={() => setFlow('app')} /></Suspense>;
  }

  let screen: React.ReactNode;
  switch (tab) {
    case 'home':
      screen = (
        <HomeScreen
          theme={theme} lang={lang}
          status={clockState.status}
          clockInTime={clockState.clockInTime}
          shift={clockState.shift}
          profile={profile}
          onClockIn={goClockIn} onClockOut={goClockOut}
          tab={tab} onTab={setTab}
        />
      );
      break;
    case 'history':
      screen = <Suspense fallback={fallback}><HistoryScreen theme={theme} lang={lang} tab={tab} onTab={setTab} /></Suspense>;
      break;
    case 'leave':
      screen = <Suspense fallback={fallback}><LeaveScreen theme={theme} lang={lang} tab={tab} onTab={setTab} /></Suspense>;
      break;
    case 'profile':
      screen = <Suspense fallback={fallback}><ProfileScreen theme={theme} lang={lang} profile={profile} tab={tab} onTab={setTab} onLangToggle={toggleLang} onSignOut={handleSignOut} themeKey={themeKey} onThemeChange={setThemeKey} /></Suspense>;
      break;
  }

  return <>{screen}{toastOverlay}</>;
}

export default App;
