
/* ══ INTERIOR (v12.4) — disposição «Nova»: Início em galeria e Cofre em lista com folha de detalhes ══
   Só nos estilos novos (Safira, Ónix, Nórdico). A disposição «Atual» continua em Definições → Aspeto.
   As «usadas recentemente» são só identificadores de contas guardados neste browser (nunca nomes nem dados). */
const AVN={sheet:null,pwT:0,ret:null};
function avnOn(){return document.documentElement.getAttribute('data-layout')!=='atual'&&typeof skNew==='function'&&skNew();}
function setLayout(l){
  if(l!=='nova'&&l!=='atual')return;
  skSet('av_layout',l);document.documentElement.setAttribute('data-layout',l);
  try{avnClose();renderAll();}catch(e){}
  skRenderSettings();
}
avAllow('setLayout','avnOpen','avnClose','avnPw','avnDo');

// ── usadas recentemente (só ids, neste browser) ──
function avnRecentIds(){try{const a=JSON.parse(localStorage.getItem('av_recent')||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'):[];}catch(e){return [];}}
function avnTouch(id){
  if(!id||(typeof presentationMode!=='undefined'&&presentationMode))return;
  const a=avnRecentIds().filter(x=>x!==id);a.unshift(id);
  try{localStorage.setItem('av_recent',JSON.stringify(a.slice(0,12)));}catch(e){}
}
['avCopyPw','avGoSite','openReadMode'].forEach(n=>{const f=window[n];if(typeof f!=='function')return;window[n]=function(id){try{avnTouch(id);}catch(e){}return f.apply(this,arguments);};});

function avnIcon(e){
  const userIcon=e.icon&&e.icon!=='⭐'?e.icon:null;
  const brand=userIcon?null:(typeof getBrandIcon==='function'?getBrandIcon(e):null);
  const svc=userIcon?userIcon:(brand?`<span class="brand-logo">${brand}</span>`:getServiceIcon(e.name));
  return svc?`<span class="service-icon">${svc}</span>`:avMono(e.name);
}
function avnHost(u){try{return new URL(/^[a-z]+:\/\//i.test(u)?u:'https://'+u).hostname.replace(/^www\./,'');}catch(e){return String(u||'');}}

// ── Início: cartão de boas-vindas com a joia, usadas recentemente e o que expira ──
function avnHome(){
  let box=document.getElementById('avn-home'),box2=document.getElementById('avn-home2');
  if(!avnOn()){if(box)box.innerHTML='';if(box2)box2.innerHTML='';return;}
  const dash=document.querySelector('#tab-dashboard .dashboard'),greet=document.getElementById('dash-greeting');
  if(!dash||!greet)return;
  // ordem: boas-vindas, usadas recentemente e o que expira, e só depois a saudação (avisos; Aurora no computador) e o resto
  // (outros blocos entram logo a seguir à saudação em cada render; por isso a posição é reposta sempre)
  if(!box){box=document.createElement('div');box.id='avn-home';}
  if(!box2){box2=document.createElement('div');box2.id='avn-home2';}
  if(greet.previousElementSibling!==box2||box2.previousElementSibling!==box){dash.insertBefore(box,greet);dash.insertBefore(box2,greet);}
  const en=currentLang==='en',active=vault.filter(x=>!x.archived);
  const weak=active.filter(x=>x.pw&&getPwScore(x.pw)<2).length;
  const name=(vaultName||'').trim();
  const n2fa=typeof totp!=='undefined'?totp.length:0,ncards=typeof bankCards!=='undefined'?bankCards.length:0;
  const stats=[`${active.length} ${en?(active.length===1?'account':'accounts'):(active.length===1?'conta':'contas')}`,
    n2fa?`${n2fa} ${en?'2FA codes':(n2fa===1?'código 2FA':'códigos 2FA')}`:'',ncards?`${ncards} ${en?(ncards===1?'card':'cards'):(ncards===1?'cartão':'cartões')}`:''].filter(Boolean).join(' · ');
  const st=weak?`<button type="button" class="avn-st warn" data-act="switchGroup" data-arg="cofre">⚠️ ${weak} ${en?(weak===1?'weak password to review':'weak passwords to review'):(weak===1?'password fraca para rever':'passwords fracas para rever')}</button>`
    :`<span class="avn-st ok">✓ ${en?'All safe and sound':'Tudo seguro e guardado'}</span>`;
  // usadas recentemente; sem histórico, as favoritas e depois as primeiras por nome
  const byId=new Map(active.map(x=>[x.id,x]));
  let rec=avnRecentIds().map(id=>byId.get(id)).filter(Boolean);
  if(rec.length<6){const seen=new Set(rec.map(x=>x.id));active.filter(x=>x.fav&&!seen.has(x.id)).concat(active.filter(x=>!x.fav).sort((a,b)=>a.name.localeCompare(b.name))).forEach(x=>{if(rec.length<8&&!seen.has(x.id)){rec.push(x);seen.add(x.id);}});}
  rec=rec.slice(0,8);
  const recTitle=avnRecentIds().some(id=>byId.has(id))?(en?'Recently used':'Usadas recentemente'):(en?'Your accounts':'As tuas contas');
  // o que expira nos próximos 90 dias (documentos, cartões, subscrições, bens)
  let ev=[];try{const now=new Date();now.setHours(0,0,0,0);const lim=now.getTime()+90*864e5;ev=(typeof aurEvents==='function'?aurEvents():[]).filter(x=>x.date>=now.getTime()&&x.date<=lim).sort((a,b)=>a.date-b.date).slice(0,3);}catch(e){ev=[];}
  const day=d=>Math.max(0,Math.round((d-new Date().setHours(0,0,0,0))/864e5));
  const fmt=d=>new Date(d).toLocaleDateString(en?'en-GB':'pt-PT',{day:'numeric',month:'long'});
  box.innerHTML=`<section class="avn-hero">
      <div class="avn-gem" aria-hidden="true">${skGemBuild(skGet('av_sig',''))}</div>
      <div class="avn-eb">AURORA VAULT</div>
      <h2 class="avn-hello">${name?(en?'Hello, ':'Olá, ')+esc(name):(en?'Hello':'Olá')}</h2>
      <div class="avn-stats">${esc(stats)}</div>${st}
    </section>`;
  box2.innerHTML=`${rec.length?`<div class="avn-rail-h"><b>${recTitle}</b><button type="button" data-act="switchGroup" data-arg="cofre">${en?'See all':'Ver todas'}</button></div>
    <div class="avn-rail">${rec.map(x=>`<button type="button" class="avn-rc" data-act="avnOpen" data-arg="${esc(x.id)}">${avnIcon(x)}<b>${esc(x.name)}</b><span>${esc(x.user||avnHost(x.url)||'')}</span></button>`).join('')}</div>`:''}
    ${ev.length?`<div class="avn-rail-h"><b>${en?'Expiring soon':'A expirar'}</b><button type="button" data-act="openCalendar">${en?'Calendar':'Calendário'}</button></div>
    ${ev.map(x=>`<button type="button" class="avn-exp" data-act="openCalendar"><span class="avn-days"><b>${day(x.date)}</b><span>${en?'DAYS':'DIAS'}</span></span><span class="avn-exp-t"><b>${esc(x.label)}</b><small>${fmt(x.date)}</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`).join('')}`:''}`;
  const g=box.querySelector('.sk-gem');if(g)try{skGemLight(g,-.35,-.45,0);}catch(e){}
}
if(typeof renderDashboard==='function'){const _avnRd=renderDashboard;renderDashboard=function(){const r=_avnRd.apply(this,arguments);try{avnHome();}catch(e){console.warn('Início:',e);}return r;};}

// ── Cofre: tocar numa conta abre a folha com os detalhes e as ações ──
document.addEventListener('click',e=>{
  if(!avnOn())return;
  const card=e.target.closest&&e.target.closest('#cards-grid .entry-card');
  if(!card||e.target.closest('button,a,input,select,textarea,label'))return;
  const id=card.dataset.arg||card.id.replace(/^card-/,'');
  if(id){e.preventDefault();avnOpen(id);}
});
// teclado: cada linha do Cofre recebe foco e abre com Enter ou espaço
if(typeof renderCards==='function'){const _avnRc=renderCards;renderCards=function(){const r=_avnRc.apply(this,arguments);try{if(avnOn())document.querySelectorAll('#cards-grid .entry-card').forEach(c=>{c.tabIndex=0;c.setAttribute('role','button');});}catch(e){}return r;};}
document.addEventListener('keydown',e=>{
  if((e.key!=='Enter'&&e.key!==' ')||!avnOn()||!e.target.matches||!e.target.matches('#cards-grid .entry-card'))return;
  e.preventDefault();avnOpen(e.target.dataset.arg||e.target.id.replace(/^card-/,''));
});
function avnOpen(id){
  const x=typeof avEntry==='function'?avEntry(id):null;if(!x)return;
  avnTouch(id);
  if(!AVN.sheet)AVN.ret=document.activeElement;
  const en=currentLang==='en';
  let ov=document.getElementById('avn-sheet');
  if(!ov){ov=document.createElement('div');ov.id='avn-sheet';ov.className='modal-overlay avn-sheet-ov';ov.dataset.act='avnClose';ov.setAttribute('data-self','');document.body.appendChild(ov);}
  const ic=s=>`<svg viewBox="0 0 24 24" aria-hidden="true">${s}</svg>`;
  const COPY=ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),EYE=ic('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
  const fld=(k,v,btn)=>`<div class="avn-f"><div><div class="avn-k">${k}</div><div class="avn-v">${v}</div></div>${btn||''}</div>`;
  const act=(fn,label)=>`<button type="button" class="avn-a" data-act="avnDo" data-arg="${fn}" data-arg2="${esc(x.id)}">${label}</button>`;
  const weak=x.pw&&getPwScore(x.pw)<2;
  ov.innerHTML=`<div class="modal avn-sheet" role="dialog" aria-modal="true" aria-label="${esc(x.name)}">
    <div class="avn-grab" aria-hidden="true"></div>
    <div class="avn-sh-head">${avnIcon(x)}<div class="avn-sh-t"><b>${esc(x.name)}</b>${x.url?`<small>${esc(avnHost(x.url))}</small>`:''}</div>
      <button type="button" class="avn-x" data-act="avnClose" aria-label="${en?'Close':'Fechar'}">✕</button></div>
    ${x.user?fld(t('cardUser'),esc(x.user),`<button type="button" class="avn-ib" data-act="copyText" data-arg="${esc(x.user)}" aria-label="${en?'Copy user':'Copiar utilizador'}">${COPY}</button>`):''}
    ${x.pw?fld(t('cardPw')+(weak?` <span class="avn-weak">${en?'weak':'fraca'}</span>`:''),`<span id="avn-pw" class="avn-mask">••••••••••</span>`,`<button type="button" class="avn-ib" data-act="avnPw" data-arg="${esc(x.id)}" aria-label="${en?'Show password':'Mostrar password'}">${EYE}</button>`):''}
    ${x.notes?fld(t('cardNotes'),`<span class="avn-notes">${esc(x.notes)}</span>`):''}
    ${x.pw?`<button type="button" class="btn btn-gold avn-main" data-act="avCopyPw" data-arg="${esc(x.id)}">${en?'Copy password':'Copiar password'}</button>`:''}
    <div class="avn-acts">${x.url?act('avGoSite',en?'Open site':'Abrir site'):''}${act('openReadMode',en?'View':'Ver')}${act('editEntry',en?'Edit':'Editar')}${act('toggleFav',x.fav?(en?'★ Unfavourite':'★ Tirar favorito'):(en?'☆ Favourite':'☆ Favorito'))}${act('openMoveModal',en?'Move':'Mover')}${act('archiveEntry',en?'Archive':'Arquivar')}${act('deleteEntry',en?'Delete':'Apagar')}</div>
  </div>`;
  AVN.sheet=id;ov.classList.add('open');
  setTimeout(()=>{const d=ov.querySelector('.avn-sheet');if(d){d.tabIndex=-1;d.focus({preventScroll:true});}},60);
}
function avnClose(){
  const ov=document.getElementById('avn-sheet');if(!ov||!ov.classList.contains('open'))return;
  ov.classList.remove('open');ov.innerHTML='';AVN.sheet=null;clearTimeout(AVN.pwT);
  // o foco volta à linha ou ao botão que abriu a folha
  const r=AVN.ret;AVN.ret=null;if(r&&r.isConnected&&r!==document.body)try{r.focus({preventScroll:true});}catch(e){}
}
// mostrar a password por 20 s (depois volta a esconder sozinha)
function avnPw(id){
  const x=avEntry(id),el=document.getElementById('avn-pw');if(!x||!el)return;
  clearTimeout(AVN.pwT);
  if(el.classList.contains('avn-mask')){el.textContent=x.pw;el.classList.remove('avn-mask');AVN.pwT=setTimeout(()=>{const e2=document.getElementById('avn-pw');if(e2){e2.textContent='••••••••••';e2.classList.add('avn-mask');}},20000);}
  else{el.textContent='••••••••••';el.classList.add('avn-mask');}
}
// ações da folha: fecha-a e faz a mesma ação que o cartão faria
const AVN_ACTS=new Set(['avGoSite','openReadMode','editEntry','toggleFav','openMoveModal','archiveEntry','deleteEntry']);
function avnDo(fn,id){
  if(!AVN_ACTS.has(fn))return;
  if(fn==='toggleFav'){const f=avFn(fn);if(f)f(id);return avnOpen(id);}
  avnClose();const f=avFn(fn);if(!f)return;
  setTimeout(()=>fn==='openMoveModal'?f(id,'vault'):f(id),30);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')avnClose();});
if(typeof lockApp==='function'){const _avnLa=lockApp;lockApp=function(){try{avnClose();}catch(e){}return _avnLa.apply(this,arguments);};}
if(typeof switchTab==='function'){const _avnSt=switchTab;switchTab=function(){try{avnClose();}catch(e){}return _avnSt.apply(this,arguments);};}
