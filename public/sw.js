// Requerido por Chrome para habilitar la instalación como PWA
self.addEventListener('fetch', () => {});

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pizzazi', {
      body:    data.body  || '',
      icon:    data.icon  || '/logo.svg',
      badge:   data.badge || '/logo.svg',
      tag:     data.tag,
      data:    data.data,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const path    = event.notification.data?.url || '/admin/coupons';
  const fullUrl = self.location.origin + path;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async list => {
      // Busca una ventana ya abierta de la app
      for (const c of list) {
        if (c.url.startsWith(self.location.origin)) {
          try {
            const win = await c.focus();
            if (win) {
              // navigate() puede fallar si la URL está fuera de scope; ignorar error
              try { await win.navigate(fullUrl); } catch {}
              return;
            }
          } catch {}
        }
      }
      // App cerrada o focus falló — openWindow abre la PWA instalada
      return clients.openWindow(fullUrl);
    })
  );
});
