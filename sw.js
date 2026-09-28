/* Aurora Vault — Service Worker
   Faz a app abrir mesmo sem internet.
   Com rede: pergunta sempre ao servidor se há versão nova do index.html (sem esperar pela cache de 10 min do GitHub) e guarda-a.
   Sem rede, ou rede tão lenta que demora mais de 4 s: abre a cópia guardada neste dispositivo.
   styles.css, app.js e js/*.js vão com a versão no endereço (?v=…): cada versão é descarregada uma vez e depois servida
   logo da memória. Mudar a versão no index.html é o que obriga a descarregar os ficheiros novos.
   Imagens do fundo: ficam guardadas à primeira vez e servem-se da memória (para mudar uma imagem, muda-se o nome da cache IMG).
   Partilhas («Partilhar → Aurora Vault») ficam guardadas só até a app as importar para o cofre (depois são apagadas).
   Bibliotecas e fontes (vendor/): a versão está no nome da pasta, por isso servem-se sempre da memória.
   Não há pedidos a servidores de terceiros: tudo vem deste site.
   Os dados do cofre nunca passam por aqui — só a própria app, as imagens do fundo e as fontes. */
const C='av-app-v2',IMG='av-img-v1',LIB='av-vendor-v1',SHARE='av-share';
/* Guarda a página e os ficheiros exatamente com a versão que ela usa (styles.css?v=…, app.js?v=…): vêm da cache do
   browser, que já os tem da visita em curso. Antes guardava-os sem versão — eram descarregados uma 2.ª vez e essa
   cópia nunca era usada — e descarregava as duas fotos do fundo, quando cada ecrã só usa uma. */
async function precacheCore(){
  const c=await caches.open(C);
  const res=await fetch('./index.html',{cache:'no-cache'});
  if(!res.ok)throw new Error('index');
  const html=await res.clone().text();
  const refs=[...new Set([...html.matchAll(/(?:href|src)="([\w/.-]+\.(?:css|js)\?v=[\d.]+)"/g)].map(m=>'./'+m[1]))];
  await c.put('./index.html',res.clone());await c.put('./',res);
  await c.addAll([...refs,'./vendor/jsqr.js?v=1.4.0']);
  for(const u of refs)await keepLatest(c,new URL(u,self.registration.scope).href);
}
self.addEventListener('install',e=>{
  e.waitUntil(precacheCore());
  self.skipWaiting();
});
// A página diz o que já carregou (foto do fundo, fontes) e guarda-se isso, a partir da cache do browser
self.addEventListener('message',e=>{
  const d=e.data;if(!d||d.type!=='av-precache'||!Array.isArray(d.urls))return;
  e.waitUntil(Promise.all(d.urls.slice(0,40).map(async u=>{
    const url=new URL(u,self.registration.scope);if(url.origin!==self.location.origin)return;
    const name=/\.(webp|png|svg|jpe?g)$/i.test(url.pathname)?IMG:url.pathname.includes('/vendor/')?LIB:null;if(!name)return;
    const c=await caches.open(name);if(await c.match(url.href,{ignoreSearch:true}))return;
    const r=await fetch(url.href);if(r.ok)await c.put(url.href,r);
  })).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(ks=>Promise.all(ks.filter(k=>![C,IMG,LIB,SHARE].includes(k)).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
const wait=ms=>new Promise((_,rej)=>setTimeout(()=>rej(new Error('lento')),ms));
// Guarda as 2 versões mais recentes de cada ficheiro (a anterior serve de rede de segurança durante uma atualização)
async function keepLatest(c,url){
  const path=new URL(url).pathname;
  const same=(await c.keys()).filter(k=>new URL(k.url).pathname===path);
  for(const k of same.slice(0,Math.max(0,same.length-2)))await c.delete(k);
}
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
    if(/\.(webp|png|svg|jpe?g)$/i.test(u.pathname)){
      e.respondWith(caches.open(IMG).then(c=>c.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{
        if(res&&res.ok)c.put(r,res.clone()).catch(()=>{});return res;}))));
      return;
    }
    // Bibliotecas (OCR, PDF) e fontes: memória primeiro — a pasta muda de nome quando muda a versão
    if(u.pathname.includes('/vendor/')&&!u.searchParams.has('v')){
      e.respondWith(caches.open(LIB).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{
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
    // Ficheiros com versão no endereço: memória primeiro (não mudam enquanto a versão for a mesma)
    if(u.searchParams.has('v')){
      e.respondWith(caches.open(C).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{
        if(res&&res.ok){c.put(r,res.clone()).then(()=>keepLatest(c,r.url)).catch(()=>{});}
        return res;
      }).catch(()=>c.match(r,{ignoreSearch:true})))));
      return;
    }
    e.respondWith(fetch(r).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{});}
      return res;
    }).catch(()=>caches.match(r,{ignoreSearch:true})));
    return;
  }
  // Pedidos a outros sites (Google Drive, verificação de fugas): passam direto, nunca ficam guardados
});
