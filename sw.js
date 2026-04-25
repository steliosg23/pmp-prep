/* PMP Prep — Service Worker
 *
 * Strategy: app shell pre-cached on install, runtime caching for cross-origin
 * deps (CDN libs + Google Fonts). On activate, old caches are purged so users
 * get fresh code after deploys.
 *
 * Bumping CACHE_VERSION on every deploy invalidates all caches and forces a
 * one-shot refetch.
 */

const CACHE_VERSION = 'v2026.04.25.4';
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
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
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
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Same-origin: cache-first with network fallback (offline-capable shell)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, APP_CACHE));
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

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fetchPromise;
}
