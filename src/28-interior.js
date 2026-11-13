
/* ══ INTERIOR (v12.4) — disposição «Nova»: Início com a saudação e a Aurora (como no Clássico) e o que expira; Cofre em lista com folha de detalhes ══
   Só nos estilos novos (Safira, Ónix, Nórdico). A disposição «Anterior» continua em Definições → Aspeto.
   O Início não mostra contas (essas estão no Cofre). */
const AVN={sheet:null,pwT:0,ret:null};
function avnOn(){return document.documentElement.getAttribute('data-layout')!=='atual'&&typeof skNew==='function'&&skNew();}
function setLayout(l){
  if(l!=='nova'&&l!=='atual')return;
  skSet('av_layout',l);document.documentElement.setAttribute('data-layout',l);
  try{avnClose();renderAll();}catch(e){}
  skRenderSettings();
}
avAllow('setLayout','avnOpen','avnClose','avnPw','avnDo');
// mudar de estilo com o cofre aberto (p. ex. para o Clássico) redesenha logo o Início e o Cofre na disposição certa
if(typeof setSkin==='function'){const _avnSs=setSkin;setSkin=function(){const was=avnOn();const r=_avnSs.apply(this,arguments);try{if(was!==avnOn()){avnClose();if(typeof masterKey!=='undefined'&&masterKey)renderAll();}}catch(e){}return r;};}

// a v12.4 guardava aqui as contas usadas recentemente; já não são usadas
try{localStorage.removeItem('av_recent');}catch(e){}

function avnIcon(e){
  const userIcon=e.icon&&e.icon!=='⭐'?e.icon:null;
  const brand=userIcon?null:(typeof getBrandIcon==='function'?getBrandIcon(e):null);
  const svc=userIcon?userIcon:(brand?`<span class="brand-logo">${brand}</span>`:getServiceIcon(e.name));
  return svc?`<span class="service-icon">${svc}</span>`:avMono(e.name);
}
function avnHost(u){try{return new URL(/^[a-z]+:\/\//i.test(u)?u:'https://'+u).hostname.replace(/^www\./,'');}catch(e){return String(u||'');}}

// ── Início: a saudação e a Aurora como no Clássico (só a Aurora tem as cores) e, por baixo, o que expira ──
function avnHome(){
  let box2=document.getElementById('avn-home2');
  const old=document.getElementById('avn-home');if(old)old.remove();
  if(!avnOn()){if(box2)box2.innerHTML='';return;}
  const greet=document.getElementById('dash-greeting');if(!greet)return;
  // a seguir à saudação e aos primeiros passos (se ainda houver)
  if(!box2){box2=document.createElement('div');box2.id='avn-home2';}
  const onb=greet.nextElementSibling&&greet.nextElementSibling.id==='av-onboard'?greet.nextElementSibling:greet;
  if(onb.nextElementSibling!==box2)onb.after(box2);
  const en=currentLang==='en';
  // o que expira nos próximos 90 dias (documentos, cartões, subscrições, bens)
  let ev=[];try{const now=new Date();now.setHours(0,0,0,0);const lim=now.getTime()+90*864e5;ev=(typeof aurEvents==='function'?aurEvents():[]).filter(x=>x.date>=now.getTime()&&x.date<=lim).sort((a,b)=>a.date-b.date).slice(0,3);}catch(e){ev=[];}
  const day=d=>Math.max(0,Math.round((d-new Date().setHours(0,0,0,0))/864e5));
  const fmt=d=>new Date(d).toLocaleDateString(en?'en-GB':'pt-PT',{day:'numeric',month:'long'});
  box2.innerHTML=`${ev.length?`<div class="avn-rail-h"><b>${en?'Expiring soon':'A expirar'}</b><button type="button" data-act="openCalendar">${en?'Calendar':'Calendário'}</button></div>
    ${ev.map(x=>`<button type="button" class="avn-exp" data-act="openCalendar"><span class="avn-days"><b>${day(x.date)}</b><span>${en?'DAYS':'DIAS'}</span></span><span class="avn-exp-t"><b>${esc(x.label)}</b><small>${fmt(x.date)}</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`).join('')}`:''}`;
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
