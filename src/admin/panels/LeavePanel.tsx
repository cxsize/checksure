import { useState, useEffect, useCallback } from 'react';
import { listLeaveRequests, approveLeave, rejectLeave } from '../api';
import type { LeaveRow } from '../api';

const TYPE_LABEL: Record<string, string> = { sick: 'Sick', personal: 'Personal', vacation: 'Vacation' };
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#d1fae5', color: '#065f46' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
};

export function LeavePanel() {
  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listLeaveRequests({ status: filter || undefined, limit: 100 });
      setRequests(res.requests);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApprove = async (req: LeaveRow) => {
    setActionBusy(req.id);
    try {
      await approveLeave(req.uid, req.id, commentFor === req.id ? comment : undefined);
      setCommentFor(null);
      setComment('');
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const handleReject = async (req: LeaveRow) => {
    setActionBusy(req.id);
    try {
      await rejectLeave(req.uid, req.id, commentFor === req.id ? comment : undefined);
      setCommentFor(null);
      setComment('');
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={s.title}>Leave Requests</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['pending', 'approved', 'rejected', ''].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...s.filterBtn,
                background: filter === f ? '#E8734A' : '#f3f4f6',
                color: filter === f ? '#fff' : '#374151',
              }}
            >
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.muted}>Loading...</div>
      ) : requests.length === 0 ? (
        <div style={s.muted}>No leave requests found.</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>User</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>From</th>
              <th style={s.th}>To</th>
              <th style={s.th}>Reason</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const ss = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              const isBusy = actionBusy === req.id;

              return (
                <tr key={`${req.uid}-${req.id}`}>
                  <td style={s.td}>
                    <div style={{ fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>{req.uid.slice(0, 12)}...</div>
                  </td>
                  <td style={s.td}>{TYPE_LABEL[req.type] || req.type}</td>
                  <td style={s.td}>{req.fromDate}</td>
                  <td style={s.td}>{req.toDate}</td>
                  <td style={{ ...s.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.reason || '—'}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: ss.bg, color: ss.color }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {req.status === 'pending' ? (
                      <div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: commentFor === req.id ? 8 : 0 }}>
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={isBusy}
                            style={{ ...s.actionBtn, color: '#059669' }}
                          >
                            {isBusy ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={isBusy}
                            style={{ ...s.actionBtn, color: '#dc2626' }}
                          >
                            {isBusy ? '...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => setCommentFor(commentFor === req.id ? null : req.id)}
                            style={{ ...s.actionBtn, color: '#6b7280' }}
                          >
                            {commentFor === req.id ? 'Hide' : 'Comment'}
                          </button>
                        </div>
                        {commentFor === req.id && (
                          <input
                            placeholder="Add a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={s.input}
                          />
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {req.reviewComment || '—'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  filterBtn: {
    padding: '6px 14px', border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const,
  },
  table: {
    width: '100%', borderCollapse: 'collapse' as const, background: '#fff',
    borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  th: {
    textAlign: 'left' as const, padding: '12px 14px', fontSize: 12, fontWeight: 600,
    color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 0.5,
    borderBottom: '1px solid #e5e7eb', background: '#f9fafb',
  },
  td: {
    padding: '10px 14px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top' as const,
  },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    textTransform: 'capitalize' as const,
  },
  actionBtn: {
    background: 'transparent', border: 'none',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 16 },
  muted: { color: '#9ca3af', fontSize: 14 },
  input: {
    padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13,
    outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
  },
};
