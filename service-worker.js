// Service Worker — Oliverfy PWA
// Estratégias:
// - Network first para HTML (sempre tenta buscar versão nova)
// - Cache first para assets estáticos (ícones, fontes)
// - Sem cache para APIs (chamadas pro n8n, MP, etc)

const CACHE_VERSION = 'oliverfy-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/sobre.html',
  '/termos-de-uso.html',
  '/privacidade.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.png'
];

// Domínios que NUNCA devem ser cacheados (sempre vão direto pra rede)
const NO_CACHE_DOMAINS = [
  'chirpingotter-n8n.cloudfy.live',
  'api.mercadopago.com',
  'sheets.googleapis.com',
  'googleapis.com',
  'generativelanguage.googleapis.com'
];

// Install: pré-cacheia assets críticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Erro pré-cacheando:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: decide estratégia por tipo de requisição
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Só GET
  if (event.request.method !== 'GET') return;

  // Nunca cacheia chamadas pra APIs
  if (NO_CACHE_DOMAINS.some(d => url.hostname.includes(d))) {
    return;
  }

  // Estratégia network-first pra HTML
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza o cache em background
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se offline, usa cache
          return caches.match(event.request).then(cached => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache-first pra assets estáticos (ícones, fontes, css, js)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
