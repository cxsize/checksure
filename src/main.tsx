import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { validateEnv } from './env.ts';
import { App } from './App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';

validateEnv();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(console.error);
  });
}
