const CACHE='pregatire-bucatar-v4';
const ASSETS=['./','./index.html','./assets/css/style.css','./assets/js/questions.js','./assets/js/app.js','./manifest.webmanifest','./assets/icons/icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Online: aduce versiunea nouă; offline: revine la copiile salvate.
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));
});
