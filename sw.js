/* PMP Prep — Service Worker
 *
 * - App shell (page, styles, chapter index, icons) is pre-cached on install.
 * - Content is published only encrypted (*.enc, see vault.json); the page
 *   decrypts it with the user's password. Encrypted chapter texts, quizzes and
 *   images are cached the first time you open them (stale-while-revalidate).
 * - Audio files are left to the browser's HTTP cache.
 * - Bump CACHE_VERSION on every deploy to drop old caches.
 */
const CACHE_VERSION = 'v2026.10.18.19';
const APP_CACHE = `pmp-app-${CACHE_VERSION}`;
const CONTENT_CACHE = `pmp-content-${CACHE_VERSION}`;
const CDN_CACHE = `pmp-cdn-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './guide.css',
  './study.js',
  './labs.js',
  './tutor.js',
  './sync.js',
  './session.js',
  './vault.json',
  './chapters/index.json.enc',
  './manifest.webmanifest',
  './icon.svg',
  './icon-32.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './pmp.ico',
];
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => Promise.all(APP_SHELL.map(async (path) => {
      try {
        const res = await fetch(path, { cache: 'reload' });
        if (res && res.ok) await cache.put(path, res);
      } catch (_) { /* offline install — best effort */ }
    }))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = [APP_CACHE, CONTENT_CACHE, CDN_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/audio/') || req.headers.has('range')) return;   // stream natively
    const isHTML = req.mode === 'navigate';
    if (isHTML || url.pathname.endsWith('/chapters/index.json.enc') || url.pathname.endsWith('/vault.json')) {
      event.respondWith(networkFirst(req, APP_CACHE));
    } else if (/\/(chapters|quiz|img|docs)\//.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(req, CONTENT_CACHE));
    } else {
      event.respondWith(staleWhileRevalidate(req, APP_CACHE));
    }
    return;
  }
  if (FONT_ORIGINS.some((o) => req.url.startsWith(o))) {
    event.respondWith(staleWhileRevalidate(req, CDN_CACHE));
  }
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const fallback = req.mode === 'navigate' ? await cache.match('./index.html') : null;
    if (fallback) return fallback;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fresh = fetch(req).then((res) => {
    if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => hit);
  return hit || fresh;
}
