// Custom service worker enhancement for FinFlow
self.addEventListener('install', (event) => {
  // Skip waiting to activate the worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients to ensure all tabs/windows are controlled by this SW
  event.waitUntil(clients.claim());
});

// Handle back/forward cache restoration
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ENABLE_BF_CACHE') {
    // Nothing needs to happen here beyond event listener existing
    // This prevents "Page prevented back/forward cache restoration" errors
  }
});

// Enhance the fetch handler for offline fallbacks
self.addEventListener('fetch', event => {
  // Only handle GET requests (important for security reasons)
  if (event.request.method !== 'GET') return;
  
  // Try the network first, if it fails, use the cache
  const networkThenCache = async () => {
    const cache = await caches.open('finflow-dynamic-cache');
    
    try {
      // Try network first
      const networkResponse = await fetch(event.request);
      
      // Cache the successful response
      cache.put(event.request, networkResponse.clone());
      
      return networkResponse;
    } catch (error) {
      // If network fails, try to use the cache
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If nothing in cache for API requests, return a custom offline JSON
      if (event.request.url.includes('/api/')) {
        return new Response(
          JSON.stringify({ error: 'You are offline and data is not cached' }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      }
      
      // For other requests that aren't in cache, try the offline fallback page
      return await cache.match('/offline.html') || new Response('You are offline and content is not available', { status: 503 });
    }
  };
  
  event.respondWith(networkThenCache());
});
