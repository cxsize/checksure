import { describe, it, expect } from 'vitest';
import { evaluateSites } from '../hooks/useGeolocation';
import type { SiteData } from '../tokens';

const makeSite = (id: string, lat: number, lng: number, radiusM: number): SiteData => ({
  id,
  name: { th: id, en: id },
  addr: { th: '', en: '' },
  lat,
  lng,
  radiusM,
  distance: 0,
  inside: false,
});

describe('evaluateSites', () => {
  it('marks site as inside when user is within radius', () => {
    const sites = [makeSite('a', 13.7, 100.5, 500)];
    const result = evaluateSites(13.7, 100.5, sites);
    expect(result[0].inside).toBe(true);
    expect(result[0].distance).toBeLessThan(500);
  });

  it('marks site as outside when user is far away', () => {
    const sites = [makeSite('a', 13.7, 100.5, 200)];
    // ~11km away
    const result = evaluateSites(13.8, 100.5, sites);
    expect(result[0].inside).toBe(false);
    expect(result[0].distance).toBeGreaterThan(200);
  });

  it('handles multiple sites and sorts correctly', () => {
    const sites = [
      makeSite('far', 14.0, 101.0, 200),
      makeSite('near', 13.700, 100.500, 500),
    ];
    const result = evaluateSites(13.7001, 100.5001, sites);
    const near = result.find((s) => s.id === 'near')!;
    const far = result.find((s) => s.id === 'far')!;
    expect(near.inside).toBe(true);
    expect(far.inside).toBe(false);
    expect(near.distance).toBeLessThan(far.distance);
  });

  it('returns distance of 0 when user is exactly on site', () => {
    const sites = [makeSite('a', 13.7, 100.5, 100)];
    const result = evaluateSites(13.7, 100.5, sites);
    expect(result[0].distance).toBe(0);
    expect(result[0].inside).toBe(true);
  });

  it('handles edge case at exact radius boundary', () => {
    const sites = [makeSite('a', 0, 0, 1000)];
    // ~900m north of equator/prime meridian
    const result = evaluateSites(0.008, 0, sites);
    expect(result[0].distance).toBeGreaterThan(800);
    expect(result[0].distance).toBeLessThan(1000);
    expect(result[0].inside).toBe(true);
  });
});
