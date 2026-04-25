import { useState } from 'react';
import { queryAttendance } from '../api';
import type { AttendanceRow } from '../api';

export function AttendancePanel() {
  const [uid, setUid] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await queryAttendance({
        uid,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });
      setRecords(res.records);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fmtMinutes = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div>
      <h2 style={s.title}>Attendance Records</h2>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={s.label}>User ID</label>
          <input placeholder="uid" value={uid} onChange={(e) => setUid(e.target.value)} style={s.input} required />
        </div>
        <div>
          <label style={s.label}>From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={s.input} />
        </div>
        <div>
          <label style={s.label}>To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={s.input} />
        </div>
        <button type="submit" style={s.primaryBtn}>Search</button>
      </form>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.muted}>Loading...</div>
      ) : searched && records.length === 0 ? (
        <div style={s.muted}>No records found.</div>
      ) : records.length > 0 ? (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Date</th>
              <th style={s.th}>Shift</th>
              <th style={s.th}>Clock In</th>
              <th style={s.th}>Clock Out</th>
              <th style={s.th}>Worked</th>
              <th style={s.th}>OT</th>
              <th style={s.th}>Site</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td style={s.td}>{r.date}</td>
                <td style={s.td}>{r.shift}</td>
                <td style={s.td}>{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '—'}</td>
                <td style={s.td}>{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '—'}</td>
                <td style={s.td}>{fmtMinutes(r.workedMinutes)}</td>
                <td style={{ ...s.td, color: r.otMinutes > 0 ? '#E8734A' : '#9ca3af', fontWeight: r.otMinutes > 0 ? 600 : 400 }}>
                  {fmtMinutes(r.otMinutes)}
                </td>
                <td style={s.td}>{r.siteId || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 },
  primaryBtn: {
    padding: '10px 18px', background: '#E8734A', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', height: 42,
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
    padding: '10px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6',
  },
  error: { color: '#dc2626', fontSize: 13 },
  muted: { color: '#9ca3af', fontSize: 14 },
  input: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
    outline: 'none', fontFamily: 'inherit',
  },
};
