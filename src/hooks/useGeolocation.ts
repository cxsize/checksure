import { useState, useCallback } from 'react';
import type { SiteData } from '../tokens';

export interface GeolocationState {
  loading: boolean;
  error: string | null;
  lat: number | null;
  lng: number | null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function evaluateSites(lat: number, lng: number, sites: SiteData[]): SiteData[] {
  return sites.map((s) => {
    const distance = Math.round(haversineDistance(lat, lng, s.lat, s.lng));
    return { ...s, distance, inside: distance <= s.radiusM };
  });
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ loading: false, error: null, lat: null, lng: null });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: 'no_support', lat: null, lng: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ loading: false, error: null, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setState({ loading: false, error: err.code === 1 ? 'permission_denied' : 'unavailable', lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { ...state, locate };
}
