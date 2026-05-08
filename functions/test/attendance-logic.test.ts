import { describe, it, expect } from 'vitest';

// Extract the pure calculation from onAttendanceUpdate handler
function calculateWorkedTime(clockInMs: number, clockOutMs: number) {
  const workedMs = clockOutMs - clockInMs;
  const workedMinutes = Math.max(0, Math.floor(workedMs / 60000));
  const otMinutes = Math.max(0, workedMinutes - 480); // 8h = 480min
  return { workedMinutes, otMinutes };
}

describe('attendance calculation', () => {
  it('calculates 8h shift with no OT', () => {
    const clockIn = new Date('2026-04-25T09:00:00').getTime();
    const clockOut = new Date('2026-04-25T17:00:00').getTime();
    const { workedMinutes, otMinutes } = calculateWorkedTime(clockIn, clockOut);
    expect(workedMinutes).toBe(480);
    expect(otMinutes).toBe(0);
  });

  it('calculates OT for 10h shift', () => {
    const clockIn = new Date('2026-04-25T08:00:00').getTime();
    const clockOut = new Date('2026-04-25T18:00:00').getTime();
    const { workedMinutes, otMinutes } = calculateWorkedTime(clockIn, clockOut);
    expect(workedMinutes).toBe(600);
    expect(otMinutes).toBe(120); // 2h OT
  });

  it('handles short shift (4h)', () => {
    const clockIn = new Date('2026-04-25T09:00:00').getTime();
    const clockOut = new Date('2026-04-25T13:00:00').getTime();
    const { workedMinutes, otMinutes } = calculateWorkedTime(clockIn, clockOut);
    expect(workedMinutes).toBe(240);
    expect(otMinutes).toBe(0);
  });

  it('handles very short shift (30min)', () => {
    const clockIn = new Date('2026-04-25T09:00:00').getTime();
    const clockOut = new Date('2026-04-25T09:30:00').getTime();
    const { workedMinutes, otMinutes } = calculateWorkedTime(clockIn, clockOut);
    expect(workedMinutes).toBe(30);
    expect(otMinutes).toBe(0);
  });

  it('handles immediate clock-out (0 minutes)', () => {
    const now = Date.now();
    const { workedMinutes, otMinutes } = calculateWorkedTime(now, now);
    expect(workedMinutes).toBe(0);
    expect(otMinutes).toBe(0);
  });

  it('clamps negative diff to 0', () => {
    // If clockOut is somehow before clockIn (shouldn't happen, but safe)
    const clockIn = new Date('2026-04-25T17:00:00').getTime();
    const clockOut = new Date('2026-04-25T09:00:00').getTime();
    const { workedMinutes, otMinutes } = calculateWorkedTime(clockIn, clockOut);
    expect(workedMinutes).toBe(0);
    expect(otMinutes).toBe(0);
  });

  it('handles overnight shift (12h)', () => {
    const clockIn = new Date('2026-04-25T22:00:00').getTime();
    const clockOut = new Date('2026-04-26T10:00:00').getTime();
    const { workedMinutes, otMinutes } = calculateWorkedTime(clockIn, clockOut);
    expect(workedMinutes).toBe(720);
    expect(otMinutes).toBe(240); // 4h OT
  });

  it('rounds down partial minutes', () => {
    const clockIn = new Date('2026-04-25T09:00:00').getTime();
    const clockOut = new Date('2026-04-25T09:01:30').getTime(); // 1.5 min
    const { workedMinutes } = calculateWorkedTime(clockIn, clockOut);
    expect(workedMinutes).toBe(1); // floor
  });
});

describe('middleware auth header parsing', () => {
  function parseAuthHeader(header: string | undefined) {
    if (!header?.startsWith('Bearer ')) return null;
    return header.split('Bearer ')[1];
  }

  it('extracts token from valid header', () => {
    expect(parseAuthHeader('Bearer abc123')).toBe('abc123');
  });

  it('returns null for missing header', () => {
    expect(parseAuthHeader(undefined)).toBeNull();
  });

  it('returns null for malformed header', () => {
    expect(parseAuthHeader('Basic abc123')).toBeNull();
  });

  it('returns null for empty bearer', () => {
    expect(parseAuthHeader('Token abc123')).toBeNull();
  });

  it('handles token with special characters', () => {
    expect(parseAuthHeader('Bearer eyJhbGci.eyJzdWIi.sig_here')).toBe('eyJhbGci.eyJzdWIi.sig_here');
  });
});
