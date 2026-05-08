import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { setAuthToken } from './api';
import { UsersPanel } from './panels/UsersPanel';
import { SitesPanel } from './panels/SitesPanel';
import { AttendancePanel } from './panels/AttendancePanel';
import { LeavePanel } from './panels/LeavePanel';

// Initialize Firebase (same project as employee app)
function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

const app = getFirebaseApp();
const auth = getAuth(app);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

type Tab = 'users' | 'sites' | 'attendance' | 'leave';

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('users');
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdToken();
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }
      setLoading(false);
    });
  }, []);

  // Refresh token periodically (tokens expire after 1 hour)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const token = await user.getIdToken(true);
      setAuthToken(token);
    }, 50 * 60 * 1000); // every 50 min
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError((err as Error).message);
    }
  };

  const handleSignOut = () => signOut(auth);

  if (loading) {
    return <div style={styles.center}><div style={styles.spinner} /></div>;
  }

  if (!user) {
    return (
      <div style={styles.center}>
        <form onSubmit={handleLogin} style={styles.loginCard}>
          <h1 style={styles.loginTitle}>CheckSure Admin</h1>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          {loginError && <div style={styles.error}>{loginError}</div>}
          <button type="submit" style={styles.loginBtn}>Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <nav style={styles.sidebar}>
        <div style={styles.brand}>CheckSure</div>
        <div style={styles.brandSub}>Admin Panel</div>
        <div style={{ marginTop: 24 }}>
          {(['users', 'sites', 'attendance', 'leave'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.navBtn,
                background: tab === t ? '#E8734A' : 'transparent',
                color: tab === t ? '#fff' : '#6b7280',
              }}
            >
              {t === 'users' ? 'Users' : t === 'sites' ? 'Sites' : t === 'attendance' ? 'Attendance' : 'Leave'}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={styles.userInfo}>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>{user.email}</div>
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
        </div>
      </nav>

      {/* Main content */}
      <main style={styles.main}>
        {tab === 'users' && <UsersPanel />}
        {tab === 'sites' && <SitesPanel />}
        {tab === 'attendance' && <AttendancePanel />}
        {tab === 'leave' && <LeavePanel />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f3f4f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  spinner: {
    width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#E8734A',
    borderRadius: '50%', animation: 'spin 0.9s linear infinite',
  },
  loginCard: {
    background: '#fff', borderRadius: 16, padding: 40, width: 360,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 16,
  },
  loginTitle: {
    fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, textAlign: 'center' as const,
  },
  input: {
    padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 15,
    outline: 'none', fontFamily: 'inherit',
  },
  error: {
    color: '#dc2626', fontSize: 13, textAlign: 'center' as const,
  },
  loginBtn: {
    padding: '12px 0', background: '#E8734A', color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  layout: {
    minHeight: '100vh', display: 'flex',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#f3f4f6',
  },
  sidebar: {
    width: 220, background: '#fff', borderRight: '1px solid #e5e7eb',
    display: 'flex', flexDirection: 'column', padding: '20px 12px',
  },
  brand: { fontSize: 18, fontWeight: 800, color: '#E8734A', paddingLeft: 8 },
  brandSub: { fontSize: 12, color: '#9ca3af', paddingLeft: 8, marginTop: 2 },
  navBtn: {
    display: 'block', width: '100%', textAlign: 'left' as const,
    padding: '10px 12px', border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 4,
  },
  userInfo: {
    padding: '12px 8px', borderTop: '1px solid #e5e7eb',
  },
  signOutBtn: {
    marginTop: 8, background: 'transparent', border: 'none', color: '#dc2626',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
  },
  main: {
    flex: 1, padding: 24, overflow: 'auto',
  },
};
