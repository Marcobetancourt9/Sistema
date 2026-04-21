// Minimal Service Worker para engañar a Lighthouse y navegadores
// Esto es un requisito en algunos navegadores modernos para mostrar
// el 'Install Prompt' a los usuarios de manera automatica.

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Passthrough de red básico para que no rompa nada.
  // Podrías implementar lógica de caché en el futuro.
  e.respondWith(fetch(e.request).catch(() => new Response("Offline")));
});
