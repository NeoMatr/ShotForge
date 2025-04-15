// Service Worker for ShotForge App
const CACHE_NAME = 'pool-challenge-v1';

// Files to cache
const CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles.css',
  '/src/app.js',
  '/src/firebase-config.js',
  '/src/utils/challenges.js',
  '/src/utils/user.js',
  '/src/utils/storage.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Use cache first, then network for all requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If in cache, return cached version
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then((fetchResponse) => {
            // Check if we received a valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response
            const responseToCache = fetchResponse.clone();

            // Cache the response for future requests
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed; returning offline page instead.', error);
            
            // Return a fallback page if available
            return caches.match('/index.html');
          });
      })
  );
}); 