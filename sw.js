'use strict';
// Bump VERSION whenever an application asset changes. Each version is cached as a set.
const VERSION='v5';
const PREFIX='pregatire-bucatar:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+VERSION;
const ASSETS=['./','./index.html','./assets/css/style.css','./assets/js/questions.js','./assets/js/logic.js','./assets/js/app.js','./manifest.webmanifest','./assets/icons/icon.svg'];
const urls=ASSETS.map(file=>new URL(file,self.registration.scope).href);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls.map(url=>new Request(url,{cache:'reload'})))));
});
// Existing tabs keep their version until the learner updates or closes them.
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  const page=event.request.mode==='navigate'&&(url.pathname===new URL(self.registration.scope).pathname||url.pathname===new URL('index.html',self.registration.scope).pathname);
  const key=page?new URL('./',self.registration.scope).href:url.href;
  if(!page&&!urls.includes(key))return;
  event.respondWith((async()=>{
    try{const cache=await caches.open(CACHE);const cached=await cache.match(key);if(cached)return cached;}catch{}
    try{return await fetch(event.request);}catch{return new Response('Resursa nu este disponibilă offline. Revino când ai internet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
});
