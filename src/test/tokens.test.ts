import { describe, it, expect } from 'vitest';
import { fmtTime, fmtDateTh, fmtMonth } from '../tokens';

describe('fmtTime', () => {
  it('formats time with leading zeros', () => {
    const d = new Date(2026, 3, 25, 9, 5);
    expect(fmtTime(d)).toBe('09:05');
  });

  it('formats afternoon time', () => {
    const d = new Date(2026, 3, 25, 17, 30);
    expect(fmtTime(d)).toBe('17:30');
  });

  it('formats midnight', () => {
    const d = new Date(2026, 3, 25, 0, 0);
    expect(fmtTime(d)).toBe('00:00');
  });
});

describe('fmtDateTh', () => {
  it('formats date in Thai', () => {
    const d = new Date(2026, 3, 25); // April 25, 2026
    const result = fmtDateTh(d, 'th');
    expect(result).toContain('2569'); // BE year
    expect(result).toContain('25');
    expect(result).toContain('เม.ย.');
  });

  it('formats date in English', () => {
    const d = new Date(2026, 3, 25);
    const result = fmtDateTh(d, 'en');
    expect(result).toContain('2026');
    expect(result).toContain('25');
    expect(result).toContain('Apr');
  });
});

describe('fmtMonth', () => {
  it('formats month in Thai with BE year', () => {
    const d = new Date(2026, 3, 1);
    expect(fmtMonth(d, 'th')).toBe('เม.ย. 2569');
  });

  it('formats month in English', () => {
    const d = new Date(2026, 3, 1);
    expect(fmtMonth(d, 'en')).toBe('Apr 2026');
  });

  it('handles January', () => {
    const d = new Date(2026, 0, 1);
    expect(fmtMonth(d, 'en')).toBe('Jan 2026');
    expect(fmtMonth(d, 'th')).toBe('ม.ค. 2569');
  });

  it('handles December', () => {
    const d = new Date(2026, 11, 1);
    expect(fmtMonth(d, 'en')).toBe('Dec 2026');
  });
});
