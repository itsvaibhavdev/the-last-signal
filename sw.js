// THE LAST SIGNAL service worker: caches the single-file game so it starts instantly and works offline after the first visit.
// build.mjs swaps the version placeholder below for a hash of index.html, so every new build gets a fresh cache and old ones are deleted.
const VERSION = '__VERSION__';
const CACHE = 'tls-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('tls-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  // cache-first (the cache name is versioned by the build); ?q=low style query strings still hit the cached page
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => hit || fetch(r).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
    return res;
  }).catch(() => (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
