const CACHE_NAME = 'run21k-v3';
const ASSETS = ['/carol21/','/carol21/index.html','/carol21/manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE_NAME).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if(e.request.method!=='GET'||e.request.url.includes('/webhook/')) return; e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,c)).catch(()=>{});return r;}).catch(()=>caches.match(e.request))); });
