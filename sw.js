/* OFIZ Tasks — Service Worker (enables PWA install) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
/* No caching — app requires live Google Sheets connection */
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
