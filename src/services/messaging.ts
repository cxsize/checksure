import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Get or create the Firebase app instance (already initialized by firebase.ts)
function getApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  // Fallback — should never happen since firebase.ts initializes first
  return initializeApp({
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

/**
 * Request notification permission and save the FCM token to Firestore.
 * Returns the token string on success, or null if denied/unsupported.
 */
export async function requestNotificationPermission(uid: string): Promise<string | null> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Push notifications not supported in this browser');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  try {
    const messaging = getMessaging(getApp());
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    });

    // Save token to Firestore so Cloud Functions can send to this device
    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
      token,
      createdAt: new Date(),
      userAgent: navigator.userAgent,
    });

    return token;
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    return null;
  }
}

/**
 * Remove an FCM token from Firestore (when user disables notifications).
 */
export async function removeNotificationToken(uid: string, token: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'users', uid, 'fcmTokens', token));
}

/**
 * Listen for foreground messages (when app is open and in focus).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: { title?: string; body?: string }) => void) {
  const messaging = getMessaging(getApp());
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
    });
  });
}
