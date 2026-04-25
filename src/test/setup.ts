import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock import.meta.env
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123');
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123:web:abc');
// @ts-expect-error DEV is boolean at runtime but stubEnv types expect string
vi.stubEnv('DEV', true);
