// كاش بسيط عشان الموقع يفتح بسرعة ويشتغل حتى لو النت ضعيف
const C = 'la3rafo-v17';
const CORE = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/plan.js', 'js/data.js', 'js/firebase-config.js', 'js/ui.js', 'js/stats.js', 'js/features.js', 'js/admin.js', 'js/extras.js', 'js/reports.js', 'js/game.js', 'data/text.json',
  'assets/img/emblem.png', 'assets/img/emblem_s.png', 'assets/img/name.png', 'assets/img/church.png', 'assets/img/family.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // always revalidate with the server so a new version shows up right away (GitHub Pages caches files for 10 minutes)
  e.respondWith(fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
