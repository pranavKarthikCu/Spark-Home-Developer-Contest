const CACHE_NAME = 'spark-homes-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/spark-homes-estimator.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to cache all assets, but don't fail if some CDN assets aren't available
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) return response;
      
      // Try to fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses or cross-origin requests
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // Clone response and cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Return cached version if network fails
        return caches.match(event.request);
      });
    })
  );
});
