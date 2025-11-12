self.addEventListener('install', event => {
  console.log('Service Worker: instalando...');
  event.waitUntil(
    caches.open('meucep-cache-v1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]);
    }).catch(err => console.error('Erro ao adicionar arquivos ao cache:', err))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se estiver no cache, retorna
        if (response) return response;
        // Se não, busca da rede e armazena
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open('meucep-cache-v1').then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        });
      })
      .catch(err => {
        console.error('Erro no fetch:', err);
        // Retorna a página principal caso tudo falhe
        return caches.match('./index.html');
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== 'meucep-cache-v1').map(k => caches.delete(k))
      );
    })
  );
});
