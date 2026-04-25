import { useState, useEffect, useCallback, useRef } from 'react';
import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH, MONTH_TH, MONTH_EN, DOW_TH, DOW_EN } from '../tokens';
import { useApp } from '../contexts/AppContext';
import { submitLeave, getRecentLeaveRequests, cancelLeaveRequest } from '../services/firebase';
import type { LeaveRequest } from '../services/firebase';
import { BigButton } from '../components/ui/BigButton';
import type { TabKey } from '../components/ui/TabBar';
import { TabBar } from '../components/ui/TabBar';
import { Icons } from '../components/ui/Icons';

interface LeaveScreenProps {
  theme: Theme;
  lang: Lang;
  tab: TabKey;
  onTab: (t: TabKey) => void;
}

type LeaveType = 'sick' | 'personal' | 'vacation';

const LEAVE_TYPES: { id: LeaveType; key: 'leaveSick' | 'leavePersonal' | 'leaveVacation'; Icon: keyof typeof Icons }[] = [
  { id: 'sick',     key: 'leaveSick',     Icon: 'Leave' },
  { id: 'personal', key: 'leavePersonal', Icon: 'Person' },
  { id: 'vacation', key: 'leaveVacation', Icon: 'Coffee' },
];

const TYPE_LABEL_KEY: Record<string, 'leaveSick' | 'leavePersonal' | 'leaveVacation'> = {
  sick: 'leaveSick',
  personal: 'leavePersonal',
  vacation: 'leaveVacation',
};


function fmtDisplayDate(iso: string, lang: Lang): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  const dw = d.getDay();
  return lang === 'en'
    ? `${DOW_EN[dw]}, ${day} ${MONTH_EN[m]} ${y}`
    : `${DOW_TH[dw]} ${day} ${MONTH_TH[m]} ${y + 543}`;
}

function daysBetween(from: string, to: string): number {
  const d1 = new Date(from + 'T12:00:00');
  const d2 = new Date(to + 'T12:00:00');
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Two date ranges overlap when fromA <= toB AND fromB <= toA */
function datesOverlap(fromA: string, toA: string, fromB: string, toB: string): boolean {
  return fromA <= toB && fromB <= toA;
}

export function LeaveScreen({ theme, lang, tab, onTab }: LeaveScreenProps) {
  const { user } = useApp();
  const [type, setType] = useState<LeaveType>('sick');
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingRequests(true);
    try {
      const requests = await getRecentLeaveRequests(user.uid);
      setRecentRequests(requests);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [user?.uid]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState<LeaveRequest[] | null>(null);

  const handleCancel = async (requestId: string) => {
    if (!user?.uid || cancellingId) return;
    setConfirmCancelId(null);
    setCancellingId(requestId);
    try {
      await cancelLeaveRequest(user.uid, requestId);
      fetchRequests();
    } catch (err) {
      console.error('Cancel leave failed:', err);
      setError(lang === 'en' ? 'Failed to cancel. Please try again.' : 'ยกเลิกไม่สำเร็จ กรุณาลองใหม่');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCancellingId(null);
    }
  };

  const handleToDate = (v: string) => {
    setToDate(v < fromDate ? fromDate : v);
  };

  const handleFromDate = (v: string) => {
    setFromDate(v);
    if (toDate < v) setToDate(v);
  };

  const handleSubmit = async () => {
    if (sending || sent || !user?.uid) return;
    setError('');

    // Check for date conflicts with existing requests
    const overlapping = recentRequests.filter(
      (r) => datesOverlap(fromDate, toDate, r.fromDate, r.toDate),
    );
    const approvedConflict = overlapping.find((r) => r.status === 'approved');
    if (approvedConflict) {
      setError(
        lang === 'en'
          ? 'You already have an approved leave for these dates. Cannot submit a new request.'
          : 'คุณมีวันลาที่ได้รับอนุมัติแล้วในช่วงวันที่นี้ ไม่สามารถส่งคำขอใหม่ได้',
      );
      setTimeout(() => setError(''), 5000);
      return;
    }

    // If there are overlapping pending requests, show confirmation first
    const pendingConflicts = overlapping.filter((r) => r.status === 'pending' && r.id);
    if (pendingConflicts.length > 0) {
      setConfirmReplace(pendingConflicts);
      return;
    }

    await doSubmit();
  };

  const doSubmit = async () => {
    if (sending || !user?.uid) return;
    setConfirmReplace(null);
    setSending(true);
    try {
      // Cancel overlapping pending requests (replace them)
      const overlapping = recentRequests.filter(
        (r) => r.status === 'pending' && r.id && datesOverlap(fromDate, toDate, r.fromDate, r.toDate),
      );
      for (const req of overlapping) {
        await cancelLeaveRequest(user.uid, req.id!);
      }

      await submitLeave(user.uid, { type, fromDate, toDate, reason });
      setSent(true);
      setType('sick');
      setFromDate(todayIso());
      setToDate(todayIso());
      setReason('');
      fetchRequests();
      setTimeout(() => setSent(false), 2500);
    } catch (e) {
      console.error('submitLeave failed:', e);
      setError(lang === 'en' ? 'Failed to submit. Please try again.' : 'ส่งไม่สำเร็จ กรุณาลองใหม่');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSending(false);
    }
  };

  const days = daysBetween(fromDate, toDate);
  const toLabel = lang === 'en'
    ? `${fmtDisplayDate(toDate, lang)} (${days} day${days !== 1 ? 's' : ''})`
    : `${fmtDisplayDate(toDate, lang)} (${days} วัน)`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '22px 24px 12px' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 28, fontWeight: 800, color: theme.ink, letterSpacing: -0.3 }}>
            {COPY.requestLeave[lang]}
          </div>
        </div>

        {/* Leave type picker */}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: theme.inkSoft, marginBottom: 10, paddingLeft: 4 }}>
            {COPY.leaveType[lang]}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {LEAVE_TYPES.map(({ id, key, Icon }) => {
              const active = type === id;
              const I = Icons[Icon] as React.FC<{ size: number; c: string; sw: number }>;
              return (
                <button key={id} onClick={() => setType(id)} style={{
                  border: `2px solid ${active ? theme.primary : theme.line}`,
                  background: active ? theme.primarySoft : theme.card,
                  borderRadius: 18, padding: '16px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                }}>
                  <I size={26} c={active ? theme.primary : theme.ink} sw={2} />
                  <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: active ? theme.primary : theme.ink }}>
                    {COPY[key][lang]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date fields */}
        <div style={{ padding: '18px 20px 0' }}>
          <DateField theme={theme}
            label={COPY.leaveDate[lang]} value={fromDate} onChange={handleFromDate}
          />
          <DateField theme={theme}
            label={lang === 'en' ? 'To' : 'ถึง'} value={toDate} onChange={handleToDate}
            displayOverride={toLabel}
          />

          {/* Reason textarea */}
          <div style={{ background: theme.card, border: `1px solid ${theme.line}`, borderRadius: 16, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Icons.Leave size={18} c={theme.ink} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, marginBottom: 6 }}>
                  {COPY.leaveReason[lang]}
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={lang === 'en' ? 'Add a short note…' : 'เขียนเหตุผลสั้น ๆ...'}
                  rows={3}
                  style={{
                    width: '100%', border: 'none', outline: 'none', resize: 'none',
                    background: 'transparent', fontFamily: FONT_TH, fontSize: 15,
                    color: theme.ink, lineHeight: 1.5, display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: '0 20px 8px' }}>
            <div style={{ background: theme.warnSoft, color: theme.warn, borderRadius: 14, padding: '10px 14px', fontFamily: FONT_TH, fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          </div>
        )}

        {/* Past requests */}
        <div style={{ padding: '4px 20px 24px' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 700, color: theme.inkSoft, marginBottom: 10, paddingLeft: 4 }}>
            {lang === 'en' ? 'Recent requests' : 'คำขอที่ผ่านมา'}
          </div>
          {loadingRequests ? (
            <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkMute, paddingLeft: 4 }}>
              {lang === 'en' ? 'Loading...' : 'กำลังโหลด...'}
            </div>
          ) : recentRequests.length === 0 ? (
            <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkMute, paddingLeft: 4 }}>
              {lang === 'en' ? 'No leave requests yet' : 'ยังไม่มีคำขอลา'}
            </div>
          ) : (() => {
            // Hide rejected requests that have a newer pending/approved request with overlapping dates
            const visibleRequests = recentRequests.filter((req) => {
              if (req.status !== 'rejected') return true;
              return !recentRequests.some(
                (other) =>
                  other.id !== req.id &&
                  (other.status === 'pending' || other.status === 'approved') &&
                  datesOverlap(req.fromDate, req.toDate, other.fromDate, other.toDate),
              );
            });
            if (visibleRequests.length === 0) return (
              <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkMute, paddingLeft: 4 }}>
                {lang === 'en' ? 'No leave requests yet' : 'ยังไม่มีคำขอลา'}
              </div>
            );
            return (
            <div style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.line}`, overflow: 'hidden' }}>
              {visibleRequests.map((req, i) => {
                const labelKey = TYPE_LABEL_KEY[req.type] || 'leaveSick';
                const statusColor = req.status === 'approved' ? theme.accent
                  : req.status === 'rejected' ? theme.warn
                  : theme.primary;
                const statusBg = req.status === 'approved' ? theme.accentSoft
                  : req.status === 'rejected' ? theme.warnSoft
                  : theme.primarySoft;
                const statusLabel = req.status === 'approved'
                  ? (lang === 'en' ? 'Approved' : 'อนุมัติ')
                  : req.status === 'rejected'
                  ? (lang === 'en' ? 'Rejected' : 'ไม่อนุมัติ')
                  : (lang === 'en' ? 'Pending' : 'รออนุมัติ');

                return (
                  <div key={req.id || i} style={{ padding: '12px 14px', borderBottom: i === visibleRequests.length - 1 ? 'none' : `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT_TH, fontSize: 14, fontWeight: 600, color: theme.ink }}>{COPY[labelKey][lang]}</div>
                      <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.inkSoft, marginTop: 2 }}>
                        {fmtDisplayDate(req.fromDate, lang)}
                        {req.fromDate !== req.toDate && ` — ${fmtDisplayDate(req.toDate, lang)}`}
                      </div>
                      {req.reason && (
                        <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkMute, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.reason}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {req.status === 'pending' && req.id && (
                        <button
                          onClick={() => setConfirmCancelId(req.id!)}
                          disabled={cancellingId === req.id}
                          style={{
                            fontFamily: FONT_TH, fontSize: 11, fontWeight: 700,
                            background: theme.warnSoft, color: theme.warn,
                            padding: '5px 10px', borderRadius: 999,
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          {cancellingId === req.id
                            ? '...'
                            : (lang === 'en' ? 'Cancel' : 'ยกเลิก')}
                        </button>
                      )}
                      <div style={{
                        fontFamily: FONT_TH, fontSize: 11, fontWeight: 700,
                        background: statusBg, color: statusColor,
                        padding: '5px 10px', borderRadius: 999,
                      }}>
                        {statusLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
      </div>

      <div style={{ padding: '12px 20px 12px', background: theme.bg, borderTop: `1px solid ${theme.line}` }}>
        <BigButton
          theme={theme}
          label={sent ? COPY.success[lang] : sending ? (lang === 'en' ? 'Submitting…' : 'กำลังส่ง...') : COPY.submit[lang]}
          onClick={handleSubmit}
          color={sent ? theme.accent : theme.primary}
          inkColor="#fff"
          icon={
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sent ? <Icons.Check size={20} c="#fff" sw={3} /> : <Icons.Arrow size={20} c="#fff" />}
            </div>
          }
        />
      </div>
      <TabBar tab={tab} onTab={onTab} theme={theme} lang={lang} />

      {/* Replace confirmation popup */}
      {confirmReplace && (
        <div
          onClick={() => setConfirmReplace(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.card, borderRadius: 20, padding: '20px 18px 16px',
              width: '100%', maxWidth: 300, textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
              animation: 'pop 0.2s ease-out',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: theme.primarySoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Icons.Calendar size={20} c={theme.primary} />
            </div>
            <div style={{ fontFamily: FONT_TH, fontSize: 15, fontWeight: 700, color: theme.ink, marginBottom: 6 }}>
              {lang === 'en' ? 'Replace existing request?' : 'แทนที่คำขอที่มีอยู่?'}
            </div>
            <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
              {lang === 'en'
                ? 'The overlapping pending request will be cancelled and replaced.'
                : 'คำขอลาที่ซ้อนทับจะถูกยกเลิกและแทนที่ด้วยคำขอใหม่'}
            </div>
            <div style={{
              background: theme.surface, borderRadius: 10, padding: '8px 12px',
              marginBottom: 14, textAlign: 'left',
            }}>
              {confirmReplace.map((req) => {
                const labelKey = TYPE_LABEL_KEY[req.type] || 'leaveSick';
                return (
                  <div key={req.id} style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600, color: theme.ink }}>{COPY[labelKey][lang]}</span>
                    {' — '}
                    {fmtDisplayDate(req.fromDate, lang)}
                    {req.fromDate !== req.toDate && ` — ${fmtDisplayDate(req.toDate, lang)}`}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmReplace(null)}
                style={{
                  flex: 1, fontFamily: FONT_TH, fontSize: 13, fontWeight: 700,
                  background: theme.surface, color: theme.ink, border: 'none',
                  borderRadius: 12, padding: '10px 0', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? 'Go back' : 'กลับ'}
              </button>
              <button
                onClick={() => doSubmit()}
                style={{
                  flex: 1, fontFamily: FONT_TH, fontSize: 13, fontWeight: 700,
                  background: theme.primary, color: '#fff', border: 'none',
                  borderRadius: 12, padding: '10px 0', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? 'Replace' : 'แทนที่'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation popup */}
      {confirmCancelId && (
        <div
          onClick={() => setConfirmCancelId(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.card, borderRadius: 20, padding: '20px 18px 16px',
              width: '100%', maxWidth: 300, textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
              animation: 'pop 0.2s ease-out',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: theme.warnSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Icons.Leave size={20} c={theme.warn} />
            </div>
            <div style={{ fontFamily: FONT_TH, fontSize: 15, fontWeight: 700, color: theme.ink, marginBottom: 6 }}>
              {lang === 'en' ? 'Cancel leave request?' : 'ยกเลิกคำขอลา?'}
            </div>
            <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.inkSoft, marginBottom: 16, lineHeight: 1.5 }}>
              {lang === 'en'
                ? 'This cannot be undone. Are you sure?'
                : 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิก?'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmCancelId(null)}
                style={{
                  flex: 1, fontFamily: FONT_TH, fontSize: 13, fontWeight: 700,
                  background: theme.surface, color: theme.ink, border: 'none',
                  borderRadius: 12, padding: '10px 0', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? 'Go back' : 'กลับ'}
              </button>
              <button
                onClick={() => handleCancel(confirmCancelId)}
                style={{
                  flex: 1, fontFamily: FONT_TH, fontSize: 13, fontWeight: 700,
                  background: theme.warn, color: '#fff', border: 'none',
                  borderRadius: 12, padding: '10px 0', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? 'Yes, cancel' : 'ยืนยันยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DateFieldProps {
  theme: Theme;
  label: string;
  value: string;
  onChange: (v: string) => void;
  displayOverride?: string;
}

function DateField({ theme, label, value, onChange, displayOverride }: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    try { inputRef.current?.showPicker(); } catch { inputRef.current?.focus(); }
  };

  return (
    <div
      onClick={handleClick}
      style={{ background: theme.card, border: `1px solid ${theme.line}`, borderRadius: 16, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icons.Calendar size={18} c={theme.ink} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_TH, fontSize: 11, color: theme.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
        {displayOverride && (
          <div style={{ fontFamily: FONT_TH, fontSize: 13, fontWeight: 600, color: theme.inkSoft, marginTop: 2 }}>
            {displayOverride}
          </div>
        )}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            fontFamily: FONT_TH, fontSize: 15, fontWeight: 600, color: theme.ink,
            marginTop: 2, border: 'none', outline: 'none', background: 'transparent',
            width: '100%', padding: 0, cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}
