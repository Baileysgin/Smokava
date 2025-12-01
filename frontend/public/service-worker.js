// Minimal Service Worker for Smokava PWA
// Only caches static assets - no full offline mode

const CACHE_NAME = 'smokava-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/logo-icon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache for static assets, network for API calls
self.addEventListener('fetch', (event) => {
  // Only cache GET requests for static assets
  if (event.request.method === 'GET' && 
      (event.request.url.includes('/_next/static') || 
       event.request.url.includes('/logo') ||
       event.request.url === new URL(event.request.url).origin + '/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
  // For all other requests (API calls, etc.), always use network
});

