import { describe, it, expect } from 'vitest';

// Mirror the datesOverlap function from LeaveScreen
function datesOverlap(fromA: string, toA: string, fromB: string, toB: string): boolean {
  return fromA <= toB && fromB <= toA;
}

describe('datesOverlap', () => {
  it('detects exact same dates', () => {
    expect(datesOverlap('2026-04-25', '2026-04-27', '2026-04-25', '2026-04-27')).toBe(true);
  });

  it('detects partial overlap (start)', () => {
    expect(datesOverlap('2026-04-25', '2026-04-28', '2026-04-27', '2026-04-30')).toBe(true);
  });

  it('detects partial overlap (end)', () => {
    expect(datesOverlap('2026-04-27', '2026-04-30', '2026-04-25', '2026-04-28')).toBe(true);
  });

  it('detects one range containing the other', () => {
    expect(datesOverlap('2026-04-20', '2026-04-30', '2026-04-25', '2026-04-26')).toBe(true);
  });

  it('returns false for non-overlapping ranges', () => {
    expect(datesOverlap('2026-04-25', '2026-04-27', '2026-04-28', '2026-04-30')).toBe(false);
  });

  it('returns false for adjacent dates (no overlap)', () => {
    expect(datesOverlap('2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28')).toBe(false);
  });

  it('returns true for single-day ranges on same day', () => {
    expect(datesOverlap('2026-04-25', '2026-04-25', '2026-04-25', '2026-04-25')).toBe(true);
  });

  it('returns true when ranges share only one boundary day', () => {
    expect(datesOverlap('2026-04-25', '2026-04-27', '2026-04-27', '2026-04-29')).toBe(true);
  });
});

describe('leave request conflict rules', () => {
  type MockRequest = { id: string; status: 'pending' | 'approved' | 'rejected'; fromDate: string; toDate: string };

  function findConflicts(fromDate: string, toDate: string, requests: MockRequest[]) {
    const overlapping = requests.filter(r => datesOverlap(fromDate, toDate, r.fromDate, r.toDate));
    const approvedConflict = overlapping.find(r => r.status === 'approved');
    const pendingConflicts = overlapping.filter(r => r.status === 'pending');
    const rejectedConflicts = overlapping.filter(r => r.status === 'rejected');
    return { approvedConflict, pendingConflicts, rejectedConflicts };
  }

  it('blocks submission when approved leave overlaps', () => {
    const requests: MockRequest[] = [
      { id: '1', status: 'approved', fromDate: '2026-04-25', toDate: '2026-04-27' },
    ];
    const { approvedConflict } = findConflicts('2026-04-26', '2026-04-28', requests);
    expect(approvedConflict).toBeDefined();
  });

  it('identifies pending conflicts for replacement', () => {
    const requests: MockRequest[] = [
      { id: '1', status: 'pending', fromDate: '2026-04-25', toDate: '2026-04-27' },
      { id: '2', status: 'pending', fromDate: '2026-05-01', toDate: '2026-05-02' },
    ];
    const { pendingConflicts } = findConflicts('2026-04-26', '2026-04-28', requests);
    expect(pendingConflicts).toHaveLength(1);
    expect(pendingConflicts[0].id).toBe('1');
  });

  it('allows submission over rejected requests', () => {
    const requests: MockRequest[] = [
      { id: '1', status: 'rejected', fromDate: '2026-04-25', toDate: '2026-04-27' },
    ];
    const { approvedConflict, pendingConflicts } = findConflicts('2026-04-25', '2026-04-27', requests);
    expect(approvedConflict).toBeUndefined();
    expect(pendingConflicts).toHaveLength(0);
  });

  it('handles mixed statuses correctly', () => {
    const requests: MockRequest[] = [
      { id: '1', status: 'approved', fromDate: '2026-04-20', toDate: '2026-04-22' },
      { id: '2', status: 'pending', fromDate: '2026-04-25', toDate: '2026-04-27' },
      { id: '3', status: 'rejected', fromDate: '2026-04-25', toDate: '2026-04-27' },
    ];
    const { approvedConflict, pendingConflicts, rejectedConflicts } = findConflicts('2026-04-25', '2026-04-28', requests);
    expect(approvedConflict).toBeUndefined(); // approved is on different dates
    expect(pendingConflicts).toHaveLength(1);
    expect(rejectedConflicts).toHaveLength(1);
  });

  it('returns no conflicts for non-overlapping dates', () => {
    const requests: MockRequest[] = [
      { id: '1', status: 'approved', fromDate: '2026-04-20', toDate: '2026-04-22' },
    ];
    const { approvedConflict, pendingConflicts } = findConflicts('2026-04-25', '2026-04-28', requests);
    expect(approvedConflict).toBeUndefined();
    expect(pendingConflicts).toHaveLength(0);
  });
});
