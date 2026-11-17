// Service worker do Liquify: permite instalar como PWA e abrir a tela inicial instantaneamente, mesmo offline.
// Todos os caminhos são relativos ao local deste arquivo, então funciona em subpastas (ex.: GitHub Pages).
const CACHE = 'liquify-v4';
const ASSETS = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.js'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Cada item é adicionado separadamente: se um faltar, a instalação não falha.
    await Promise.all(ASSETS.map(a => c.add(a).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && url.hostname !== 'cdn.jsdelivr.net') return; // modelos e outros recursos externos vão direto à rede
  const nav = req.mode === 'navigate';
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    // Navegação: sempre serve a página inicial do cache, ignorando parâmetros de URL (?utm=..., ?source=pwa).
    const hit = nav
      ? (await c.match('./', { ignoreSearch: true })) || (await c.match('index.html', { ignoreSearch: true }))
      : await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && res.ok) c.put(nav ? './' : req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }          // cache primeiro, atualiza em segundo plano
    const res = await net;
    if (res) return res;
    return nav ? ((await c.match('./')) || (await c.match('index.html')) || Response.error()) : Response.error();
  })());
});
