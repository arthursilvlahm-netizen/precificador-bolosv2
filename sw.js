// Service worker: deixa o app funcionar sem internet.
// Para publicar uma atualização, aumente o número da versão abaixo.
const VERSAO = 'precifica-bolo-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSAO).then(cache => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(c => c !== VERSAO).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Páginas: tenta a rede primeiro (pega atualizações) e cai no cache se estiver offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copia = resp.clone();
          caches.open(VERSAO).then(c => c.put('./index.html', copia));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Demais arquivos: cache primeiro.
  event.respondWith(
    caches.match(req).then(achado => achado || fetch(req).then(resp => {
      if (resp && resp.ok && new URL(req.url).origin === location.origin) {
        const copia = resp.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
      }
      return resp;
    }))
  );
});
