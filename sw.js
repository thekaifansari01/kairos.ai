// sw.js - Service Worker for Kairos AI
// Version: 2.0.0 – Fixed caching for chat app and stop button

const CACHE_NAME = 'kairos-cache-v2';
const RUNTIME_CACHE = 'kairos-runtime-v2';

// ========== All critical assets that must be cached ==========
const PRECACHE_URLS = [
  '/',                          // root (landing page)
  '/index.html',                // landing page
  '/c.html',                    // ✅ main chat app – now included
  
  // CSS
  '/chatui/base.css',
  '/chatui/sidebar.css',
  '/chatui/welcome.css',
  '/chatui/messages.css',
  '/chatui/think-box.css',
  '/chatui/code-blocks.css',
  '/chatui/table_markdown.css',
  '/chatui/input-area.css',
  '/chatui/animations.css',
  '/chatui/navbar.css',
  '/chatui/markdown.css',
  '/chatui/modals.css',
  '/chatui/interpreter.css',
  '/chatui/rag-modal.css',
  
  // Core JS (critical – avoid stale versions)
  '/js/modules/core/config.js',
  '/js/modules/core/memory.js',
  '/js/modules/core/main.js',      // stop button logic lives here
  '/js/ui/ui.js',                  // send/stop UI
  '/js/ui/modal.js',
  '/js/ui/message-actions.js',
  '/js/ui/chat-export.js',
  '/js/ui/navbar.js',
  '/js/ui/settings-popup.js',
  '/js/ui/lottie-loader.js',
  '/js/ui/template-suggestions.js',
  '/js/ui/template-manager.js',
  '/js/ui/rag-manager.js',
  '/js/ui/formatter.js',
  
  // Auth & History
  '/js/modules/auth/firebase.js',
  '/js/modules/auth/featureGuard.js',
  '/js/modules/history/history-index.js',
  '/js/modules/history/history-firestore.js',
  '/js/modules/history/history-conversation.js',
  '/js/modules/history/history-helpers.js',
  '/js/modules/history/history-title.js',
  
  // API
  '/js/modules/api/api.js',
  
  // RAG
  '/js/modules/rag/code-chunker.js',
  '/js/modules/rag/vector-store.js',
  '/js/modules/rag/embeddings.js',
  '/js/modules/rag/embeddings-worker.js',
  
  // Interpreter
  '/js/modules/interpreter/interpreter.js',
  '/js/modules/interpreter/python-worker.js',
  
  // Utils
  '/js/utils/toast.js',
  '/js/utils/validation.js',
  
  // Animation
  '/animations/dolphin_welcome_animation.json',
];

// ========== Install – cache everything ==========
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// ========== Activate – delete old caches ==========
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ========== Fetch – smart strategies ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. External CDNs (fonts, highlight.js, marked, lottie) – stale-while-revalidate
  if (
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com') ||
    url.origin.includes('cdnjs.cloudflare.com') ||
    url.origin.includes('cdn.jsdelivr.net') ||
    url.origin.includes('unpkg.com')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 2. Pyodide (heavy, versioned) – cache first, network fallback
  if (url.origin.includes('cdn.jsdelivr.net/pyodide')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 3. Firebase & Google APIs – never cache
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('www.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.origin.includes('generativelanguage.googleapis.com') ||
    url.origin.includes('api.groq.com') ||
    url.origin.includes('openrouter.ai')
  ) {
    // Just fetch from network, no cache
    event.respondWith(fetch(request));
    return;
  }

  // 4. HTML pages (navigation) – network first, then cache (for offline)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 5. Critical JS/CSS – network first to always get latest (fixes stop button)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.includes('/js/') ||
    url.pathname.includes('/chatui/')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 6. Everything else – cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// ========== Helper: Stale-while-revalidate ==========
function staleWhileRevalidate(request) {
  return caches.open(RUNTIME_CACHE).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {});
      return cachedResponse || fetchPromise;
    });
  });
}

// ========== Helper: Cache first, network fallback ==========
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
      return response;
    });
  });
}

// ========== Helper: Network first, cache fallback (for HTML & critical JS) ==========
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      // Cache a copy for offline use
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    })
    .catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        // Ultimate fallback – show the chat page if nothing else
        return caches.match('/c.html');
      });
    });
}