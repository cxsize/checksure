/**
 * Offline queue for clock-in/out requests.
 * When offline, requests are stored in IndexedDB.
 * When connectivity resumes, they are replayed in order.
 */

const DB_NAME = 'checksure-offline';
const STORE_NAME = 'pendingActions';
const DB_VERSION = 1;

export interface PendingAction {
  id?: number; // auto-incremented key
  type: 'clockIn' | 'clockOut';
  uid: string;
  siteId?: string;
  timestamp: number; // Date.now() when user tapped the button
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Enqueue a clock action for later sync */
export async function enqueue(action: Omit<PendingAction, 'id'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all pending actions in insertion order */
export async function getAll(): Promise<PendingAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Remove a successfully synced action */
export async function remove(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Check if there are any pending actions */
export async function hasPending(): Promise<boolean> {
  const items = await getAll();
  return items.length > 0;
}
