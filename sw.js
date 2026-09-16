const CACHE_NAME = 'mis-compras-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon.png'
];

// Instalar - cachear archivos
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS_TO_CACHE).catch(function() {});
        })
    );
    self.skipWaiting();
});

// Activar - limpiar caches viejos
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) {
                    return name !== CACHE_NAME;
                }).map(function(name) {
                    return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - servir desde cache, actualizar en segundo plano
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(cachedResponse) {
            if (cachedResponse) {
                // Actualizar cache en segundo plano
                fetch(event.request).then(function(response) {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, responseClone).catch(function() {});
                        });
                    }
                }).catch(function() {});
                return cachedResponse;
            }
            // Si no esta en cache, intentar de red
            return fetch(event.request).then(function(response) {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseClone).catch(function() {});
                });
                return response;
            }).catch(function() {
                return caches.match('./index.html');
            });
        })
    );
});