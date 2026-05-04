/* global workbox */

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const VERSION = 'v2';
const PAGE_CACHE = `resqnet-pages-${VERSION}`;
const ASSET_CACHE = `resqnet-assets-${VERSION}`;
const FIRST_AID_CACHE = `resqnet-first-aid-${VERSION}`;
const IMAGE_CACHE = `resqnet-images-${VERSION}`;

if (workbox) {
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  workbox.precaching.precacheAndRoute([
    { url: '/', revision: null },
    { url: '/report', revision: null },
    { url: '/first-aid', revision: null },
    { url: '/manifest.json', revision: null },
  ]);

  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: PAGE_CACHE,
      networkTimeoutSeconds: 3,
    }),
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: ASSET_CACHE,
    }),
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: IMAGE_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    }),
  );

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/first-aid'),
    new workbox.strategies.NetworkFirst({
      cacheName: FIRST_AID_CACHE,
      networkTimeoutSeconds: 3,
    }),
  );

  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      const cachedFirstAid = await caches.match('/first-aid');
      if (cachedFirstAid) {
        return cachedFirstAid;
      }

      const cachedHome = await caches.match('/');
      if (cachedHome) {
        return cachedHome;
      }
    }

    return new Response('Offline - Page not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  });
} else {
  console.log('Workbox failed to load.');
}

// Background sync for offline reports
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-incidents' || event.tag === 'sync-reports') {
    event.waitUntil(syncOfflineReports());
  }
});

async function syncOfflineReports() {
  // This will be triggered when connection is restored
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_INCIDENTS',
    });
  });
}
