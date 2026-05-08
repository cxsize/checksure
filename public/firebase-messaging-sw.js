/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker
// This file MUST live at the root of the domain (served from /public by Vite)

importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'demo-key',
  projectId:         'demo-ezpeople',
  messagingSenderId: '000000000000',
  appId:             '1:000000000000:web:demo',
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'CheckSure', {
    body: body || '',
    icon: icon || '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data,
  });
});
