/* Aurora Vault — Service Worker
   Faz a app abrir mesmo sem internet.
   Com rede: pergunta sempre ao servidor se há versão nova (sem esperar pela cache de 10 min do GitHub) e guarda-a.
   Sem rede, ou rede tão lenta que demora mais de 4 s: abre a cópia guardada neste dispositivo.
   Imagens do fundo: ficam guardadas à primeira vez e servem-se da memória (para mudar uma imagem, muda-se o nome da cache IMG).
   Partilhas («Partilhar → Aurora Vault») ficam guardadas só até a app as importar para o cofre (depois são apagadas).
   Os dados do cofre nunca passam por aqui — só a própria app (index.html), as imagens do fundo e as fontes. */
const C='av-app-v1',FONTS='av-fonts-v1',IMG='av-img-v1',LIB='av-lib-v1',SHARE='av-share';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html'])).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(ks=>Promise.all(ks.filter(k=>![C,FONTS,IMG,LIB,SHARE].includes(k)).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
const wait=ms=>new Promise((_,rej)=>setTimeout(()=>rej(new Error('lento')),ms));
self.addEventListener('fetch',e=>{
  const r=e.request;
  // «Partilhar → Aurora Vault»: guarda o que foi partilhado e abre a app; só entra no cofre depois de desbloqueado
  if(r.method==='POST'&&new URL(r.url).pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{
        const fd=await r.formData(),c=await caches.open(SHARE);
        for(const k of await c.keys())await c.delete(k);
        const meta={title:fd.get('title')||'',text:fd.get('text')||'',url:fd.get('url')||'',files:[],at:Date.now()};
        const files=fd.getAll('files').filter(f=>f&&f.size);
        for(let i=0;i<files.length&&i<10;i++){const f=files[i],key='./__share/'+i;await c.put(key,new Response(f,{headers:{'Content-Type':f.type||'application/octet-stream'}}));meta.files.push({key,name:f.name||('ficheiro-'+(i+1)),type:f.type||''});}
        await c.put('./__share/meta',new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json'}}));
      }catch(err){}
      return Response.redirect(new URL('./?go=share',self.registration.scope).href,303);
    })());
    return;
  }
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
  // leitor de OCR (descarregado 1× e guardado para funcionar offline)
  if(u.hostname==='cdn.jsdelivr.net'||u.hostname==='tessdata.projectnaptha.com'){
    e.respondWith(caches.open(LIB).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone()).catch(()=>{});return res;}))));
    return;
  }
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone()).catch(()=>{});return res;}).catch(()=>m);
      return m||net;
    })));
  }
});
