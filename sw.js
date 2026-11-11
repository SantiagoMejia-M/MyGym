// MyGym: guarda la app para usarla sin internet.
// Código y datos: primero internet (para recibir actualizaciones), si no hay, lo guardado.
// Imágenes: se guardan la primera vez que se ven.
const VERSION = "mygym-v2";
const CORE = ["./", "index.html", "css/styles.css", "js/app.js", "js/engine.js", "js/data.js", "js/firebase-config.js",
  "data/exercises.js", "data/equipment.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "privacidad.html"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== "GET") return;
  // Librerías de Firebase: se guardan para poder abrir la app sin internet
  if(url.origin === "https://www.gstatic.com" && url.pathname.startsWith("/firebasejs/")){
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })));
    return;
  }
  if(url.origin !== location.origin) return; // login y base de datos de Firebase van directo
  if(url.pathname.includes("/img/") || url.pathname.includes("/icons/")){
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })));
    return;
  }
  e.respondWith(fetch(req).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
