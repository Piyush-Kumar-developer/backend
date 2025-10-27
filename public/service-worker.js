const CACHE_NAME = 'sangeet-keeda-shell-v2';
const AUDIO_CACHE = 'sangeet-keeda-audio-v2';
const CORE = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json', '/offline.html'];

self.addEventListener('install', e=>{ e.waitUntil((async()=>{ const c=await caches.open(CACHE_NAME); await c.addAll(CORE); self.skipWaiting(); })()); });

self.addEventListener('activate', e=>{ e.waitUntil((async()=>{ const keys = await caches.keys(); await Promise.all(keys.map(k=> { if(k!==CACHE_NAME && k!==AUDIO_CACHE) return caches.delete(k); })); self.clients.claim(); })()); });

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(url.pathname.startsWith('/uploads/')){
    e.respondWith((async()=>{ const cache = await caches.open(AUDIO_CACHE); const cached = await cache.match(e.request); if(cached) return cached; try{ const r = await fetch(e.request); if(r && r.ok) cache.put(e.request, r.clone()); return r; }catch(err){ return new Response('', { status:503 }); } })());
    return;
  }
  e.respondWith((async()=>{ try{ const r = await fetch(e.request); return r; }catch(err){ const c = await caches.open(CACHE_NAME); const cached = await c.match(e.request); if(cached) return cached; if(e.request.mode === 'navigate'){ const fallback = await c.match('/offline.html'); return fallback; } return new Response('', { status:503 }); } })());
});

self.addEventListener('message', event=>{ if(event.data && event.data.type === 'CACHE_AUDIO_FILES'){ cacheAudioList(event.data.payload || []); } });

async function cacheAudioList(list){ const cache = await caches.open(AUDIO_CACHE); for(const u of list){ try{ const req = new Request(u, { mode: 'same-origin' }); const r = await fetch(req); if(r && r.ok) await cache.put(req, r.clone()); }catch(e){ console.warn('cacheAudio error', u, e); } } }