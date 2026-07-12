// Service Worker for Push Notifications

// ─── Cache scope & fetch policy ─────────────────────────────────
// Aura Intercept PWA scope: technician + customer portals only.
// Everything else falls through to network (no caching, no scope claim).
//   - technician endpoints: NetworkFirst with short cache TTL
//   - customer portal: NetworkFirst
//   - supabase/functions/*: never cached (auth + realtime)
//   - default: passthrough
const CACHE_NAME = 'aura-pwa-v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PWA_SCOPE_PATHS = ['/technician', '/customer-portal', '/mobile-app'];
const NEVER_CACHE_HOSTS = ['supabase.co', 'stripe.com', 'signalwire.com'];

function inPwaScope(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    return PWA_SCOPE_PATHS.some((p) => u.pathname.startsWith(p));
  } catch {
    return false;
  }
}

function isNeverCache(url) {
  try {
    const u = new URL(url);
    return NEVER_CACHE_HOSTS.some((h) => u.hostname.endsWith(h));
  } catch {
    return false;
  }
}

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (isNeverCache(req.url)) return; // let network handle
  if (!inPwaScope(req.url)) return;  // out-of-scope → passthrough

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const cloned = fresh.clone();
          const headers = new Headers(cloned.headers);
          headers.set('sw-cached-at', String(Date.now()));
          const body = await cloned.blob();
          cache.put(req, new Response(body, { status: fresh.status, headers }));
        }
        return fresh;
      } catch (err) {
        const cached = await cache.match(req);
        if (cached) {
          const ts = Number(cached.headers.get('sw-cached-at') || 0);
          if (Date.now() - ts < CACHE_TTL_MS) return cached;
          return cached; // stale-if-error
        }
        throw err;
      }
    })()
  );
});

self.addEventListener('push', function(event) {
  console.log('Push message received:', event);

  let data = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'notification',
    data: {}
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // If a window is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/dashboard';
          return clients.openWindow(url);
        }
      })
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});
