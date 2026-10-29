// Online-only transactions. Never cache Auth, RSC, API responses, receipts or business records.
const CACHE='salon-public-v1';
const PUBLIC=['/offline.html','/pwa-192.png','/pwa-512.png','/pwa-maskable.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(PUBLIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('salon-public-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(PUBLIC.includes(url.pathname)){event.respondWith(caches.match(url.pathname).then(r=>r||fetch(event.request)));return;}if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));}});
