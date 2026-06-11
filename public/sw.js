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
      // Si la app ya está abierta: navega y enfoca esa ventana
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          const win = await c.focus();
          if (win.navigate) win.navigate(fullUrl);
          return;
        }
      }
      // Si no está abierta: abre una ventana nueva con la URL completa
      return clients.openWindow(fullUrl);
    })
  );
});
