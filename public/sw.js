// Service Worker for Grievance Portal
// Handles caching and preload responses properly

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Let the browser handle non-HTTP requests such as extensions, data URLs, etc.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }

  // Handle navigation preload properly
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse
          if (preloadResponse) {
            return preloadResponse
          }

          return await fetch(request)
        } catch {
          return new Response('Navigation request failed', { status: 503 })
        }
      })()
    )
    return
  }

  // Only proxy standard GET requests; let the browser keep full control otherwise.
  if (request.method !== 'GET') {
    return
  }

  event.respondWith(
    (async () => {
      try {
        return await fetch(request)
      } catch {
        return new Response('Network request failed', { status: 503 })
      }
    })()
  )
})
