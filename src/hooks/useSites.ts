import { useState, useEffect } from 'react';
import { getSites } from '../services/firebase';
import type { SiteData } from '../tokens';
import { MOCK_SITES } from '../tokens';

/**
 * Fetches sites from Firestore `sites` collection.
 * If assignedSiteIds is provided and non-empty, filters to only those sites.
 * Falls back to MOCK_SITES in development when Firestore has no data.
 */
export function useSites(assignedSiteIds?: string[]) {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getSites()
      .then((records) => {
        if (cancelled) return;
        if (records.length === 0 && import.meta.env.DEV) {
          setSites(MOCK_SITES);
        } else {
          let filtered = records.filter((r) => r.active);
          if (assignedSiteIds && assignedSiteIds.length > 0) {
            filtered = filtered.filter((r) => assignedSiteIds.includes(r.id));
          }
          setSites(
            filtered.map(
              (r): SiteData => ({
                id: r.id,
                name: r.name,
                addr: r.addr,
                lat: r.lat,
                lng: r.lng,
                radiusM: r.radiusM,
                distance: 0,
                inside: false,
              }),
            ),
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch sites:', err);
        if (import.meta.env.DEV) setSites(MOCK_SITES);
        setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedSiteIds?.join(',')]);

  return { sites, loading };
}
