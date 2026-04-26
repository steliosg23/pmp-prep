/* PMP Prep — Service Worker
 *
 * Strategy: app shell pre-cached on install, runtime caching for cross-origin
 * deps (CDN libs + Google Fonts). On activate, old caches are purged so users
 * get fresh code after deploys.
 *
 * Bumping CACHE_VERSION on every deploy invalidates all caches and forces a
 * one-shot refetch.
 */

const CACHE_VERSION = 'v2026.04.26.05';
const APP_CACHE = `pmp-app-${CACHE_VERSION}`;
const CDN_CACHE = `pmp-cdn-${CACHE_VERSION}`;

// Files that make up the app shell. Path is relative to the SW's scope so
// this works under any GitHub Pages subpath (e.g. /pmp-prep/).
const APP_SHELL = [
  './',
  './index.html',
  './data.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-32.png',
  './icon-16.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './pmp.ico',
];

// Origins that are safe to cache for offline use.
const RUNTIME_CACHEABLE_ORIGINS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net',
  'https://cdnjs.cloudflare.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then(async (cache) => {
      // Force-reload from network so the install never picks up a stale
      // HTML/JS from the browser HTTP cache (iOS Safari + GitHub Pages
      // ship Cache-Control: max-age=600, which would otherwise pin old
      // bytes into the SW cache for ~10 min after every deploy).
      await Promise.all(APP_SHELL.map(async (path) => {
        try {
          const res = await fetch(path, { cache: 'reload' });
          if (res && res.ok) await cache.put(path, res);
        } catch (_) { /* offline install — best effort */ }
      }));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_CACHE && k !== CDN_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION') {
    // Reply via MessageChannel port if provided (preferred — direct reply),
    // else broadcast to all clients.
    const payload = { type: 'VERSION', version: CACHE_VERSION };
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(payload);
    } else {
      self.clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage(payload)));
    }
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Same-origin: navigation/HTML requests use network-first so a fresh
  // deploy reaches users on the very next page load when online (the
  // SW-update path is a separate, slower safety net). Other assets stay
  // cache-first for offline + speed.
  if (url.origin === self.location.origin) {
    const isHTML = req.mode === 'navigate' ||
      (req.headers.get('accept') || '').includes('text/html');
    if (isHTML) {
      event.respondWith(networkFirst(req, APP_CACHE));
    } else {
      event.respondWith(cacheFirst(req, APP_CACHE));
    }
    return;
  }

  // Whitelisted CDN origins: stale-while-revalidate
  if (RUNTIME_CACHEABLE_ORIGINS.some((o) => req.url.startsWith(o))) {
    event.respondWith(staleWhileRevalidate(req, CDN_CACHE));
    return;
  }

  // Everything else: default network behaviour
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    // Last-ditch: try the start_url so SPA still loads when offline
    const fallback = await cache.match('./index.html');
    if (fallback) return fallback;
    throw err;
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    const fallback = await cache.match('./index.html');
    if (fallback) return fallback;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fetchPromise;
}
