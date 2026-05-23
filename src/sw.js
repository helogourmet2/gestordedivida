import { precacheAndRoute } from 'workbox-precaching';

// Precache todos os assets gerados pelo Vite
precacheAndRoute(self.__WB_MANIFEST);

// ─── Push Notifications (app fechado) ───────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Gestor de Dívidas', body: event.data.text() };
  }

  const title = payload.notification?.title || payload.title || 'Gestor de Dívidas';
  const options = {
    body: payload.notification?.body || payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag || 'debt-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Ver dívidas' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Clique na notificação ───────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma aba aberta, foca nela
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        // Senão abre uma nova
        return clients.openWindow('/');
      })
  );
});

// ─── Background Sync (fallback offline) ─────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-debts') {
    event.waitUntil(syncDebts());
  }
});

async function syncDebts() {
  // Placeholder para sincronização futura com Supabase
  console.log('[SW] Background sync triggered');
}
