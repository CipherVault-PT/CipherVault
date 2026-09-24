/* Aurora Vault — Service Worker
   Faz a app abrir mesmo sem internet.
   Com rede: pergunta sempre ao servidor se há versão nova (sem esperar pela cache de 10 min do GitHub) e guarda-a.
   Sem rede, ou rede tão lenta que demora mais de 4 s: abre a cópia guardada neste dispositivo.
   Imagens do fundo: ficam guardadas à primeira vez e servem-se da memória (para mudar uma imagem, muda-se o nome da cache IMG).
   Os dados do cofre nunca passam por aqui — só a própria app (index.html), as imagens do fundo e as fontes. */
const C='av-app-v1',FONTS='av-fonts-v1',IMG='av-img-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html'])).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!==FONTS&&k!==IMG).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
const wait=ms=>new Promise((_,rej)=>setTimeout(()=>rej(new Error('lento')),ms));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===self.location.origin){
    if(/\.(webp|png|jpe?g)$/i.test(u.pathname)){
      e.respondWith(caches.open(IMG).then(c=>c.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{
        if(res&&res.ok)c.put(r,res.clone()).catch(()=>{});return res;}))));
      return;
    }
    if(r.mode==='navigate'){
      const net=fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{
        if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put('./index.html',cp)).catch(()=>{});}
        return res;
      });
      e.respondWith(Promise.race([net,wait(4000)]).catch(()=>
        caches.match('./index.html').then(m=>m||caches.match('./')).then(m=>m||net)));
      return;
    }
    e.respondWith(fetch(r).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{});}
      return res;
    }).catch(()=>caches.match(r,{ignoreSearch:true})));
    return;
  }
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone()).catch(()=>{});return res;}).catch(()=>m);
      return m||net;
    })));
  }
});
