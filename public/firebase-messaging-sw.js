// Firebase Messaging Service Worker
// Este arquivo DEVE estar na raiz do domínio para o FCM funcionar em background

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAgqunr8bS1LlmRL0QMtqzQzqjPLqjAm5c',
  authDomain: 'gestor-dedividas.firebaseapp.com',
  projectId: 'gestor-dedividas',
  storageBucket: 'gestor-dedividas.firebasestorage.app',
  messagingSenderId: '350301359382',
  appId: '1:350301359382:web:fd5a495500b0e0ddf59437',
});

const messaging = firebase.messaging();

// Receber push com app fechado/background
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Mensagem recebida em background:', payload);

  const title = payload.notification?.title || 'Gestor de Dívidas';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.data?.tag || 'debt-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow('/');
      })
  );
});
