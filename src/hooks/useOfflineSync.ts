import { useEffect, useRef } from 'react';
import { clockIn, clockOut } from '../services/firebase';
import * as offlineQueue from '../services/offlineQueue';

/**
 * Monitors network connectivity and replays any queued offline clock actions
 * when the device comes back online.
 */
export function useOfflineSync(uid: string | undefined) {
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!uid) return;

    async function syncQueue() {
      if (syncingRef.current) return;
      syncingRef.current = true;

      try {
        const pending = await offlineQueue.getAll();
        for (const action of pending) {
          try {
            if (action.type === 'clockIn' && action.siteId) {
              await clockIn(uid!, action.siteId);
            } else if (action.type === 'clockOut') {
              await clockOut(uid!);
            }
            if (action.id !== undefined) {
              await offlineQueue.remove(action.id);
            }
          } catch (err) {
            console.error('Failed to sync offline action:', action, err);
            break; // Stop on first failure — retry next time
          }
        }
      } finally {
        syncingRef.current = false;
      }
    }

    // Sync immediately on mount (in case we came online before this hook ran)
    syncQueue();

    // Sync whenever we come back online
    window.addEventListener('online', syncQueue);
    return () => window.removeEventListener('online', syncQueue);
  }, [uid]);
}
