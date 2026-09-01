/* The Eleventh Hour — offline service worker
   ------------------------------------------------------------------
   This is the one part of the app that cannot live inside index.html:
   a service worker has to be fetched as its own script from the same
   origin. It is entirely optional.

   If you keep index.html on your phone and open the file directly, you
   can delete this file and lose nothing — a `file:` page cannot register
   a worker anyway, and there is nothing to cache: the whole app is that
   one file, already on your device.

   It earns its place in exactly one case: when the app is hosted at a
   web address. Then the page itself has to come off a server, and a
   browser is free to drop its copy — you would tap the Home Screen icon
   on the metro with no signal and get nothing. This stops that.

   Strategy — network first, cache fallback, for everything:
     Every request this app makes is for its own files, and there are
     only two of them. Network-first means a re-upload reaches your
     phone the next time you open it with signal, instead of you
     staring at last month's version. Cache-first would load a few
     milliseconds sooner and cost you that, which is a bad trade for
     an app you re-upload whenever you change your timetable.

   The app makes no other requests of any kind: no CDN, no fonts, no
   API, no analytics. Nothing here talks to anyone.                    */

const VERSION = 'eleventh-hour-v2.2';
const CORE    = ['./', './index.html'];

self.addEventListener('install', e=>{
  /* Take the new version straight away rather than waiting for every tab
     to close — there is only ever one tab, and waiting just means the
     update you did this morning shows up next week. */
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION)
      .then(c=>c.addAll(CORE))
      .catch(()=>{})            /* a failed precache must not block install */
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())   /* control the page without a reload */
  );
});

self.addEventListener('fetch', e=>{
  const r=e.request;
  if(r.method!=='GET') return;
  /* Never touch another origin. The app has none, so anything else here
     is not ours to serve. */
  if(new URL(r.url).origin!==self.location.origin) return;

  e.respondWith(
    fetch(r)
      .then(res=>{
        /* keep a copy of anything good that comes back */
        if(res && res.ok){
          const copy=res.clone();
          caches.open(VERSION).then(c=>c.put(r,copy)).catch(()=>{});
        }
        return res;
      })
      .catch(()=>
        caches.match(r).then(hit=>
          hit ||
          /* A navigation with nothing cached for that exact URL still
             wants the app, not a browser error page. */
          (r.mode==='navigate' ? caches.match('./index.html') : undefined)
        )
      )
  );
});

/* The app can ask for a clean slate — this clears the cached copies of
   the app itself. Your timetable and attendance live in localStorage and
   are not touched by any of this. */
self.addEventListener('message', e=>{
  if(!e.data || e.data.type!=='CLEAR') return;
  caches.keys()
    .then(ks=>Promise.all(ks.map(k=>caches.delete(k))))
    .then(()=>{
      if(e.source && e.source.postMessage) e.source.postMessage({type:'CLEARED'});
    })
    .catch(()=>{});
});
