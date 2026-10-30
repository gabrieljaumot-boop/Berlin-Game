// The service worker: the game (one big page), its icons and three.js stay on the phone after the first start, so it opens quickly
// and plays without a connection. Change VERSION with every update; a phone then fetches the new game once.
// Robust install: each file is cached on its own, so one failed download (a CDN hiccup on mobile data) no longer stops the
// install; anything missing is cached the first time the game asks for it.
const VERSION = 'fa-20261030172500';
const CORE = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all([...CORE, ...CDN].map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// from the phone first, from the net when it is not there (and keep a copy for next time)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // the start page "./" is the same file as index.html: serve that copy instead of downloading 19 MB twice
  const key = req.mode === 'navigate' && url.origin === location.origin ? './index.html' : req;
  e.respondWith(caches.match(key, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
