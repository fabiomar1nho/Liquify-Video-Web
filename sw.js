// Service worker mínimo: guarda o app em cache para abrir offline e permitir a instalação como PWA.
const C = 'liquify-v1';
const A = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(A)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const u = new URL(e.request.url);
    if (res.ok && (u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net')) {
      const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp));
    }
    return res;
  }).catch(() => caches.match('index.html'))));
});
