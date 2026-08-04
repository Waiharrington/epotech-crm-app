// worker/index.js

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const title = data.title || 'Nuevo Recordatorio';
      const options = {
        body: data.body || 'Tienes una tarea pendiente.',
        icon: data.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        tag: data.tag || 'epotech-reminder',
        data: {
          url: data.url || '/recordatorios'
        },
        requireInteraction: true // Mantiene la notificación hasta que el usuario interactúe
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
      console.error('Error parsing push data:', err);
      // Fallback
      event.waitUntil(
        self.registration.showNotification('Nuevo Recordatorio', {
          body: event.data.text() || 'Tienes una tarea pendiente.',
          icon: '/icon-192x192.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/recordatorios';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Si ya hay una ventana abierta con esa URL, enfocarla
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
