import { useState, useEffect, useCallback } from 'react';
import { listUsers, createUser, updateUser, deactivateUser, activateUser } from '../api';
import type { AdminUser } from '../api';

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUid, setEditUid] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listUsers({ limit: 50 });
      setUsers(res.users);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleToggleActive = async (u: AdminUser) => {
    try {
      if (u.active !== false) {
        await deactivateUser(u.uid);
      } else {
        await activateUser(u.uid);
      }
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={s.title}>Users</h2>
        <button onClick={() => setShowCreate(true)} style={s.primaryBtn}>+ Add User</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {showCreate && (
        <CreateUserForm
          onDone={() => { setShowCreate(false); refresh(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editUid && (
        <EditUserForm
          uid={editUid}
          user={users.find((u) => u.uid === editUid)!}
          onDone={() => { setEditUid(null); refresh(); }}
          onCancel={() => setEditUid(null)}
        />
      )}

      {loading ? (
        <div style={s.muted}>Loading...</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Role</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td style={s.td}>{u.displayName || '—'}</td>
                <td style={s.td}>{u.email || '—'}</td>
                <td style={s.td}>
                  <span style={{
                    ...s.badge,
                    background: u.role === 'admin' ? '#fef3c7' : '#dbeafe',
                    color: u.role === 'admin' ? '#92400e' : '#1e40af',
                  }}>
                    {u.role || 'employee'}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={{
                    ...s.badge,
                    background: u.active !== false ? '#d1fae5' : '#fee2e2',
                    color: u.active !== false ? '#065f46' : '#991b1b',
                  }}>
                    {u.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={s.td}>
                  <button onClick={() => setEditUid(u.uid)} style={s.actionBtn}>Edit</button>
                  <button onClick={() => handleToggleActive(u)} style={{ ...s.actionBtn, color: u.active !== false ? '#dc2626' : '#059669' }}>
                    {u.active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CreateUserForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createUser({ email, password, displayName, role });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.formCard}>
      <h3 style={{ margin: '0 0 16px' }}>Create User</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={s.input} required />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} required />
        <input placeholder="Password (min 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={s.input} required minLength={6} />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={s.input}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        {error && <div style={s.error}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy} style={s.primaryBtn}>{busy ? 'Creating...' : 'Create'}</button>
          <button type="button" onClick={onCancel} style={s.cancelBtn}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function EditUserForm({ uid, user, onDone, onCancel }: { uid: string; user: AdminUser; onDone: () => void; onCancel: () => void }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [role, setRole] = useState(user.role || 'employee');
  const [siteIds, setSiteIds] = useState((user.siteIds || []).join(', '));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updateUser(uid, {
        displayName,
        role,
        siteIds: siteIds.split(',').map((s) => s.trim()).filter(Boolean),
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.formCard}>
      <h3 style={{ margin: '0 0 16px' }}>Edit User</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={s.input} required />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={s.input}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <input placeholder="Site IDs (comma-separated)" value={siteIds} onChange={(e) => setSiteIds(e.target.value)} style={s.input} />
        {error && <div style={s.error}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy} style={s.primaryBtn}>{busy ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onCancel} style={s.cancelBtn}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  primaryBtn: {
    padding: '10px 18px', background: '#E8734A', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 18px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  actionBtn: {
    background: 'transparent', border: 'none', color: '#E8734A',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', marginRight: 8,
  },
  table: {
    width: '100%', borderCollapse: 'collapse' as const, background: '#fff',
    borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  th: {
    textAlign: 'left' as const, padding: '12px 16px', fontSize: 12, fontWeight: 600,
    color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 0.5,
    borderBottom: '1px solid #e5e7eb', background: '#f9fafb',
  },
  td: {
    padding: '12px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6',
  },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
  },
  error: { color: '#dc2626', fontSize: 13 },
  muted: { color: '#9ca3af', fontSize: 14 },
  formCard: {
    background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20,
    border: '1px solid #e5e7eb', maxWidth: 420,
  },
  input: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
    outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
  },
};
