/* ══ v9.70 — ＋ ADICIONAR · GRAVAÇÃO AUTOMÁTICA · MODO SIMPLES/COMPLETO · PRIMEIROS PASSOS ══ */
const AV_ADD=[
 {k:'password',ic:'🔑',t:['Password','Password'],d:['Login de um site ou app','Login for a site or app'],n:['Nova password','New password'],tab:'vault',run:()=>openModal()},
 {k:'card',ic:'💳',t:['Cartão bancário','Bank card'],d:['Número, validade e banco','Number, expiry and bank'],n:['Novo cartão','New card'],tab:'cards',run:()=>openCardModal()},
 {k:'store',ic:'🎟️',t:['Cartão de loja','Store card'],d:['Mostra o código de barras na caixa','Shows the barcode at the till'],n:['Novo cartão de loja','New store card'],tab:'store',run:()=>openStoreModal()},
 {k:'doc',ic:'📄',t:['Documento','Document'],d:['Foto ou PDF — CC, seguro, fatura','Photo or PDF — ID, insurance, invoice'],n:['Novo documento','New document'],tab:'docs',run:()=>openDocModal()},
 {k:'note',ic:'📝',t:['Nota','Note'],d:['Texto privado e encriptado','Private, encrypted text'],n:['Nova nota','New note'],tab:'notes',run:()=>newNote()},
 {k:'totp',ic:'🔐',t:['Código 2FA','2FA code'],d:['Os códigos de 6 dígitos','The 6-digit codes'],n:['Novo código 2FA','New 2FA code'],tab:'totp',run:()=>{if(typeof aurTotpLocked==='function'&&aurTotpLocked()){toast(currentLang==='en'?'Unlock the 2FA vault first — then tap “New 2FA code”.':'Desbloqueia primeiro o cofre 2FA — depois toca em «Novo código 2FA».');return;}openTotpModal();}}
];
const AV_ADD_MORE=[
 {k:'warranty',ic:'🧾',t:['Garantia','Warranty'],n:['Nova garantia','New warranty'],tab:'warranty',run:()=>openAssetModal('warranty')},
 {k:'vehicle',ic:'🚗',t:['Veículo','Vehicle'],n:['Novo veículo','New vehicle'],tab:'vehicle',run:()=>openAssetModal('vehicle')},
 {k:'license',ic:'🪪',t:['Licença','Licence'],n:['Nova licença','New licence'],tab:'license',run:()=>openAssetModal('license')},
 {k:'date',ic:'📅',t:['Data importante','Important date'],n:['Nova data','New date'],tab:'dates',run:()=>openAssetModal('dates')},
 {k:'sub',ic:'🔁',t:['Subscrição','Subscription'],tab:null,run:()=>openSubModal()},
 {k:'wifi',ic:'WIFI_ICON',t:['Rede Wi-Fi','Wi-Fi network'],tab:null,simple:true,run:()=>openWifiManager()},
 {k:'person',ic:'🆔',t:['Pessoa (Info)','Person (Info)'],n:['Nova pessoa','New person'],tab:'info',simple:true,run:()=>addPerson()}
];
const AV_TAB_ADD={info:'person',vault:'password',totp:'totp',cards:'card',store:'store',docs:'doc',notes:'note',warranty:'warranty',vehicle:'vehicle',license:'license',dates:'date'};
let avCurTab='dashboard';
const avEn=()=>typeof currentLang!=='undefined'&&currentLang==='en';
const avT=a=>a?(avEn()?a[1]:a[0]):'';
function avIsDesk(){return !(window.matchMedia&&matchMedia('(max-width:768px)').matches);}
function avFind(k){return AV_ADD.concat(AV_ADD_MORE).find(x=>x.k===k);}
function avAddType(k){
  const t=avFind(k);if(!t)return;avAddClose();
  try{if(t.tab&&t.tab!==avCurTab&&typeof switchTab==='function')switchTab(t.tab);}catch(e){}
  setTimeout(()=>{try{t.run();}catch(e){console.warn('Adicionar:',e);}},80);
}
function avAddMain(e){if(e)e.stopPropagation();const k=AV_TAB_ADD[avCurTab];if(k)avAddType(k);else avAddMenu(e);}
function avAddLabel(){
  const el=document.getElementById('tb-add-txt');if(!el)return;
  const k=AV_TAB_ADD[avCurTab],t=k&&avFind(k);
  el.textContent=t?avT(t.n):(avEn()?'Add':'Adicionar');
  const main=document.getElementById('tb-add-main');if(main)main.title=el.textContent;
  const ch=document.getElementById('tb-add-chev');if(ch){const l=avEn()?'Choose what to add':'Escolher o que adicionar';ch.title=l;ch.setAttribute('aria-label',l);}
  const fab=document.getElementById('av-fab-add');if(fab)fab.setAttribute('aria-label',avEn()?'Add':'Adicionar');
}
let _avAddOpenedAt=0;
function avAddCloseSafe(){if(Date.now()-_avAddOpenedAt<400)return;avAddClose();}
function avAddClose(){const p=document.getElementById('av-add-pop'),d=document.getElementById('av-add-dim');if(p)p.classList.remove('open');if(d)d.classList.remove('open');}
function avAddMenu(e){
  if(e)e.stopPropagation();
  let p=document.getElementById('av-add-pop'),d=document.getElementById('av-add-dim');
  if(p&&p.classList.contains('open')){avAddClose();return;}
  if(!p){d=document.createElement('div');d.id='av-add-dim';d.className='av-dim';d.onclick=avAddCloseSafe;document.body.appendChild(d);
    p=document.createElement('div');p.id='av-add-pop';p.className='av-pop';document.body.appendChild(p);}
  const en=avEn(),full=avMode()==='full';
  p.innerHTML='<div class="av-grab"></div><h4>'+(en?'What do you want to store?':'O que queres guardar?')+'</h4><div class="av-list">'
   +AV_ADD.filter(t=>!avTabHidden(t.tab)).map((t,i)=>'<button class="av-it'+(i===0?' hl':'')+'" role="menuitem" data-act="avAddType" data-arg="'+esc(t.k)+'"><span class="ic">'+t.ic+'</span><span><b>'+avT(t.t)+'</b><i>'+avT(t.d)+'</i></span></button>').join('')+'</div>'
   +((full||AV_ADD_MORE.some(t=>t.simple))?'<h4>'+(en?'More':'Mais')+'</h4><div class="av-more">'+AV_ADD_MORE.filter(t=>(full||t.simple)&&!avTabHidden(t.tab)).map(t=>'<button data-act="avAddType" data-arg="'+esc(t.k)+'">'+t.ic+' '+avT(t.t)+'</button>').join('')+'</div>':'')
   +'<button class="av-aur" data-act="avAddAurora">✨ '+(en?'Or tell Aurora: <b>"add Netflix"</b>':'Ou escreve à Aurora: <b>"adiciona a Netflix"</b>')+'</button>';
  if(avIsDesk()){
    p.classList.remove('sheet');d.classList.remove('open');
    const a=document.getElementById('tb-add');const r=a?a.getBoundingClientRect():{bottom:60,right:window.innerWidth-20};
    p.style.top=Math.round(r.bottom+8)+'px';p.style.right=Math.max(10,Math.round(window.innerWidth-r.right))+'px';p.style.left='auto';p.style.bottom='auto';
  }else{p.classList.add('sheet');p.style.top='auto';p.style.right='0';p.style.left='0';d.classList.add('open');}
  p.classList.add('open');_avAddOpenedAt=Date.now();
}
document.addEventListener('click',e=>{const p=document.getElementById('av-add-pop');if(p&&p.classList.contains('open')&&!p.contains(e.target))avAddCloseSafe();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')avAddClose();});

/* ── gravação automática ── */
let avSeq=0,avSaving=false,_avAsT=0,_avAsBusy=false;
function autoSaveOn(){try{return localStorage.getItem('av_autosave')!=='0';}catch(e){return true;}}
function avToggleAutosave(){try{localStorage.setItem('av_autosave',autoSaveOn()?'0':'1');}catch(e){}avRenderSettings();avRenderSaveState();if(autoSaveOn()&&hasUnsaved)avScheduleAutoSave();toast(autoSaveOn()?(avEn()?'Autosave on.':'Gravação automática ligada.'):(avEn()?'Autosave off — use “Save file now” in the ⋯ menu.':'Gravação automática desligada — usa «Guardar ficheiro agora» no menu ⋯.'));}
let avLastInput=0,avLastDriveUp=0,_avFlushT=0;
document.addEventListener('input',()=>{avLastInput=Date.now();},true);
document.addEventListener('keydown',()=>{avLastInput=Date.now();},true);
function avDriveFlushLater(ms){clearTimeout(_avFlushT);_avFlushT=setTimeout(async()=>{_avFlushT=0;if(!driveOn()||!navigator.onLine)return;try{await driveFlushPending(true);avLastDriveUp=Date.now();}catch(e){}},Math.max(1000,ms));}
function avFlushNow(){if(_avFlushT){clearTimeout(_avFlushT);_avFlushT=0;try{driveFlushPending(true);}catch(e){}avLastDriveUp=Date.now();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)avFlushNow();});
function avScheduleAutoSave(){
  if(!autoSaveOn()||presentationMode||!masterKey||(typeof vaultReadOnly!=='undefined'&&vaultReadOnly))return;
  clearTimeout(_avAsT);_avAsT=setTimeout(avAutoSaveRun,2500);
}
async function avAutoSaveRun(){
  if(!hasUnsaved||!masterKey)return;
  if(_avAsBusy||document.querySelector('.modal-overlay.open,.open[id$="-overlay"]')){_avAsT=setTimeout(avAutoSaveRun,2500);return;}
  if(Date.now()-avLastInput<2000){_avAsT=setTimeout(avAutoSaveRun,1500);return;} // ainda a escrever → espera
  _avAsBusy=true;avSaving=true;avRenderSaveState();
  const seq=avSeq;
  try{await saveFile({auto:true});}catch(e){}
  _avAsBusy=false;avSaving=false;
  if(avSeq!==seq){hasUnsaved=true;const b=document.querySelector('.btn-save-file');if(b)b.classList.add('has-changes');avScheduleAutoSave();}
  avRenderSaveState();
}
function avRenderSaveState(){
  const b=document.getElementById('tb-save-state'),tx=document.getElementById('tb-saved-txt');if(!b||!tx)return;
  const en=avEn();let cls='',txt,tip;
  if(avSaving){cls='saving';txt=en?'Saving…':'A gravar…';tip=txt;}
  else if(hasUnsaved){cls='dirty';txt=autoSaveOn()?(en?'Saving soon':'Por gravar'):(en?'Not saved':'Por gravar');tip=en?'Unsaved changes — tap to save now':'Alterações por gravar — toca para gravar já';}
  else{txt=en?'Saved':'Guardado';tip=autoSaveOn()?(en?'Saved automatically — tap to save the file now':'Gravado automaticamente — toca para gravar o ficheiro já'):(en?'Saved':'Gravado');}
  b.className='tb-saved'+(cls?' '+cls:'');tx.textContent=txt;b.title=tip;b.setAttribute('aria-label',tip);
}
function avSaveClick(){clearTimeout(_avAsT);saveFile();}
(function(){
  if(typeof markUnsaved==='function'){const mu=markUnsaved;markUnsaved=function(){const r=mu.apply(this,arguments);if(!presentationMode){avSeq++;avRenderSaveState();avScheduleAutoSave();}return r;};}
  if(typeof markSaved==='function'){const ms=markSaved;markSaved=function(){const r=ms.apply(this,arguments);avRenderSaveState();setTimeout(()=>{try{avOnboardRender();}catch(e){}},50);return r;};}
})();

/* ── modo simples / completo ── */
function avMode(){try{return localStorage.getItem('av_mode')==='simple'?'simple':'full';}catch(e){return 'full';}}
function avApplyMode(){
  const simple=avMode()==='simple';document.body.classList.toggle('av-simple',simple);
  const subs=document.getElementById('dash-subs-section');if(subs)subs.classList.toggle('av-empty',!(typeof subscriptions!=='undefined'&&subscriptions.length));
  if(simple&&typeof groupOfTab==='function'&&['bens','archive'].includes(groupOfTab(avCurTab))&&typeof switchTab==='function')switchTab('dashboard');
}
function avSetMode(m){try{localStorage.setItem('av_mode',m==='simple'?'simple':'full');}catch(e){}avApplyMode();avRenderSettings();try{renderDashboard();}catch(e){}toast(m==='simple'?(avEn()?'Simple mode — only the essentials.':'Modo Simples — só o essencial.'):(avEn()?'Complete mode — every feature visible.':'Modo Completo — todas as funções à vista.'));}
function avRenderSettings(){
  const en=avEn(),s=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};
  s('s-use-title',en?'🧭 Usage':'🧭 Utilização');
  s('s-autosave-lbl',en?'Autosave':'Gravação automática');
  s('s-autosave-desc',en?'Saves by itself after every change — to the file (once it has permission) and to Drive.':'Grava sozinha depois de cada alteração — no ficheiro (se já tiver autorização) e no Drive.');
  s('s-autosave-btn',autoSaveOn()?(en?'On':'Ligada'):(en?'Off':'Desligada'));
  s('s-mode-lbl',en?'App mode':'Modo da app');
  s('s-mode-desc',en?'Simple: just the essentials. Complete: every feature (assets, archive, reports…).':'Simples: só o essencial. Completo: todas as funções (bens, arquivo, relatórios…).');
  s('s-mode-simple',en?'Simple':'Simples');s('s-mode-full',en?'Complete':'Completo');
  s('s-lockhide-lbl',en?'When you leave the app (background), lock:':'Ao sair da app (segundo plano), bloquear:');s('bg-0',en?'Now':'Logo');s('bg--1',en?'∞ Never':'∞ Nunca');
  s('s-bglock-hint',en?'Gives you time to copy a password and paste it in another app. After that it asks for your fingerprint / PIN.':'Dá-te tempo para copiares uma password e colares noutra app. Depois disso, pede a impressão digital / PIN.');
  s('s-idlelock-lbl',en?'Without using the app, lock after:':'Sem mexer na app, bloquear depois de:');
  [0,15,60,300,-1].forEach(v=>{const b=document.getElementById('bg-'+v);if(b)b.classList.toggle('active',avBgLockSecs()===v);});
  s('s-nudge-lbl',en?'Aurora suggestions':'Sugestões da Aurora');s('s-nudge-desc',en?'Small tips after you save (e.g. store the 2FA code, read an expiry date from a photo).':'Pequenas sugestões depois de gravares (ex.: guardar o código 2FA, ler a validade de uma foto).');
  s('s-nudge-on',en?'On':'Ligadas');s('s-nudge-off',en?'Off':'Desligadas');
  {const a=document.getElementById('s-nudge-on'),b=document.getElementById('s-nudge-off');if(a)a.classList.toggle('on',avNudgesOn());if(b)b.classList.toggle('on',!avNudgesOn());}
  s('s-sw-lbl',en?'Tab transitions':'Transições entre abas');s('s-sw-desc',en?'When you swipe sideways, on the phone.':'Ao deslizar o dedo para o lado, no telemóvel.');
  s('s-sw-parallax','Parallax');s('s-sw-stack',en?'Stacked cards':'Cartões em pilha');s('s-sw-reveal',en?'Aurora reveal':'Revelação Aurora');s('s-sw-fade',en?'Soft slide':'Deslize suave');s('s-sw-off',en?'Off':'Desligado');
  ['parallax','stack','reveal','fade','off'].forEach(k=>{const b=document.getElementById('s-sw-'+k);if(b)b.classList.toggle('on',avSwStyle()===k);});
  {const rm=document.getElementById('s-sw-rm'),red=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);if(rm){rm.style.display=red?'block':'none';rm.textContent=en?'⚠ Your phone has «Remove animations» turned on — transitions stay off (Accessibility settings).':'⚠ O teu telemóvel tem «Remover animações» ligado — as transições ficam desligadas (Definições do telemóvel → Acessibilidade).';}}
  s('s-auto-lbl',en?'Automatic theme':'Tema automático');s('s-auto-desc',en?'Follows your phone or computer light/dark mode: your dark theme at night, your light theme by day.':'Segue o modo claro/escuro do telemóvel ou computador: usa o teu tema escuro à noite e o teu tema claro de dia.');
  s('s-auto-on',en?'On':'Ligado');s('s-auto-off',en?'Off':'Desligado');
  {const a=document.getElementById('s-auto-on'),b=document.getElementById('s-auto-off');if(a)a.classList.toggle('on',avThemeAuto());if(b)b.classList.toggle('on',!avThemeAuto());}
  const bkr=document.getElementById('s-bk-row');if(bkr){bkr.style.display=FSA_OK?'none':'';
    s('s-bk-lbl',en?'Automatic copy to Downloads':'Cópia automática para as Transferências');
    s('s-bk-desc',en?'This browser keeps the vault inside the app. For safety, an encrypted copy is saved to Downloads — only when something changed. You can delete older copies; the newest is enough.':'Este browser guarda o cofre na app. Por segurança, é feita uma cópia encriptada nas Transferências — só quando há alterações. Podes apagar as cópias antigas; basta a mais recente.');
    s('s-bk-weekly',en?'Weekly':'Semanal');s('s-bk-daily',en?'Daily':'Diária');s('s-bk-off',en?'Off':'Desligada');
    ['weekly','daily','off'].forEach(k=>{const b=document.getElementById('s-bk-'+k);if(b)b.classList.toggle('on',avBackupFreq()===k);});}
  const a=document.getElementById('s-mode-simple'),b=document.getElementById('s-mode-full');
  if(a)a.classList.toggle('on',avMode()==='simple');if(b)b.classList.toggle('on',avMode()==='full');
}
function avMoreTop(item,I,en){
  if(!avIsDesk())return item('avAddMenu()',I('<path d="M12 5v14M5 12h14"/>'),en?'Add…':'Adicionar…',en?'Choose what to add':'Escolher o que adicionar');
  const on=typeof privacyOn!=='undefined'&&privacyOn;
  return item('togglePrivacy()',I(on?'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>':'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),on?(en?'Privacy mode · on':'Modo privado · ligado'):(en?'Privacy mode':'Modo de privacidade'),'');
}
function avMoreMid(item,I,en){
  let h=item('saveFile()',I('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),FSA_OK?(en?'Save file now':'Guardar ficheiro agora'):(en?'Save now':'Guardar agora'),autoSaveOn()?(en?'Autosave is on':'Gravação automática ligada'):'');
  if(!FSA_OK)h+=item('avExportVault()',I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),en?'Export a copy (.vault)':'Exportar cópia do cofre (.vault)',en?'Keep it somewhere safe':'Guarda-a num sítio seguro');
  if(avMode()==='simple')h+=item("switchGroup('archive')",I('<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>'),en?'Archive & trash':'Arquivo e reciclagem','');
  return h;
}

/* ── primeiros passos (cofres novos) ── */
async function avOnbSteps(){
  let quick=false;
  try{quick=!!(await getPinRec());}catch(e){}
  if(!quick){try{quick=!!(await idbGet('qu_bio'));}catch(e){}}
  let bk=false;try{bk=(typeof driveOn==='function'&&driveOn())||!!localStorage.getItem('cv_lastbk')||localStorage.getItem('av_bk_done')==='1';}catch(e){}
  const V=typeof vault!=='undefined'?vault:[];
  return [
    {k:'create',done:true,t:['Criar o teu cofre','Create your vault']},
    {k:'pw',done:V.length>0,t:['Guardar a primeira password','Store your first password'],d:['Por exemplo, a do teu email. Demora 30 segundos.','For example, your email. Takes 30 seconds.'],b:['Adicionar','Add'],fn:"avAddType('password')"},
    {k:'quick',done:quick,t:['Entrar com PIN ou impressão digital','Unlock with PIN or fingerprint'],d:['Para não teres de escrever a palavra-passe mestra sempre.','So you don’t have to type the master password every time.'],b:['Configurar','Set up'],fn:"openSettingsTab('seguranca')"},
    {k:'bk',done:bk,t:['Guardar uma cópia de segurança','Make a backup copy'],d:['Se perderes o telemóvel, não perdes nada.','If you lose your phone, you lose nothing.'],b:['Fazer cópia','Back up'],fn:'avOnbBackup()'},
    {k:'imp',opt:true,done:localStorage.getItem('av_imp_done')==='1',t:['Trazer as passwords do Chrome','Bring your passwords from Chrome'],d:['Importa tudo de uma vez em vez de escrever.','Import everything at once instead of typing.'],b:['Importar','Import'],fn:"openSettingsTab('dados')"}
  ];
}
function avOnbBackup(){try{downloadBackupNow();localStorage.setItem('av_bk_done','1');}catch(e){}setTimeout(()=>{try{avOnboardRender();}catch(e){}},600);}
function avOnbHide(){try{localStorage.setItem('av_onb_hide','1');}catch(e){}const b=document.getElementById('av-onboard');if(b)b.remove();}
let _avOnbRun=0;
async function avOnboardRender(){
  const run=++_avOnbRun;
  const host=document.getElementById('dash-greeting');
  let box=document.getElementById('av-onboard');
  if(!host||typeof masterKey==='undefined'||!masterKey||presentationMode||localStorage.getItem('av_onb_hide')==='1'){if(box)box.remove();return;}
  const st=await avOnbSteps();if(run!==_avOnbRun)return;
  const req=st.filter(s=>!s.opt),done=req.filter(s=>s.done).length;
  if(done===req.length){if(box)box.remove();return;}
  if(!box){box=document.createElement('div');box.id='av-onboard';box.className='av-onb';}
  if(box.previousElementSibling!==host)host.insertAdjacentElement('afterend',box);
  const en=avEn(),nextK=(st.find(s=>!s.done&&!s.opt)||{}).k;let n=0;
  if(avMode()==='simple')avTourOffer();
  box.innerHTML='<div class="av-onb-h"><h3>'+(en?'First steps':'Primeiros passos')+'</h3><span><button data-act="avTourStart" style="color:var(--accent-ink);margin-right:10px">🎓 '+(en?'Guided tour':'Ver apresentação')+'</button><button data-act="avOnbHide">'+(en?'Hide':'Esconder')+'</button></span></div>'
   +'<p class="av-onb-lead">'+(en?'A few quick steps and your vault is ready to use.':'Uns passos rápidos e o teu cofre fica pronto a usar.')+'</p>'
   +'<div class="av-onb-bar"><i style="width:'+Math.round(done/req.length*100)+'%"></i></div><div class="av-onb-prog">'+done+(en?' of ':' de ')+req.length+(en?' done':' concluídos')+'</div>'
   +st.map(s=>{if(!s.opt)n++;return '<div class="av-step'+(s.done?' done':'')+(s.k===nextK?' next':'')+'"><div class="dot">'+(s.done?'✓':(s.opt?'＋':n))+'</div><div><div class="st">'+avT(s.t)+(s.opt?'<span class="av-opt">'+(en?'optional':'opcional')+'</span>':'')+'</div>'+(s.done||!s.d?'':'<div class="sd">'+avT(s.d)+'</div>')+'</div>'+(s.done||!s.fn?'':'<button class="sb" '+avActAttrs(s.fn)+'>'+avT(s.b)+'</button>')+'</div>';}).join('')
   +'<div class="av-tip" data-act="auroraOpenSafe">💡 '+(en?'Not sure where to start? Tell Aurora, for example: <b>"save my Gmail password"</b> — she does the rest.':'Não sabes por onde começar? Escreve à Aurora, por exemplo: <b>"guarda a password do Gmail"</b> — ela trata do resto.')+'</div>';
}

/* ── ligações à app existente ── */
(function(){
  if(typeof switchTab==='function'){const st=switchTab;switchTab=function(t){const r=st.apply(this,arguments);avCurTab=t;avAddLabel();return r;};}
  if(typeof renderGreeting==='function'){const rg=renderGreeting;renderGreeting=function(){const r=rg.apply(this,arguments);try{avApplyMode();avOnboardRender();}catch(e){}return r;};}
  if(typeof setLang==='function'){const sl=setLang;setLang=function(){const r=sl.apply(this,arguments);try{avAddLabel();avRenderSaveState();avRenderSettings();avOnboardRender();avEnhanceEmpty();}catch(e){}return r;};}
  if(typeof openSettings==='function'){const os=openSettings;openSettings=function(){const r=os.apply(this,arguments);try{avRenderSettings();}catch(e){}return r;};}
  if(typeof importCSV==='function'){const ic=importCSV;importCSV=function(){try{localStorage.setItem('av_imp_done','1');}catch(e){}return ic.apply(this,arguments);};}
  const fab=document.createElement('button');fab.id='av-fab-add';fab.type='button';fab.textContent='＋';fab.setAttribute('aria-label','Adicionar');let _lp=0,_lpDone=false;fab.addEventListener('pointerdown',()=>{_lpDone=false;clearTimeout(_lp);_lp=setTimeout(()=>{_lpDone=true;avAddMenu();try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}},550);});['pointerup','pointerleave','pointercancel'].forEach(ev=>fab.addEventListener(ev,()=>clearTimeout(_lp)));fab.onclick=e=>{if(_lpDone){_lpDone=false;e.stopPropagation();return;}avAddMain(e);};fab.oncontextmenu=e=>e.preventDefault();document.body.appendChild(fab);
  setInterval(()=>{const on=typeof masterKey!=='undefined'&&!!masterKey&&!presentationMode&&document.getElementById('app')&&document.getElementById('app').classList.contains('visible');document.body.classList.toggle('av-app-on',!!on);},800);
  avAddLabel();avRenderSaveState();avApplyMode();avRenderSettings();
})();


/* ══ v9.70 — PARTILHAR → AURORA VAULT · LER CÓDIGO DE BARRAS · LER VALIDADE (OCR) ══ */
async function avSharePurgeOld(){
  try{const c=await caches.open('av-share');const mr=await c.match('./__share/meta');if(!mr)return;
    let at=0;try{at=(await mr.json()).at||0;}catch(e){}
    if(Date.now()-at>3600000)for(const k of await c.keys())await c.delete(k);}catch(e){}
}
if(typeof caches!=='undefined')avSharePurgeOld();
async function avShareImport(){
  const en=avEn();let c;
  try{c=await caches.open('av-share');}catch(e){return;}
  const mr=await c.match('./__share/meta');
  try{history.replaceState(null,'',location.pathname);}catch(e){}
  if(!mr)return;
  let meta=null;try{meta=await mr.json();}catch(e){}
  const files=[];
  if(meta&&Array.isArray(meta.files))for(const f of meta.files){try{const r=await c.match(f.key);if(r){const bl=await r.blob();files.push(new File([bl],f.name||'ficheiro',{type:f.type||bl.type||''}));}}catch(e){}}
  try{for(const k of await c.keys())await c.delete(k);}catch(e){}
  if(files.length){
    const made=[];
    for(const f of files){
      const data=await new Promise(res=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.onerror=()=>res(null);rd.readAsDataURL(f);});if(!data)continue;
      const d={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:(f.name||'').replace(/\.[^.]+$/,'')||(en?'Shared document':'Documento partilhado'),cat:'outro',date:'',expiry:'',desc:((meta&&meta.text)||'').slice(0,500),folderId:null,file:{name:f.name,size:f.size,type:f.type,data},createdAt:Date.now()};
      documents.push(d);made.push(d);
    }
    if(!made.length)return;
    try{logActivity('add',made.map(d=>d.title).join(', '),'📥');}catch(e){}
    markUnsaved();renderAll();switchTab('docs');
    setTimeout(()=>{try{openDocModal(made[0].id);}catch(e){}},300);
    toast(made.length===1?(en?'📥 Shared file saved in Documents — check the name and expiry.':'📥 Ficheiro partilhado guardado em Documentos — confirma o nome e a validade.'):(en?`📥 ${made.length} shared files saved in Documents.`:`📥 ${made.length} ficheiros partilhados guardados em Documentos.`));
  }else if(meta&&(meta.text||meta.url)){
    switchTab('notes');newNote();
    const n=notes.find(x=>x.id===editingNoteId);
    if(n){n.title=(meta.title||(en?'Shared':'Partilhado')).slice(0,80);n.body=[meta.text,meta.url].filter(Boolean).join('\n');try{showNoteEditor(n);renderNotesList();}catch(e){}}
    markUnsaved();toast(en?'📥 Shared text saved as a note.':'📥 Texto partilhado guardado numa nota.');
  }
}

/* ── ④ ler o código de barras do cartão de loja ── */
let _avScan=null;
function avScanClose(){
  const s=_avScan;_avScan=null;
  if(s){s.stop=true;try{s.stream.getTracks().forEach(t=>t.stop());}catch(e){}}
  const o=document.getElementById('av-scan');if(o)o.remove();
}
async function avScanStore(){
  const en=avEn();
  if(!('BarcodeDetector' in window)){toast(en?'This browser can’t read barcodes — type the number.':'Este browser não lê códigos de barras — escreve o número.');return;}
  const want=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar','qr_code','data_matrix','pdf417','aztec'];
  let formats=want;try{const sup=await BarcodeDetector.getSupportedFormats();formats=want.filter(f=>sup.includes(f));}catch(e){}
  let det;try{det=new BarcodeDetector({formats});}catch(e){toast(en?'Barcode reading unavailable.':'Leitura de códigos indisponível.');return;}
  const o=document.createElement('div');o.id='av-scan';
  o.style.cssText='position:fixed;inset:0;z-index:400;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center';
  o.innerHTML='<video playsinline muted style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;left:8%;right:8%;top:38%;height:24%;border:2px solid rgba(201,168,76,.9);border-radius:14px;box-shadow:0 0 0 9999px rgba(0,0,0,.45)"></div><div style="position:absolute;top:calc(env(safe-area-inset-top,0px) + 18px);left:0;right:0;text-align:center;color:#fff;font:600 .9rem system-ui;text-shadow:0 1px 6px #000">'+(en?'Point the camera at the card’s barcode':'Aponta a câmara ao código de barras do cartão')+'</div><button type="button" data-act="avScanClose" style="position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 26px);padding:12px 26px;border-radius:30px;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.55);color:#fff;font:600 .9rem system-ui">'+(en?'Cancel':'Cancelar')+'</button>';
  document.body.appendChild(o);
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});}
  catch(e){avScanClose();toast(en?'Camera not allowed — you can type the number.':'Sem autorização da câmara — podes escrever o número.');return;}
  const v=o.querySelector('video');v.srcObject=stream;try{await v.play();}catch(e){}
  _avScan={stream,stop:false};const me=_avScan;
  const tick=async()=>{
    if(me.stop)return;
    try{const r=await det.detect(v);if(r&&r.length&&r[0].rawValue){avScanFill(r[0].rawValue);return;}}catch(e){}
    setTimeout(tick,180);
  };
  tick();
}
function avScanFill(raw){
  avScanClose();
  const en=avEn(),val=String(raw).trim(),inp=document.getElementById('sc-number');
  if(inp){inp.value=/^[\d\s-]+$/.test(val)?val.replace(/[\s-]/g,''):val;inp.dispatchEvent(new Event('input',{bubbles:true}));}
  try{navigator.vibrate&&navigator.vibrate(60);}catch(e){}
  toast((en?'✓ Code read: ':'✓ Código lido: ')+val);
}
(function(){
  if(typeof openStoreModal!=='function')return;
  const osm=openStoreModal;
  openStoreModal=function(){const r=osm.apply(this,arguments);const b=document.getElementById('sc-scan-btn');if(b){b.style.display=('BarcodeDetector' in window)?'block':'none';b.textContent=avEn()?'📷 Scan with the camera':'📷 Ler com a câmara';}return r;};
})();

/* ── ⑤ ler a validade de uma foto (OCR local, motor descarregado 1× e guardado offline) ──
   Leitor, motor e dicionários (português e inglês) vêm deste site (vendor/), nunca de servidores de terceiros:
   é código que corre com o cofre aberto, por isso tem de ser exatamente a versão testada. */
const AV_OCR_DIR='vendor/tesseract-5.1.1/';
const AV_OCR_URL=AV_OCR_DIR+'tesseract.min.js';
function avWasmSimd(){try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));}catch(e){return false;}}
async function avOcrWorker(logger){
  const T=await avLoadTesseract(),base=new URL(AV_OCR_DIR,location.href).href;
  return T.createWorker(['por','eng'],1,{
    workerPath:base+'worker.min.js',workerBlobURL:false,
    corePath:base+(avWasmSimd()?'tesseract-core-simd-lstm.js':'tesseract-core-lstm.js'),
    langPath:base.replace(/\/$/,''),gzip:true,
    ...(logger?{logger}:{})
  });
}
let _avTess=null;
function avLoadTesseract(){
  if(window.Tesseract)return Promise.resolve(window.Tesseract);
  if(_avTess)return _avTess;
  _avTess=new Promise((res,rej)=>{const s=document.createElement('script');s.src=AV_OCR_URL;s.async=true;s.onload=()=>window.Tesseract?res(window.Tesseract):rej(new Error('load'));s.onerror=()=>{_avTess=null;s.remove();rej(new Error('load'));};document.head.appendChild(s);});
  return _avTess;
}
const AV_MON={jan:1,fev:2,feb:2,mar:3,abr:4,apr:4,mai:5,may:5,jun:6,jul:7,ago:8,aug:8,set:9,sep:9,out:10,oct:10,nov:11,dez:12,dec:12};
function avFindExpiry(text){
  if(!text)return null;
  const t=String(text).replace(/(?<=\d)[oO]|[oO](?=\d)/g,'0').replace(/(?<=\d)[lI|]|[lI|](?=\d)/g,'1');
  const lines=t.split(/\r?\n/),today=new Date();today.setHours(0,0,0,0);
  const KEY=/(v[aá]lid|validade|expir|until|at[eé]\b|date of expiry|expiry|4\s?b\b|caduc)/i,BAD=/(nasc|birth|emiss|issue|emitid|4\s?a\b|\b3\b)/i;
  const out=[];
  const push=(d,m,y,li)=>{y=+y;if(y<100)y+=2000;d=+d;m=+m;if(m<1||m>12||d<1||d>31||y<1990||y>2099)return;const dt=new Date(y,m-1,d);if(dt.getMonth()!==m-1)return;
    const ctx=(lines[li]||'')+' '+(lines[li-1]||'');let s=0;if(KEY.test(ctx))s+=3;if(BAD.test(lines[li]||''))s-=3;if(dt>=today)s+=1;else s-=2;out.push({dt,s});};
  lines.forEach((ln,i)=>{
    let m;const re=/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})(?!\d)/g;
    while((m=re.exec(ln)))push(m[1],m[2],m[3],i);
    const re2=/(?<!\d)(\d{2})\s(\d{2})\s(\d{4})(?!\d)/g;while((m=re2.exec(ln)))push(m[1],m[2],m[3],i);
    const re3=/(\d{1,2})\s*([A-Za-zÀ-ú]{3})[A-Za-zÀ-ú\/]*\s*(\d{4}|\d{2})(?!\d)/g;
    while((m=re3.exec(ln))){const mo=AV_MON[m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')];if(mo)push(m[1],mo,m[3],i);}
  });
  if(!out.length)return null;
  out.sort((a,b)=>b.s-a.s||b.dt-a.dt);
  const d=out[0].dt,z=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
}
async function avOcrDoc(){
  const en=avEn(),btn=document.getElementById('doc-ocr-btn'),st=document.getElementById('doc-ocr-status');
  const f=typeof pendingDocFile!=='undefined'?pendingDocFile:null;
  if(!f||!/^image\//.test(f.type||'')||!f.data){toast(en?'Attach a photo of the document first (JPG/PNG).':'Junta primeiro uma foto do documento (JPG/PNG).');return;}
  const say=m=>{if(st){st.style.display='block';st.textContent=m;}};
  if(btn)btn.disabled=true;
  say(en?'Preparing the reader… (the first time it downloads ~7 MB; after that it works offline)':'A preparar o leitor… (na 1.ª vez descarrega ~7 MB; depois funciona sem internet)');
  let worker=null;
  try{
    worker=await avOcrWorker(m=>{if(m&&m.status==='recognizing text')say((en?'Reading… ':'A ler… ')+Math.round((m.progress||0)*100)+'%');});
    say(en?'Reading the photo…':'A ler a foto…');
    const res=await worker.recognize(f.data);
    const d=avFindExpiry(res&&res.data&&res.data.text);
    if(d){const inp=document.getElementById('doc-expiry');if(inp)inp.value=d;const p=d.split('-');say((en?'✓ Expiry found: ':'✓ Validade encontrada: ')+p[2]+'/'+p[1]+'/'+p[0]+(en?' — check it before saving.':' — confirma antes de gravar.'));}
    else say(en?'I couldn’t find an expiry date in this photo — fill it in by hand.':'Não encontrei uma data de validade nesta foto — preenche à mão.');
  }catch(e){
    say(e&&e.message==='load'?(en?'No Internet: the reader must be downloaded once (about 10 MB).':'Sem internet: o leitor tem de ser descarregado uma vez (cerca de 10 MB).'):(en?'Couldn’t read the photo.':'Não consegui ler a foto.'));
  }finally{if(worker){try{await worker.terminate();}catch(e){}}if(btn)btn.disabled=false;}
}
(function(){
  if(typeof openDocModal!=='function')return;
  const odm=openDocModal;
  openDocModal=function(){const r=odm.apply(this,arguments);const b=document.getElementById('doc-ocr-btn'),s=document.getElementById('doc-ocr-status');if(b)b.textContent=avEn()?'🔍 Read the expiry from the photo':'🔍 Ler a validade da foto';if(s){s.style.display='none';s.textContent='';}return r;};
})();


/* ══ v9.72 — passwords fora do HTML dos botões · lista de passwords desenhada em lotes ══ */
function avEntry(id){return (typeof vault!=='undefined'?vault:[]).find(x=>x.id===id);}
function avCopyPw(id){const e=avEntry(id);if(e&&e.pw)copyText(e.pw,t('pwCopied'));}
function avGoSite(id){const e=avEntry(id);if(e&&e.url)goToSiteEntry(e.url,e.pw);}
function avReadTogglePw(id){const e=avEntry(id),el=document.getElementById('read-pw');if(!e||!el)return;el.textContent=el.classList.contains('masked')?e.pw:'••••••••••••';el.classList.toggle('masked');}
let _avChunk={tok:0,grid:null,arr:null,i:0};
function avChunkRender(grid,head,arr){
  const tok=++_avChunk.tok,FIRST=40,STEP=60;
  _avChunk.grid=grid;_avChunk.arr=arr;_avChunk.i=Math.min(FIRST,arr.length);
  grid.innerHTML=head+arr.slice(0,_avChunk.i).join('');
  const next=()=>{
    if(tok!==_avChunk.tok||_avChunk.i>=arr.length)return;
    grid.insertAdjacentHTML('beforeend',arr.slice(_avChunk.i,_avChunk.i+STEP).join(''));_avChunk.i+=STEP;
    if(_avChunk.i<arr.length)(window.requestIdleCallback?requestIdleCallback(next,{timeout:100}):setTimeout(next,16));
  };
  if(_avChunk.i<arr.length)setTimeout(next,0);
}
function avFlushChunks(){const c=_avChunk;if(c.grid&&c.arr&&c.i<c.arr.length){c.grid.insertAdjacentHTML('beforeend',c.arr.slice(c.i).join(''));c.i=c.arr.length;}}


/* ── abas vazias: botão para começar (só aparece quando a aba não tem nada) ── */
function avEnhanceEmpty(forTab){
  const T=forTab||avCurTab;
  const k=AV_TAB_ADD[T],t=k&&avFind(k);
  const tab=document.getElementById('tab-'+T);if(!tab)return;
  tab.querySelectorAll('.av-empty-cta').forEach(b=>{const br=b.previousElementSibling;if(br&&br.tagName==='BR')br.remove();b.remove();});
  const en=avEn(),desk=avIsDesk();
  // Notas: a mensagem é o espaço «nenhuma nota aberta» — com notas, não precisa de dica nem de botão
  if(T==='notes'){
    const txt=document.getElementById('notes-empty-txt'),has=typeof notes!=='undefined'&&notes.some(n=>!n.archived);
    if(txt)txt.textContent=has?(en?'Select a note':'Seleciona uma nota'):(en?'No notes yet':'Ainda não tens notas');
    const ne=document.getElementById('notes-empty');if(ne){let hint=ne.querySelector('.av-empty-hint');if(has){if(hint)hint.remove();}else{if(!hint){hint=document.createElement('div');hint.className='av-empty-hint';ne.appendChild(hint);}hint.textContent=avHintText(t,en,desk);}}
    return;
  }
  if(!t)return;
  tab.querySelectorAll('.empty-state,.av-empty').forEach(es=>{
    if(/＋/.test(es.textContent.replace((es.querySelector('.av-empty-hint')||{}).textContent||'','')))return; // já aponta para o ＋
    let hint=es.querySelector('.av-empty-hint');
    if(!hint){hint=document.createElement('div');hint.className='av-empty-hint';es.appendChild(hint);}
    hint.textContent=avHintText(t,en,desk);
  });
}
function avHintText(t,en,desk){
  const lbl=t?avT(t.n):(en?'Add':'Adicionar');
  return desk?(en?'↗ Tap “＋ '+lbl+'” at the top to get started.':'↗ Toca em «＋ '+lbl+'», em cima, para começar.'):(en?'↘ Tap the ＋ at the bottom right to get started.':'↘ Toca no ＋ em baixo, à direita, para começar.');
}
(function(){
  if(typeof switchTab==='function'){const st=switchTab;switchTab=function(){const r=st.apply(this,arguments);requestAnimationFrame(()=>{try{avEnhanceEmpty();}catch(e){}});return r;};}
  if(typeof renderAll==='function'){const ra=renderAll;renderAll=function(){const r=ra.apply(this,arguments);requestAnimationFrame(()=>{try{avEnhanceEmpty();}catch(e){}});return r;};}
})();


/* ══ v9.74 — APRESENTAÇÃO ANIMADA DA AURORA (tutorial em 8 passos) ══ */
const AV_TOUR=[
 {k:'hello',t:['Olá! Sou a Aurora ✨','Hi! I’m Aurora ✨'],d:['Este é o teu cofre: tudo o que guardas aqui fica encriptado e só tu o consegues abrir. Vou mostrar-te o essencial em 8 passos — demora 2 minutos.','This is your vault: everything you store here is encrypted and only you can open it. I’ll show you the essentials in 8 steps — it takes 2 minutes.']},
 {k:'search',el:()=>avIsDesk()?document.getElementById('search-input'):document.getElementById('tb-search-btn'),t:['Pesquisa tudo','Search everything'],d:['Passwords, documentos, cartões, notas… escreve e encontras em segundos.','Passwords, documents, cards, notes… type and find it in seconds.']},
 {k:'add',el:()=>avIsDesk()?document.getElementById('tb-add'):document.getElementById('av-fab-add'),t:['Tudo começa aqui: ＋ Adicionar','Everything starts here: ＋ Add'],d:['Passwords, cartões, documentos, notas, códigos 2FA… Em cada aba, este botão já sabe o que queres criar.','Passwords, cards, documents, notes, 2FA codes… In each tab this button already knows what you want to create.'],task:['Toca no ＋ e guarda a tua primeira password. Eu espero ✨','Tap ＋ and save your first password. I’ll wait ✨'],go:()=>avAddType('password'),check:s=>(typeof vault!=='undefined'?vault.length:0)>s.v0},
 {k:'tabs',el:()=>{const g=document.getElementById('grp-btn-dashboard');return g&&g.parentElement;},t:['As tuas áreas','Your areas'],d:['Cofre (passwords e 2FA), Cartões (bancários e de loja), Documentos (e notas)… Toca numa para a abrir.','Vault (passwords and 2FA), Cards (bank and store), Documents (and notes)… Tap one to open it.']},
 {k:'saved',el:()=>document.getElementById('tb-save-state'),t:['Grava sozinho','Saves by itself'],d:['Cada alteração fica gravada automaticamente — e, se ligares o Google Drive, sincronizada com os teus outros dispositivos.','Every change is saved automatically — and, if you connect Google Drive, synced with your other devices.']},
 {k:'aurora',el:()=>{const l=document.querySelector('.aur-launch');return avtVisible(l)?l:document.getElementById('aurora-fab');},t:['Fala comigo','Talk to me'],d:['Pede-me coisas por palavras: «qual o meu NIF?», «o que expira este mês?». E carrega ficheiros com o 📎 — eu arrumo-os onde disseres.','Ask me things in plain words: “what’s my tax number?”, “what expires this month?”. And upload files with the 📎 — I’ll put them where you say.']},
 {k:'more',el:()=>document.getElementById('tb-more-btn'),t:['Mais opções','More options'],d:['Definições, modo de privacidade, calendário e idioma estão aqui.','Settings, privacy mode, calendar and language live here.']},
 {k:'lock',el:()=>document.querySelector('.topbar-actions .tb-lock-btn'),t:['Bloquear','Lock'],d:['Quando terminares, bloqueia. Para entrares mais depressa, ativa o PIN ou a impressão digital em Definições → Segurança.','When you’re done, lock it. To get in faster, turn on PIN or fingerprint in Settings → Security.']}
];
const AVT={on:false,i:0,st:{},typ:0,poll:0,paused:false};
function avtReduce(){return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function avTourStart(){
  if(typeof masterKey==='undefined'||!masterKey)return;
  try{if(typeof aurClose==='function')aurClose(true);}catch(e){}
  try{avAddClose();tbCloseMore&&tbCloseMore();}catch(e){}
  document.querySelectorAll('.modal-overlay.open,[id$="-overlay"].open').forEach(o=>o.classList.remove('open'));
  try{if(avCurTab!=='dashboard')switchTab('dashboard');}catch(e){}
  window.scrollTo({top:0});
  let r=document.getElementById('avt-root');
  if(!r){r=document.createElement('div');r.id='avt-root';r.innerHTML='<div class="avt-block"></div><div class="avt-block"></div><div class="avt-block"></div><div class="avt-block"></div><div id="avt-spot" class="center"><i></i></div><div id="avt-bub" role="dialog" aria-live="polite"></div>';document.body.appendChild(r);}
  AVT.on=true;AVT.i=0;AVT.st={v0:typeof vault!=='undefined'?vault.length:0};AVT.paused=false;r.classList.remove('paused');
  try{localStorage.setItem('av_tour_offered','1');}catch(e){}
  document.addEventListener('keydown',avtKey,true);window.addEventListener('resize',avtPlace);
  clearInterval(AVT.poll);AVT.poll=setInterval(avtTick,450);
  avtRender();
}
function avtKey(e){if(!AVT.on||AVT.paused)return;if(e.key==='Escape'){e.preventDefault();avTourEnd();}else if(e.key==='ArrowRight'||e.key==='Enter'){if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;e.preventDefault();avtNext();}else if(e.key==='ArrowLeft'){e.preventDefault();avtPrev();}}
function avtVisible(el){if(!el)return false;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;}
function avtTarget(){const s=AV_TOUR[AVT.i];if(!s||!s.el)return null;const el=s.el();if(!avtVisible(el))return null;return el.getBoundingClientRect();}
function avtPlace(){
  if(!AVT.on)return;
  const spot=document.getElementById('avt-spot'),bub=document.getElementById('avt-bub'),bl=document.querySelectorAll('#avt-root .avt-block');if(!spot||!bub)return;
  const W=innerWidth,H=innerHeight,r=avtTarget(),p=8;
  let sx,sy,sw,sh;
  if(r){sx=r.left-p;sy=r.top-p;sw=r.width+2*p;sh=r.height+2*p;spot.classList.remove('center');}
  else{sx=W/2;sy=H/2;sw=0;sh=0;spot.classList.add('center');}
  Object.assign(spot.style,{left:sx+'px',top:sy+'px',width:sw+'px',height:sh+'px'});
  // bloqueia cliques fora do foco (o elemento em foco continua clicável)
  const box=[[0,0,W,Math.max(0,sy)],[0,sy+sh,W,Math.max(0,H-sy-sh)],[0,sy,Math.max(0,sx),sh],[sx+sw,sy,Math.max(0,W-sx-sw),sh]];
  bl.forEach((b,i)=>{const q=box[i];Object.assign(b.style,{left:q[0]+'px',top:q[1]+'px',width:q[2]+'px',height:q[3]+'px'});});
  const bw=bub.offsetWidth||370,bh=bub.offsetHeight||200;let bx,by;
  if(!r){bx=(W-bw)/2;by=(H-bh)/2;}
  else{
    bx=Math.min(W-bw-14,Math.max(14,r.left+r.width/2-bw/2));
    if(r.bottom+22+bh<H)by=r.bottom+22;else if(r.top-22-bh>0)by=r.top-22-bh;else{by=Math.max(14,(H-bh)/2);bx=r.left>W/2?Math.max(14,r.left-bw-24):Math.min(W-bw-14,r.right+24);}
  }
  Object.assign(bub.style,{left:Math.round(bx)+'px',top:Math.round(by)+'px'});
}
function avtRender(){
  const s=AV_TOUR[AVT.i],bub=document.getElementById('avt-bub');if(!s||!bub)return;
  const en=avEn(),last=AVT.i===AV_TOUR.length-1,done=s.check&&s.check(AVT.st);
  bub.classList.remove('show');
  bub.innerHTML='<div class="avt-h"><i>✨</i>Aurora · '+(en?'step ':'passo ')+(AVT.i+1)+(en?' of ':' de ')+AV_TOUR.length+'</div><div class="avt-t">'+avT(s.t)+'</div><div class="avt-d" id="avt-d"></div>'
   +(s.task&&!done?'<div class="avt-task">👉 '+avT(s.task)+'</div>':'')
   +'<div class="avt-f"><div class="avt-dots">'+AV_TOUR.map((x,i)=>'<span class="'+(i===AVT.i?'on':(i<AVT.i?'ok':''))+'"></span>').join('')+'</div>'
   +'<button class="avt-b" data-act="avTourEnd">'+(en?'Skip':'Saltar')+'</button>'
   +(s.task&&!done?'<button class="avt-b go" data-act="avtShowMe">'+(en?'Show me':'Mostra-me')+'</button>':'<button class="avt-b go" data-act="avtNext">'+(last?(en?'Finish ✨':'Terminar ✨'):(en?'Next →':'Seguinte →'))+'</button>')+'</div>';
  avtPlace();requestAnimationFrame(()=>{avtPlace();bub.classList.add('show');});
  const d=document.getElementById('avt-d'),txt=avT(s.d);clearInterval(AVT.typ);
  if(avtReduce()){d.textContent=txt;}else{let n=0;AVT.typ=setInterval(()=>{n+=3;d.textContent=txt.slice(0,n);if(n>=txt.length)clearInterval(AVT.typ);},16);}
}
function avtNext(){if(AVT.i<AV_TOUR.length-1){AVT.i++;avtRender();}else avTourFinish();}
function avtPrev(){if(AVT.i>0){AVT.i--;avtRender();}}
function avtShowMe(){const s=AV_TOUR[AVT.i];AVT.paused=true;AVT.pauseAt=Date.now();document.getElementById('avt-root').classList.add('paused');try{s.go();}catch(e){}}
function avtTick(){
  if(!AVT.on)return;
  const s=AV_TOUR[AVT.i],root=document.getElementById('avt-root');if(!root)return;
  const busy=!!document.querySelector('.modal-overlay.open,[id$="-overlay"].open,#av-add-pop.open,#note-editor.open');
  if(s&&s.check&&s.check(AVT.st)&&!busy){AVT.paused=false;root.classList.remove('paused');avtNext();return;}
  if(busy&&!AVT.paused){AVT.paused=true;AVT.pauseAt=Date.now();root.classList.add('paused');return;}
  if(!busy&&AVT.paused&&Date.now()-AVT.pauseAt>600){AVT.paused=false;root.classList.remove('paused');avtRender();return;}
  if(!AVT.paused)avtPlace();
}
function avTourFinish(){
  const en=avEn(),bub=document.getElementById('avt-bub');AVT.i=AV_TOUR.length;
  const spot=document.getElementById('avt-spot');spot.classList.add('center');
  bub.innerHTML='<div class="avt-h"><i>✨</i>Aurora</div><div class="avt-t">'+(en?'You’re ready ✨':'Estás pronto ✨')+'</div><div class="avt-d">'+(en?'That’s it! Whenever you need me, ask — or type «tutorial» to see this again.':'É isto! Sempre que precisares, pergunta-me — ou escreve «tutorial» para veres isto outra vez.')+'</div><div class="avt-f"><div class="avt-dots">'+AV_TOUR.map(()=>'<span class="ok"></span>').join('')+'</div><button class="avt-b" data-act="avTourStart">'+(en?'Again':'Repetir')+'</button><button class="avt-b go" data-act="avTourEnd">'+(en?'Done':'Terminar')+'</button></div>';
  avtPlace();
  try{localStorage.setItem('av_tour_done','1');}catch(e){}
  if(!avtReduce()){const cx=innerWidth/2,cy=innerHeight/2;for(let k=0;k<40;k++){const s=document.createElement('i');s.className='avt-star';const a=Math.random()*Math.PI*2,dist=120+Math.random()*260;s.style.left=cx+'px';s.style.top=cy+'px';s.style.setProperty('--dx',Math.cos(a)*dist+'px');s.style.setProperty('--dy',Math.sin(a)*dist+'px');s.style.animationDelay=(Math.random()*.25)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1800);}}
}
function avTourEnd(){AVT.on=false;clearInterval(AVT.poll);clearInterval(AVT.typ);document.removeEventListener('keydown',avtKey,true);window.removeEventListener('resize',avtPlace);const r=document.getElementById('avt-root');if(r)r.remove();}
function avTourOffer(){
  if(AVT.on||typeof masterKey==='undefined'||!masterKey)return;
  try{if(localStorage.getItem('av_tour_offered')==='1')return;localStorage.setItem('av_tour_offered','1');}catch(e){}
  setTimeout(()=>{try{auroraOpen();AUR.lang=aurAppLang();aurSay(aurL('✨ Olá! Queres que te mostre como funciona o cofre? Demora 2 minutos.','✨ Hi! Would you like me to show you how the vault works? It takes 2 minutes.'),[{label:aurL('Sim, mostra-me','Yes, show me'),fn:()=>avTourStart()},{label:aurL('Agora não','Not now'),fn:()=>aurSay(aurL('Ok! Quando quiseres, escreve «tutorial».','Ok! Whenever you like, type “tutorial”.'))}]);}catch(e){}},900);
}
const AV_TOUR_RX=/\b(tutorial|apresentacao|visita guiada|tour|guia rapido)\b|como funciona (a app|isto|o cofre|a aplicacao)|mostra[- ]?me como (funciona|se usa)|ensina[- ]?me|show me around|how does (this|the app|it) work/;
(function(){
  if(typeof aurHandle==='function'){const ah=aurHandle;aurHandle=function(raw){
    if(typeof avFileHandleText==='function'&&avFileHandleText(raw))return true;
    if(AV_TOUR_RX.test(aurNorm(raw||''))){const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;aurSay(aurL('Vamos a isso! ✨','Let’s go! ✨'));setTimeout(avTourStart,500);return true;}
    return ah.apply(this,arguments);};}
  if(typeof aurHelp==='function'){const hp=aurHelp;aurHelp=function(){const r=hp.apply(this,arguments);aurSay(aurL('🎓 Queres uma apresentação guiada? Escreve «tutorial». 📎 Para guardar ficheiros, usa o clipe ou arrasta-os para aqui.','🎓 Want a guided tour? Type “tutorial”. 📎 To store files, use the paperclip or drag them here.'),[{label:aurL('Ver a apresentação','Start the tour'),fn:()=>avTourStart()}]);return r;};}
})();


/* ══ v9.74 — AURORA RECEBE FICHEIROS: lê, propõe o destino, cria pastas e guarda (sempre com confirmação) ══ */
const AV_PDF_URL='vendor/pdfjs-3.11.174/pdf.min.js'; // alojado aqui (ver o OCR acima)
const AV_PDF_WORKER=new URL('vendor/pdfjs-3.11.174/pdf.worker.min.js',location.href).href;
let _avPdf=null;
function avLoadPdf(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(_avPdf)return _avPdf;
  _avPdf=new Promise((res,rej)=>{const s=document.createElement('script');s.src=AV_PDF_URL;s.async=true;s.onload=()=>{if(!window.pdfjsLib)return rej(new Error('load'));try{if(!pdfjsLib.GlobalWorkerOptions.workerSrc)pdfjsLib.GlobalWorkerOptions.workerSrc=AV_PDF_WORKER;}catch(e){}res(window.pdfjsLib);};s.onerror=()=>{_avPdf=null;s.remove();rej(new Error('load'));};document.head.appendChild(s);});
  return _avPdf;
}
async function avPdfText(dataUrl){
  const lib=await avLoadPdf();
  const buf=new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
  const doc=await lib.getDocument({data:buf,isEvalSupported:false}).promise;let out='';
  for(let p=1;p<=Math.min(3,doc.numPages);p++){const pg=await doc.getPage(p);const tc=await pg.getTextContent();out+=tc.items.map(x=>x.str).join(' ')+'\n';}
  try{doc.destroy();}catch(e){}
  return out.slice(0,8000);
}
async function avOcrText(dataUrl){
  const w=await avOcrWorker();
  try{const r=await w.recognize(dataUrl);return (r&&r.data&&r.data.text)||'';}finally{try{await w.terminate();}catch(e){}}
}
const AVF_KINDS=[
 {k:'identidade',cat:'pessoal',rx:/cartao de cidadao|citizen card|passaporte|passport|carta de conducao|driving licen|bilhete de identidade|titulo de residencia/,t:['documento de identificação','ID document'],f:['identificacao','identidade','pessoal','documentos pessoais']},
 {k:'seguro',cat:'pessoal',rx:/apolice|seguro|seguradora|insurance|policy/,t:['apólice de seguro','insurance policy'],f:['seguros','seguro']},
 {k:'carro',cat:'pessoal',rx:/\b(iuc|inspecao|ipo|dua|livrete|imposto unico de circulacao|oficina|revisao do carro)\b/,t:['documento do carro','car document'],f:['carro','automovel','veiculo','viatura','carros']},
 {k:'fatura',cat:'outro',rx:/fatura|factura|invoice|recibo|receipt|talao|garantia|warranty|nota de credito/,t:['fatura / recibo','invoice / receipt'],f:['faturas','garantias','compras','recibos']},
 {k:'saude',cat:'saude',rx:/receita medica|analises|relatorio medico|consulta|hospital|clinica|vacina|atestado medico/,t:['documento de saúde','health document'],f:['saude','medico','medicos']},
 {k:'banco',cat:'banco',rx:/extrato|credito habitacao|emprestimo|contrato de credito|bank statement|mortgage|\biban\b/,t:['documento bancário','bank document'],f:['banco','bancos','financas']},
 {k:'impostos',cat:'juridico',rx:/\birs\b|autoridade tributaria|\bimi\b|declaracao de rendimentos|nota de liquidacao|tax return/,t:['documento de impostos','tax document'],f:['impostos','irs','financas']},
 {k:'trabalho',cat:'trabalho',rx:/contrato de trabalho|recibo de vencimento|entidade patronal|payslip|employment contract/,t:['documento de trabalho','work document'],f:['trabalho','emprego']},
 {k:'casa',cat:'juridico',rx:/escritura|caderneta predial|licenca de utilizacao|contrato de arrendamento|condominio|projeto de arquitetura/,t:['documento da casa','home document'],f:['casa','habitacao']},
 {k:'escola',cat:'educacao',rx:/certificado de habilitacoes|diploma|matricula escolar|universidade|escola|certificado de formacao/,t:['documento de educação','education document'],f:['educacao','escola','formacao']}
];
const AVF={q:null};
function avFolderPath(id){const out=[];let f=docFolders.find(x=>x.id===id),guard=0;while(f&&guard++<20){out.unshift(f.name);f=docFolders.find(x=>x.id===f.parentId);}return out;}
function avToks(s){return aurNorm(s||'').replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>=3);}
function avFileSuggest(q){
  const nameT=new Set(avToks(q.files.map(f=>f.name).join(' ')+' '+(q.kind?q.kind.f.join(' '):'')));
  const folders=(typeof docFolders!=='undefined'?docFolders:[]).map(f=>{const path=avFolderPath(f.id);let s=0;path.forEach(seg=>avToks(seg).forEach(t=>{if(nameT.has(t))s+=2;if(q.kind&&q.kind.f.includes(t))s+=3;}));return {f,path,s};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||b.path.length-a.path.length).slice(0,2);
  const allT=new Set(avToks(q.files.map(f=>f.name).join(' ')+' '+(q.text||'').slice(0,1500)));
  const assetsM=(typeof assets!=='undefined'?assets:[]).map(a=>({a,s:avToks(a.name).filter(t=>allT.has(t)).length})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,1);
  return {folders,assetsM};
}
function avAssetLabelFull(a){const m={warranty:['Garantia','Warranty'],license:['Licença','Licence'],vehicle:['Veículo','Vehicle'],dates:['Data','Date']}[a.kind]||['Bem','Asset'];return avT(m)+' · '+a.name;}
async function avFilesReceive(list){
  const en=avEn(),files=[...(list||[])].filter(f=>f&&f.size>=0).slice(0,10);if(!files.length)return;
  try{auroraOpen();}catch(e){}AUR.lang=aurAppLang();
  const big=files.filter(f=>f.size>50*1048576);
  if(big.length){aurSay(aurL('⚠️ Ficheiros acima de 50 MB não podem ir para o cofre: ','⚠️ Files over 50 MB can’t go into the vault: ')+big.map(f=>'<b>'+esc(f.name)+'</b>').join(', ')+'.');}
  const ok=files.filter(f=>f.size<=50*1048576);if(!ok.length)return;
  AUR.out(ok.map(f=>'<span class="av-fchip">📎 <b>'+esc(f.name)+'</b> <span class="a-dim">· '+(typeof formatFileSize==='function'?formatFileSize(f.size):Math.round(f.size/1024)+' KB')+'</span></span>').join(''),'me');
  const typing=AUR.out('<span class="a-dim">'+aurL('A ler…','Reading…')+'</span>','ai');
  const read=await Promise.all(ok.map(f=>new Promise(res=>{const r=new FileReader();r.onload=()=>res({name:f.name,type:f.type||'',size:f.size,data:r.result});r.onerror=()=>res(null);r.readAsDataURL(f);})));
  const fl=read.filter(Boolean);
  let text='';
  for(const f of fl){if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){try{text+=await Promise.race([avPdfText(f.data),new Promise((_,rj)=>setTimeout(()=>rj(new Error('t')),12000))]);}catch(e){}}}
  if(typing&&typing.remove)typing.remove();
  const nt=aurNorm(fl.map(f=>f.name.replace(/[_\-.]+/g,' ')).join(' ')+' '+text);
  const kind=AVF_KINDS.find(k=>k.rx.test(nt))||null;
  let expiry='';try{const d=text&&avFindExpiry(text);if(d)expiry=d;}catch(e){}
  AVF.q={files:fl,kind,text,expiry,plan:null,awaiting:true};
  avFileAsk();
}
function avFileAsk(){
  const q=AVF.q;if(!q)return;const en=avEn(),n=q.files.length;
  const sug=avFileSuggest(q),chips=[];
  sug.assetsM.forEach(x=>chips.push({label:'🏠 '+aurL('Anexar a ','Attach to ')+avAssetLabelFull(x.a),fn:()=>avFilePlan({dest:{type:'asset',id:x.a.id}})}));
  sug.folders.forEach(x=>chips.push({label:'📁 '+aurL('Documentos','Documents')+' › '+x.path.join(' › '),fn:()=>avFilePlan({dest:{type:'doc',path:x.path}})}));
  chips.push({label:'📁 '+aurL('Documentos (sem pasta)','Documents (no folder)'),fn:()=>avFilePlan({dest:{type:'doc',path:[]}})});
  chips.push({label:'➕ '+aurL('Nova pasta…','New folder…'),fn:()=>{AVF.q.ask='folder';aurSay(aurL('Como se chama a pasta? Podes pôr subpastas: «Casa/Seguros».','What’s the folder called? You can nest: “Home/Insurance”.'));}});
  if(typeof assets!=='undefined'&&assets.length)chips.push({label:'🏠 '+aurL('Anexar a um bem…','Attach to an asset…'),fn:()=>aurSay(aurL('A qual?','Which one?'),assets.slice(0,10).map(a=>({label:avAssetLabelFull(a),fn:()=>avFilePlan({dest:{type:'asset',id:a.id}})})))});
  if(!q.expiry&&q.files.length===1&&/^image\//.test(q.files[0].type))chips.push({label:'🔍 '+aurL('Ler validade da foto','Read expiry from photo'),fn:()=>avFileOcr()});
  chips.push({label:aurL('Cancelar','Cancel'),fn:()=>{AVF.q=null;aurSay(aurL('Ok, não guardei nada.','Ok, nothing was saved.'));}});
  const what=q.kind?aurL(' Parece '+(n>1?'ser ':'uma ')+'<b>'+q.kind.t[0]+'</b>.',' Looks like '+(n>1?'':'a ')+'<b>'+q.kind.t[1]+'</b>.'):'';
  const exp=q.expiry?aurL('\n⏳ Encontrei a validade <b>','\n⏳ I found the expiry <b>')+aurDate(q.expiry)+'</b>.':'';
  const heavy=q.files.reduce((s,f)=>s+f.size,0)>15*1048576?aurL('\n⚠️ São ficheiros grandes — o cofre fica mais pesado de gravar e sincronizar.','\n⚠️ These are large files — the vault gets heavier to save and sync.'):'';
  aurSay('📄 '+aurL(n>1?'Recebi <b>'+n+' ficheiros</b>.':'Recebi <b>'+esc(q.files[0].name)+'</b>.',n>1?'I got <b>'+n+' files</b>.':'I got <b>'+esc(q.files[0].name)+'</b>.')+what+exp+heavy+aurL('\nOnde queres guardar?','\nWhere should I store it?')+'<div class="a-dim" style="margin-top:6px">'+aurL('Ou diz-me por palavras: <i>«cria a pasta Casa/Seguros e guarda lá, chama-lhe Apólice Casa»</i>','Or tell me: <i>“create the folder Home/Insurance and put it there, call it Home Policy”</i>')+'</div>',chips);
}
async function avFileOcr(){
  const q=AVF.q;if(!q)return;aurSay(aurL('🔍 A ler a foto… (na 1.ª vez descarrega o leitor)','🔍 Reading the photo… (the first time it downloads the reader)'));
  try{const t=await avOcrText(q.files[0].data);q.text=(q.text||'')+'\n'+t;const d=avFindExpiry(t);if(d){q.expiry=d;}const nt=aurNorm(t);if(!q.kind)q.kind=AVF_KINDS.find(k=>k.rx.test(nt))||null;}
  catch(e){aurSay(aurL('Não consegui ler a foto (sem internet na 1.ª vez?).','Couldn’t read the photo (no Internet the first time?).'));}
  avFileAsk();
}
function avFileParse(raw){
  const r=' '+raw.trim()+' ',n=aurNorm(raw),out={};
  const STOP='(?=\\s+(?:e|and)\\s+(?:guarda|guardar|guarde|p[õo]e|mete|coloca|save|put|store)|\\s*[,;.]|\\s+(?:chama|call|name|com\\s+(?:a\\s+)?validade|validade|v[aá]lid|expir)|\\s*$)';
  if(/^(cancela|cancelar|nao|não|esquece|cancel|no|stop)$/i.test(raw.trim()))return {cancel:true};
  let m;
  if((m=r.match(new RegExp('(?:cria|criar|crie|faz|faca|faça|nova|novo|create|make|new)\\s+(?:uma\\s+|a\\s+|the\\s+|a new\\s+)?(?:nova\\s+)?(?:pasta|folder)\\s+(?:chamada\\s+|called\\s+|com o nome\\s+|named\\s+)?[«"]?([^»",;]+?)[»"]?'+STOP,'i'))))out.dest={type:'doc',path:m[1].split(/\s*[\/›>]\s*/).filter(Boolean),create:true};
  else if((m=r.match(new RegExp('(?:documentos|documents)\\s*[›>\\/]\\s*([^,;]+?)'+STOP,'i'))))out.dest={type:'doc',path:m[1].split(/\s*[\/›>]\s*/).filter(Boolean)};
  else if((m=r.match(new RegExp('(?:na|numa|para a|em|dentro da|in|into|to)\\s+(?:the\\s+)?(?:pasta|folder)\\s+[«"]?([^»",;]+?)[»"]?'+STOP,'i'))))out.dest={type:'doc',path:m[1].split(/\s*[\/›>]\s*/).filter(Boolean)};
  else if((m=r.match(new RegExp('(?:garantia|ve[íi]culo|carro|mota|licen[cç]a|\\bbem\\b|\\bbens\\b|warranty|vehicle|\\bcar\\b|licen[cs]e|asset)s?\\s*(?:d[oa]s?|of|to|for)?\\s+([^,;]+?)'+STOP,'i')))&&/\b(anexa|anexar|junta|juntar|poe|mete|coloca|guarda|attach|add|put)\b/.test(n)){
    const w=aurNorm(m[1]);const kw=/garantia|warranty/.test(n)?'warranty':/veiculo|carro|mota|vehicle|\bcar\b/.test(n)?'vehicle':/licen/.test(n)?'license':null;
    let best=null,bs=0;(assets||[]).forEach(a=>{const s=avToks(a.name).filter(t=>w.includes(t)).length+(kw&&a.kind===kw?.5:0);if(s>bs){bs=s;best=a;}});
    if(!best&&kw){const k=(assets||[]).filter(a=>a.kind===kw);if(k.length===1)best=k[0];}
    out.dest=best?{type:'asset',id:best.id}:{type:'unknown',what:m[1]};
  }
  else if((m=r.match(new RegExp('(?:password|acesso|conta|entrada|account|entry)\\s*(?:d[oa]|of|to|for)?\\s+([^,;]+?)'+STOP,'i')))&&/\b(anexa|anexar|junta|juntar|attach)\b/.test(n)){
    const w=aurNorm(m[1]);let best=null,bs=0;(vault||[]).forEach(v=>{const s=avToks(v.name).filter(t=>w.includes(t)).length;if(s>bs){bs=s;best=v;}});
    out.dest=best?{type:'entry',id:best.id}:{type:'unknown',what:m[1]};
  }
  else if(/\b(sem pasta|na raiz|raiz|so nos documentos|nos documentos|no folder|root)\b/.test(n))out.dest={type:'doc',path:[]};
  if((m=r.match(/(?:chama[- ]?lhe|chama-se|com o nome|d[aá]-lhe o nome|t[íi]tulo|call it|name it|named|title)\s+[«"]?([^»",;]+?)[»"]?(?=\s*[,;.]|\s+(?:com|e|and|validade|v[aá]lid|expir|na|em|in|into)\b|\s*$)/i)))out.name=m[1].trim();
  if((m=n.match(/(?:validade|valido ate|valida ate|expira(?:\s+a|\s+em)?|expiry|expires|valid until)\s*:?\s*(.{4,40})/))){const d=aurParseDate(m[1]);if(d){const z=x=>String(x).padStart(2,'0');out.expiry=d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());}}
  return out;
}
function avFileHandleText(raw){
  const q=AVF.q;if(!q||!q.awaiting||!raw)return false;
  const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;
  if(q.ask==='folder'){q.ask=null;const path=raw.split(/\s*[\/›>]\s*/).map(s=>s.trim()).filter(Boolean);if(path.length){avFilePlan({dest:{type:'doc',path,create:true}});return true;}}
  const p=avFileParse(raw);
  if(p.cancel){AVF.q=null;aurSay(aurL('Ok, não guardei nada.','Ok, nothing was saved.'));return true;}
  if(!p.dest&&!p.name&&!p.expiry)return false;
  if(p.dest&&p.dest.type==='unknown'){aurSay(aurL('Não encontrei «','I couldn’t find “')+esc(p.dest.what)+aurL('». Escolhe um destino:','”. Pick a destination:'));avFileAsk();return true;}
  avFilePlan(p);return true;
}
function avFilePlan(p){
  const q=AVF.q;if(!q)return;const plan=q.plan||{};
  if(p.dest)plan.dest=p.dest;if(p.name)plan.name=p.name;if(p.expiry)plan.expiry=p.expiry;
  if(!plan.dest)plan.dest={type:'doc',path:[]};if(!plan.expiry&&q.expiry)plan.expiry=q.expiry;
  q.plan=plan;
  const en=avEn(),n=q.files.length;let where='';
  if(plan.dest.type==='doc'){
    let parent=null,exists=true;for(const seg of plan.dest.path){const f=docFolders.find(x=>(x.parentId||null)===parent&&aurNorm(x.name)===aurNorm(seg));if(!f){exists=false;break;}parent=f.id;}
    where='<b>'+aurL('Documentos','Documents')+(plan.dest.path.length?' › '+plan.dest.path.map(esc).join(' › '):'')+'</b>'+(exists?'':' <span class="a-dim">('+aurL('pasta nova','new folder')+')</span>');
  }else if(plan.dest.type==='asset'){const a=assets.find(x=>x.id===plan.dest.id);where='<b>'+esc(a?avAssetLabelFull(a):'?')+'</b> <span class="a-dim">('+aurL('anexo','attachment')+')</span>';}
  else if(plan.dest.type==='entry'){const v=vault.find(x=>x.id===plan.dest.id);where='<b>'+esc(v?v.name:'?')+'</b> <span class="a-dim">('+aurL('anexo da password','password attachment')+')</span>';}
  const nm=plan.dest.type==='doc'?(n===1?'• <b>'+esc(plan.name||q.files[0].name.replace(/\.[^.]+$/,''))+'</b> ('+esc(q.files[0].name)+')\n':'• <b>'+n+aurL(' ficheiros',' files')+'</b>\n'):'• '+q.files.map(f=>esc(f.name)).join(', ')+'\n';
  const ex=plan.expiry&&plan.dest.type!=='entry'?'• '+aurL('validade ','expiry ')+'<b>'+aurDate(plan.expiry)+'</b> — '+aurL('aviso-te antes de expirar','I’ll remind you before it expires')+'\n':'';
  aurSay(aurL('Vou guardar:\n','I’ll store:\n')+nm+'• '+aurL('em ','in ')+where+'\n'+ex+aurL('Confirmas?','Confirm?'),[{label:aurL('Confirmar','Confirm'),fn:()=>avFileSave()},{label:aurL('Mudar destino','Change destination'),fn:()=>{q.plan.dest=null;avFileAsk();}},{label:aurL('Cancelar','Cancel'),fn:()=>{AVF.q=null;aurSay(aurL('Ok, não guardei nada.','Ok, nothing was saved.'));}}]);
}
function avFileSave(){
  const q=AVF.q;if(!q||!q.plan)return;const plan=q.plan,en=avEn(),n=q.files.length;const nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  let openFn=null,where='';
  if(plan.dest.type==='doc'){
    let parent=null;
    for(const seg of plan.dest.path){let f=docFolders.find(x=>(x.parentId||null)===parent&&aurNorm(x.name)===aurNorm(seg));if(!f){f={id:'f'+nid(),name:seg,icon:'📁',parentId:parent};docFolders.push(f);}parent=f.id;}
    const made=q.files.map(f=>{const d={id:nid(),title:(n===1&&plan.name)?plan.name:(f.name.replace(/\.[^.]+$/,'')||f.name),cat:(q.kind&&q.kind.cat)||'outro',date:'',expiry:n===1?(plan.expiry||''):'',desc:'',folderId:parent,file:{name:f.name,size:f.size,type:f.type,data:f.data},createdAt:Date.now()};documents.push(d);return d;});
    where=aurL('Documentos','Documents')+(plan.dest.path.length?' › '+plan.dest.path.join(' › '):'');
    openFn=()=>{switchTab('docs');currentFolderId=parent;try{renderDocs();}catch(e){}setTimeout(()=>{try{openDocModal(made[0].id);}catch(e){}},200);};
  }else if(plan.dest.type==='asset'){
    const a=assets.find(x=>x.id===plan.dest.id);if(!a){aurSay(aurL('Esse bem já não existe.','That asset no longer exists.'));return;}
    a.attachments=(Array.isArray(a.attachments)?a.attachments:[]).concat(q.files.map(f=>({id:nid(),name:f.name,type:f.type,size:f.size,data:f.data})));
    if(plan.expiry&&'expiry' in a&&!a.expiry)a.expiry=plan.expiry;
    where=avAssetLabelFull(a);openFn=()=>{switchTab(a.kind);setTimeout(()=>{try{openAssetModal(a.kind,a.id);}catch(e){}},200);};
  }else if(plan.dest.type==='entry'){
    const v=vault.find(x=>x.id===plan.dest.id);if(!v){aurSay(aurL('Essa password já não existe.','That password no longer exists.'));return;}
    v.attachments=(Array.isArray(v.attachments)?v.attachments:[]).concat(q.files.map(f=>({id:nid(),name:f.name,type:f.type,size:f.size,data:f.data})));
    where=v.name;openFn=()=>{try{openReadMode(v.id);}catch(e){}};
  }
  AVF.q=null;
  try{logActivity('add',q.files.map(f=>f.name).join(', '),'📎');}catch(e){}
  markUnsaved();try{renderAll();}catch(e){}
  aurSay('✓ '+aurL(n>1?'Guardei '+n+' ficheiros em <b>':'Guardado em <b>',n>1?'Stored '+n+' files in <b>':'Stored in <b>')+esc(where)+'</b>.',[{label:aurL('Abrir','Open'),fn:()=>{aurClose();openFn&&openFn();}}]);
}
(function(){
  function wire(){
    const panel=document.getElementById('aurora-panel'),send=document.getElementById('aurora-send');
    if(send&&!document.getElementById('aurora-clip')){
      const b=document.createElement('button');b.id='aurora-clip';b.type='button';b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
      const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.id='aurora-file';inp.style.display='none';inp.onchange=()=>{const f=inp.files;avFilesReceive(f);inp.value='';};
      b.onclick=()=>inp.click();send.parentNode.insertBefore(b,send);send.parentNode.appendChild(inp);
    }
    const c=document.getElementById('aurora-clip');if(c){const l=avEn()?'Upload files':'Carregar ficheiros';c.title=l;c.setAttribute('aria-label',l);}
    if(panel&&!panel.dataset.avDrop){
      panel.dataset.avDrop='1';let dc=0;
      panel.addEventListener('dragenter',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){dc++;panel.dataset.drop=avEn()?'Drop here to store in the vault':'Larga aqui para guardar no cofre';panel.classList.add('av-drop');}});
      panel.addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault();});
      panel.addEventListener('dragleave',()=>{dc=Math.max(0,dc-1);if(!dc)panel.classList.remove('av-drop');});
      panel.addEventListener('drop',e=>{if(!e.dataTransfer||!e.dataTransfer.files.length)return;e.preventDefault();dc=0;panel.classList.remove('av-drop');avFilesReceive(e.dataTransfer.files);});
    }
  }
  if(typeof auroraOpen==='function'){const ao=auroraOpen;auroraOpen=function(){const r=ao.apply(this,arguments);try{wire();}catch(e){}return r;};}
  setInterval(()=>{try{if(document.getElementById('aurora-panel'))wire();}catch(e){}},1500);
})();


/* ══ v9.75 — COFRE GUARDADO NA APP (browsers sem acesso direto a ficheiros) + DIAGNÓSTICO ══
   Sem acesso direto a ficheiros (Chrome Android < 132, Samsung Internet, Firefox, iPhone…), o cofre encriptado
   vive no armazenamento da app neste dispositivo: abre direto no PIN/impressão digital e grava sem downloads.
   Cópias em ficheiro passam a ser pedidas (⋯ → Exportar) e há um lembrete se o Drive estiver desligado. */
async function avDevInit(migr){
  let loc=null;try{loc=await localVaultGet();}catch(e){}
  if(!loc||!loc.json||pendingVaultFile||pendingVaultText)return false;
  pendingVaultText=loc.json;lockSwipeNeed=true;lockSwipeRetry=false;lockShowPwStep();AV_MIGR=!!migr;
  if(!FSA_OK){try{localStorage.setItem('av_dev_mode','1');}catch(e){}}
  const fn=document.getElementById('l-file-name');if(fn)fn.textContent=migr?(currentLang==='en'?'📱 Copy on this device (most recent)':'📱 Cópia deste dispositivo (a mais recente)'):(currentLang==='en'?'📱 Vault stored on this device':'📱 Cofre guardado neste dispositivo');
  const fm=document.getElementById('l-file-meta');if(fm)fm.style.display='none';
  await refreshQuickUnlock(true);
  return true;
}
function avDevPersist(){
  try{if(localStorage.getItem('av_persist_asked')==='1')return;localStorage.setItem('av_persist_asked','1');}catch(e){}
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});}catch(e){}
}
async function avExportVault(){
  const en=avEn();
  try{if(hasUnsaved)await saveFile({auto:true});}catch(e){}
  let l=null;try{l=await localVaultGet();}catch(e){}
  if(!l||!l.json){toast(en?'Nothing to export yet — save first.':'Ainda não há nada para exportar — grava primeiro.');return;}
  const d=new Date(),z=n=>String(n).padStart(2,'0');
  downloadVault(JSON.parse(l.json),'ciphervault_'+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'.vault');
  try{localStorage.setItem('av_last_export',String(Date.now()));}catch(e){}
  toast(en?'📤 Copy exported (encrypted) — keep it somewhere safe.':'📤 Cópia exportada (encriptada) — guarda-a num sítio seguro.');
  try{aurAlertsRender();}catch(e){}
}
function avBrowser(){
  const ua=navigator.userAgent||'';let m;
  if(/; wv\)/.test(ua))return {n:'WebView (browser dentro de outra app)',v:0};
  if((m=ua.match(/SamsungBrowser\/(\d+)/)))return {n:'Samsung Internet',v:+m[1]};
  if((m=ua.match(/EdgA?\/(\d+)/)))return {n:'Edge',v:+m[1]};
  if((m=ua.match(/OPR\/(\d+)/)))return {n:'Opera',v:+m[1]};
  if((m=ua.match(/(?:Firefox|FxiOS)\/(\d+)/)))return {n:'Firefox',v:+m[1]};
  if((m=ua.match(/CriOS\/(\d+)/)))return {n:'Chrome (iPhone)',v:+m[1]};
  if((m=ua.match(/Chrome\/(\d+)/)))return {n:'Chrome',v:+m[1]};
  if(/Safari/.test(ua)&&(m=ua.match(/Version\/(\d+)/)))return {n:'Safari',v:+m[1]};
  return {n:'?',v:0};
}
async function avRenderDiag(){
  const el=document.getElementById('av-diag');if(!el)return;const en=avEn();
  const ttl=document.getElementById('s-diag-title');if(ttl)ttl.textContent=en?'🩺 Diagnostics':'🩺 Diagnóstico';
  const ua=navigator.userAgent||'',br=avBrowser();
  const os=/Android/.test(ua)?'Android':/iPhone|iPad|iPod/.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Mac OS/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'?';
  let persisted=null;try{if(navigator.storage&&navigator.storage.persisted)persisted=await navigator.storage.persisted();}catch(e){}
  const inst=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  const Y=en?'yes':'sim',N=en?'no':'não';
  const where=FSA_OK?(vaultFileHandle?(en?'file «':'ficheiro «')+esc(vaultFileHandle.name)+'»':(en?'file (chosen when opening)':'ficheiro (escolhido ao abrir)')):(en?'app storage on this device':'armazenamento da app neste dispositivo');
  const rows=[
    [en?'Browser':'Browser',esc(br.n)+(br.v?' '+br.v:'')+' · '+os+(inst?(en?' · installed app':' · app instalada'):'')],
    [en?'Direct file access':'Acesso direto a ficheiros',FSA_OK?'✅ '+Y:'❌ '+N],
    [en?'Where the vault lives':'Onde está o cofre',where],
    [en?'Persistent storage':'Armazenamento persistente',persisted===null?'—':(persisted?'✅ '+Y:'⚠️ '+N)],
    ['Google Drive',(typeof driveOn==='function'&&driveOn())?(en?'✅ connected':'✅ ligado'):(en?'off':'desligado')],
    [en?'App version':'Versão da app','v'+(typeof APP_VERSION!=='undefined'?APP_VERSION:'?')]
  ];
  let tip='';
  if(!FSA_OK){
    if(br.n==='Chrome'&&br.v&&br.v<132&&os==='Android')tip=en?'💡 Update Chrome to version 132 or later so the app can use the vault file directly.':'💡 Atualiza o Chrome para a versão 132 ou mais recente para a app poder usar o ficheiro do cofre diretamente.';
    else tip=en?'💡 This browser can’t open files directly, so the vault is kept (encrypted) in the app on this device. Connect Google Drive or export a copy regularly (⋯ → Export).':'💡 Este browser não abre ficheiros diretamente, por isso o cofre fica guardado (encriptado) na app, neste dispositivo. Liga o Google Drive ou exporta uma cópia de vez em quando (⋯ → Exportar).';
  }
  el.innerHTML=rows.map(r=>'<div style="display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--border);padding:3px 0"><span>'+r[0]+'</span><b style="color:var(--text);font-weight:500;text-align:right">'+r[1]+'</b></div>').join('')+(tip?'<div style="margin-top:8px;line-height:1.6">'+tip+'</div>':'');
}
(function(){
  if(typeof switchSettingsTab==='function'){const sst=switchSettingsTab;switchSettingsTab=function(t){const r=sst.apply(this,arguments);if(t==='sobre')avRenderDiag();return r;};}
  if(typeof openSettings==='function'){const os=openSettings;openSettings=function(){const r=os.apply(this,arguments);try{avRenderDiag();}catch(e){}return r;};}
  // lembrete de cópia quando o cofre só vive neste dispositivo e o Drive está desligado
  if(typeof aurAlerts==='function'){const aa=aurAlerts;aurAlerts=function(){const out=aa.apply(this,arguments);try{
    if(!FSA_OK&&!(typeof driveOn==='function'&&driveOn())&&Date.now()-(+localStorage.getItem('av_last_export')||0)>14*864e5){
      const k='devbk:'+new Date().toISOString().slice(0,10);const off=aurAlertsDismissed(),day=new Date().toISOString().slice(0,10);
      if(off[k]!==day)out.unshift({k,ic:'💾',html:avEn()?'Your vault only lives <b>on this device</b> — export a copy or connect Google Drive':'O teu cofre só está <b>neste dispositivo</b> — exporta uma cópia ou liga o Google Drive',run:()=>avExportVault()});
    }}catch(e){}return out.slice(0,4);};}
})();


/* ══ v9.76 — CÓPIA AUTOMÁTICA PARA AS TRANSFERÊNCIAS (browsers sem acesso direto a ficheiros) ══
   O cofre continua encriptado (é o mesmo ficheiro .vault). Só quando houve alterações, no máximo 1× por
   semana (ou dia), e só em momentos com gesto do utilizador (gravar, entrar, bloquear). Desligada com o Drive ligado. */
let AV_MIGR=false;
function avBackupFreq(){try{const v=localStorage.getItem('av_bk_freq');return v==='daily'||v==='off'?v:'weekly';}catch(e){return 'weekly';}}
function avSetBkFreq(v){try{localStorage.setItem('av_bk_freq',v);}catch(e){}avRenderSettings();const en=avEn();
  toast(v==='off'?(en?'Automatic copy off — remember to export a copy (⋯ → Export).':'Cópia automática desligada — lembra-te de exportar (⋯ → Exportar).'):(v==='daily'?(en?'Automatic copy: daily (when something changed).':'Cópia automática: diária (quando há alterações).'):(en?'Automatic copy: weekly (when something changed).':'Cópia automática: semanal (quando há alterações).')));}
function avMarkChange(){try{localStorage.setItem('av_last_change',String(Date.now()));}catch(e){}}
async function avAutoBackupMaybe(){
  if(FSA_OK||presentationMode)return false;
  if(typeof driveOn==='function'&&driveOn())return false;
  const f=avBackupFreq();if(f==='off')return false;
  const period=f==='daily'?864e5:7*864e5,last=+localStorage.getItem('av_wk_last')||0,ch=+localStorage.getItem('av_last_change')||0;
  if(last&&ch<=last)return false;
  if(last&&Date.now()-last<period)return false;
  let l=null;try{l=await localVaultGet();}catch(e){}
  if(!l||!l.json)return false;
  const d=new Date(),z=n=>String(n).padStart(2,'0');
  downloadVault(JSON.parse(l.json),'ciphervault_backup_'+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'.vault');
  try{localStorage.setItem('av_wk_last',String(Date.now()));localStorage.setItem('av_last_export',String(Date.now()));}catch(e){}
  const en=avEn();
  toast(en?'📦 Backup copy saved to Downloads (encrypted). You can delete older copies.':'📦 Cópia de segurança guardada nas Transferências (encriptada). Podes apagar as antigas.');
  return true;
}
function avDevHint(show){
  let el=document.getElementById('l-dev-hint');
  if(!show){if(el)el.style.display='none';return;}
  if(!el){const init=document.getElementById('login-state-initial');if(!init)return;el=document.createElement('div');el.id='l-dev-hint';el.style.cssText='margin-top:14px;padding:10px 12px;border-radius:10px;border:1px dashed rgba(var(--accent-rgb),.45);font-size:.66rem;line-height:1.6;color:var(--text-muted);text-align:left';init.appendChild(el);}
  const en=avEn();el.style.display='block';
  el.innerHTML=en?'💡 In this browser the vault is kept inside the app. <b>Lost access?</b> Tap <b>Load vault</b> and choose the most recent copy in Downloads (<i>ciphervault_backup_YYYY-MM-DD.vault</i>).':'💡 Neste browser o cofre fica guardado na app. <b>Perdeste o acesso?</b> Toca em <b>Carregar cofre</b> e escolhe a cópia mais recente nas Transferências (<i>ciphervault_backup_AAAA-MM-DD.vault</i>).';
}
(function(){
  if(typeof doUnlock==='function'){const du=doUnlock;doUnlock=function(){const r=du.apply(this,arguments);
    setTimeout(()=>{try{avAutoBackupMaybe();}catch(e){}
      if(AV_MIGR&&FSA_OK){AV_MIGR=false;try{toast(avEn()?'Your browser can now save to a file — tap “Not saved” / Save to choose where to create the vault file.':'O teu browser já consegue guardar num ficheiro — toca em «Por gravar» / Guardar para escolheres onde criar o ficheiro do cofre.');hasUnsaved=true;avRenderSaveState();}catch(e){}}
    },2500);return r;};}
  if(typeof lockApp==='function'){const la=lockApp;lockApp=function(){try{avAutoBackupMaybe();}catch(e){}return la.apply(this,arguments);};}
  if(typeof markSaved==='function'){const ms=markSaved;markSaved=function(){const r=ms.apply(this,arguments);try{if(vaultFileHandle&&FSA_OK)localStorage.removeItem('av_dev_mode');}catch(e){}return r;};}
})();


/* ══ v9.77 — WI-FI NO DASHBOARD (com o símbolo de Wi-Fi a sério) ══ */
function avWifiIcon(sz){sz=sz||16;return '<svg class="av-wico" width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8.8a15 15 0 0 1 20 0"/><path d="M5.2 12.6a10.3 10.3 0 0 1 13.6 0"/><path d="M8.6 16.3a5.2 5.2 0 0 1 6.8 0"/><circle cx="12" cy="19.9" r="1.35" fill="currentColor" stroke="none"/></svg>';}
(function(){const w=AV_ADD_MORE.find(x=>x.k==='wifi');if(w)w.ic=avWifiIcon(14);})();
function avWifiCard(){
  const launch=document.querySelector('.aur-launch');let card=document.getElementById('av-wifi-card');
  const nets=(typeof wifiNets!=='undefined'?wifiNets:[]);
  if(!launch||!nets.length||presentationMode){if(card)card.remove();return;}
  if(!card){card=document.createElement('div');card.id='av-wifi-card';card.className='av-wifi';}
  let side=document.getElementById('av-side');
  if(!side){side=document.createElement('div');side.id='av-side';}
  if(side.previousElementSibling!==launch)launch.insertAdjacentElement('afterend',side);
  const al=document.getElementById('aur-alerts');if(al&&al.parentElement!==side)side.insertBefore(al,side.firstChild);
  if(card.parentElement!==side)side.appendChild(card);
  const en=avEn();
  card.innerHTML='<div class="av-wifi-h"><span>'+avWifiIcon(13)+' Wi-Fi</span><button data-act="openWifiManager" title="'+(en?'Manage Wi-Fi networks':'Gerir redes Wi-Fi')+'">⚙ '+(en?'Manage':'Gerir')+'</button></div>'
   +nets.slice(0,4).map(n=>'<button class="av-wifi-n" data-act="openWifiNetQR" data-arg="'+esc(n.id)+'" title="'+(en?'Show QR code and password':'Mostrar QR code e password')+'">'+avWifiIcon(17)+'<b>'+esc(n.name||n.ssid)+'</b><i>'+(en?'Show QR ›':'Mostrar QR ›')+'</i></button>').join('')
   +(nets.length>4?'<button class="av-wifi-n" data-act="openWifiManager"><b style="font-weight:500;color:var(--text-muted)">+'+(nets.length-4)+(en?' more':' mais')+'</b></button>':'');
}
(function(){
  if(typeof renderGreeting==='function'){const rg=renderGreeting;renderGreeting=function(){const r=rg.apply(this,arguments);try{avWifiCard();}catch(e){}return r;};}
  if(typeof renderWifiBar==='function'){const rw=renderWifiBar;renderWifiBar=function(){const r=rw.apply(this,arguments);try{avWifiCard();}catch(e){}return r;};}
  if(typeof aurAlertsRender==='function'){const ar=aurAlertsRender;aurAlertsRender=function(){const r=ar.apply(this,arguments);try{avWifiCard();}catch(e){}return r;};}
})();


/* ══ v9.81 — ASPETO (iniciais · OLED · automático) · CALENDÁRIO DO TELEMÓVEL · AURORA (alcunhas · sugestões · resumo semanal · limpeza guiada) ══ */
function avHash(s){let h=5381;s=String(s||'');for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
function avMono(name){
  const w=String(name||'?').replace(/[^\p{L}\p{N} ]/gu,' ').trim().split(/\s+/).filter(Boolean);
  const ini=(w.length>1?(w[0][0]+w[1][0]):(w[0]||'?').slice(0,2)).toUpperCase();
  let h=0;const n=String(name||'');for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))%360;
  return '<span class="service-icon av-mono" style="background:linear-gradient(135deg,hsl('+h+',52%,46%),hsl('+((h+28)%360)+',58%,34%))" aria-hidden="true">'+esc(ini)+'</span>';
}
/* tema OLED: preto puro (poupa bateria nos ecrãs AMOLED), com o dourado da Aurora */
(function(){try{if(!THEME_PRESETS.some(t=>t.id==='oled')){const i=THEME_PRESETS.findIndex(t=>!t.dark);THEME_PRESETS.splice(i<0?THEME_PRESETS.length:i,0,{id:'oled',name:'OLED',emoji:'🖤',dark:true,bg:'#000000',accent:'#c9a84c',text:'#ece8dc'});}}catch(e){}})();
/* tema automático: alterna entre o teu tema escuro e o teu tema claro conforme o sistema */
function avThemeAuto(){try{return localStorage.getItem('av_theme_auto')==='1';}catch(e){return false;}}
function avApplyAutoTheme(){if(!avThemeAuto()||!window.matchMedia||typeof setTheme!=='function')return;const want=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(typeof currentTheme==='undefined'||currentTheme!==want)setTheme(want);}
function avSetThemeAuto(on){try{localStorage.setItem('av_theme_auto',on?'1':'0');}catch(e){}if(on)avApplyAutoTheme();avRenderSettings();toast(on?(avEn()?'Automatic theme on — follows your device.':'Tema automático ligado — segue o teu dispositivo.'):(avEn()?'Automatic theme off.':'Tema automático desligado.'));}
(function(){
  try{if(window.matchMedia){const mq=matchMedia('(prefers-color-scheme: dark)');(mq.addEventListener?mq.addEventListener('change',avApplyAutoTheme):mq.addListener(avApplyAutoTheme));}}catch(e){}
  if(typeof toggleTheme==='function'){const tt=toggleTheme;toggleTheme=function(){if(avThemeAuto()){try{localStorage.setItem('av_theme_auto','0');}catch(e){}toast(avEn()?'Automatic theme turned off (you chose manually).':'Tema automático desligado (escolheste à mão).');}return tt.apply(this,arguments);};}
  setTimeout(avApplyAutoTheme,50);
})();

/* ── calendário do telemóvel (.ics): só nomes e datas, nunca passwords ── */
function avIcsEsc(s){return String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
function avIcsFold(l){if(l.length<=73)return l;let o='',r=l;while(r.length>73){o+=r.slice(0,73)+'\r\n ';r=r.slice(73);}return o+r;}
function avCalEvents(onlyLabel){
  let ev=[];try{ev=calCollectEvents();}catch(e){}
  const t0=new Date();t0.setHours(0,0,0,0);const lim=new Date(t0);lim.setFullYear(lim.getFullYear()+2);
  return ev.map(e=>{const v=e.date;const d=v instanceof Date?new Date(v.getTime()):new Date(String(v).slice(0,10)+'T00:00:00');d.setHours(0,0,0,0);return Object.assign({},e,{d});})
    .filter(e=>!isNaN(e.d)&&e.d>=t0&&e.d<=lim&&(!onlyLabel||e.label===onlyLabel));
}
function avBuildIcs(ev){
  const en=avEn(),z=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+z(d.getMonth()+1)+z(d.getDate());
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const K={renew:['Renova','Renews'],doc:['Validade','Expires'],card:['Cartão expira','Card expires']};
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aurora Vault//PT','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Aurora Vault'];
  ev.forEach(e=>{const nx=new Date(e.d);nx.setDate(nx.getDate()+1);const k=K[e.type];
    const title=(k?avT(k)+': ':'⏳ ')+e.label+(e.type==='renew'&&e.amount?' ('+e.amount+' €)':'');
    L.push('BEGIN:VEVENT','UID:av-'+e.type+'-'+avHash(e.label+'|'+ymd(e.d))+'@aurora-vault','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+ymd(e.d),'DTEND;VALUE=DATE:'+ymd(nx),'SUMMARY:'+avIcsEsc(title),'DESCRIPTION:'+avIcsEsc(en?'Reminder from Aurora Vault':'Lembrete do Aurora Vault'),'TRANSP:TRANSPARENT',
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+avIcsEsc(title),'TRIGGER:-P7D','END:VALARM','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+avIcsEsc(title),'TRIGGER:-P1D','END:VALARM','END:VEVENT');});
  L.push('END:VCALENDAR');return L.map(avIcsFold).join('\r\n');
}
async function avExportICS(onlyLabel){
  const en=avEn(),ev=avCalEvents(onlyLabel);
  if(!ev.length){toast(en?'No upcoming renewals or expiry dates to export.':'Não há renovações nem validades futuras para exportar.');return 0;}
  const file=new File([avBuildIcs(ev)],onlyLabel?'aurora-vault-'+avHash(onlyLabel)+'.ics':'aurora-vault-renovacoes.ics',{type:'text/calendar'});
  if(!avIsDesk()&&navigator.canShare&&navigator.share){try{if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Aurora Vault'});toast(en?'📲 Choose your calendar app to add the dates.':'📲 Escolhe a app de calendário para juntar as datas.');return ev.length;}}catch(e){if(e&&e.name==='AbortError')return 0;}}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
  toast(en?'📲 '+ev.length+' dates exported (names and dates only) — open the file to add them to your calendar.':'📲 '+ev.length+(ev.length===1?' data exportada':' datas exportadas')+' (só nomes e datas) — abre o ficheiro para as juntar ao calendário.');
  return ev.length;
}
(function(){
  if(typeof openCalendar!=='function')return;const oc=openCalendar;
  openCalendar=function(){const r=oc.apply(this,arguments);setTimeout(()=>{try{
    const ov=[...document.querySelectorAll('[id$="-overlay"].open,.modal-overlay.open')].find(o=>/cal/i.test(o.id))||[...document.querySelectorAll('[id$="-overlay"].open')].pop();
    const t=ov&&ov.querySelector('.modal-title');if(!t)return;let b=t.querySelector('.av-cal-exp');
    if(!b){b=document.createElement('button');b.className='av-cal-exp';b.type='button';b.onclick=e=>{e.stopPropagation();avExportICS();};t.style.display='flex';t.style.alignItems='center';t.style.gap='10px';t.appendChild(b);}
    b.textContent=avEn()?'📲 Send to phone calendar':'📲 Enviar para o calendário do telemóvel';
  }catch(e){}},60);return r;};
})();

/* ── sugestões discretas da Aurora (depois de gravar) ── */
function avNudgesOn(){try{return localStorage.getItem('av_nudges')!=='0';}catch(e){return true;}}
function avSetNudges(on){try{localStorage.setItem('av_nudges',on?'1':'0');}catch(e){}avRenderSettings();}
function avNudgeClose(){const _n=document.getElementById('av-nudge');if(_n)_n._closed=true;const n=document.getElementById('av-nudge');if(n){n.classList.remove('show');clearTimeout(n._t);}}
function avNudge(html,actions,ms){
  if(typeof AVT!=='undefined'&&AVT.on)return;
  let n=document.getElementById('av-nudge');if(!n){n=document.createElement('div');n.id='av-nudge';n.setAttribute('role','status');document.body.appendChild(n);}
  clearTimeout(n._t);
  n.innerHTML='<span class="av-nudge-ic">✨</span><div class="av-nudge-tx">'+html+'</div>'+(actions||[]).map((a,i)=>'<button class="av-nudge-b'+(i===0?' go':'')+'" data-i="'+i+'">'+a.label+'</button>').join('')+'<button class="av-nudge-x" aria-label="'+(avEn()?'Close':'Fechar')+'">✕</button>';
  n.querySelectorAll('.av-nudge-b').forEach(b=>b.onclick=()=>{avNudgeClose();try{actions[+b.dataset.i].fn();}catch(e){}});
  n.querySelector('.av-nudge-x').onclick=avNudgeClose;
  n._closed=false;requestAnimationFrame(()=>{if(!n._closed)n.classList.add('show');});n._t=setTimeout(avNudgeClose,ms||12000);
}
function avTotpHas(name){try{if(typeof aurTotpLocked==='function'&&aurTotpLocked())return true;const k=aurNorm(name||'');return (typeof totp!=='undefined'?totp:[]).some(t=>{const x=aurNorm(t.issuer||t.name||'');return x&&(x.includes(k)||k.includes(x));});}catch(e){return true;}}
function avSuggestEntry(e){
  if(!avNudgesOn()||!e||e.isWifi)return;const en=avEn(),nm='<b>'+esc(e.name)+'</b>';
  if(typeof getPwScore==='function'&&e.pw&&getPwScore(e.pw)<2){avNudge(en?'The password for '+nm+' is weak.':'A password do '+nm+' é fraca.',[{label:en?'Make a strong one':'Gerar uma forte',fn:()=>{editEntry(e.id);setTimeout(()=>{try{openPwGen();}catch(x){}},350);}}]);return;}
  if(!avTotpHas(e.name))avNudge(en?'Saved '+nm+'. Does this account use 2FA? Keep the code here too.':'Guardaste '+nm+'. Esta conta tem 2FA? Guarda cá também o código.',[{label:en?'Add 2FA code':'Adicionar código 2FA',fn:()=>avAddType('totp')}]);
}
function avSuggestDoc(d){
  if(!avNudgesOn()||!d)return;const en=avEn(),nm='<b>'+esc(d.title||d.name||'')+'</b>';
  if(d.expiry)avNudge(en?'I’ll remind you before '+nm+' expires. Add it to your phone calendar too?':'Aviso-te antes de '+nm+' expirar. Juntar também ao calendário do telemóvel?',[{label:en?'📲 Add to calendar':'📲 Juntar ao calendário',fn:()=>avExportICS(d.title||d.name)}]);
  else if(d.file&&/^image\//.test(d.file.type||''))avNudge(en?'Want me to read the expiry date of '+nm+' from the photo?':'Queres que eu leia a validade de '+nm+' da foto?',[{label:en?'🔍 Read expiry':'🔍 Ler validade',fn:()=>{openDocModal(d.id);setTimeout(()=>{try{avOcrDoc();}catch(x){}},450);}}]);
}
(function(){
  if(typeof saveEntry==='function'){const se=saveEntry;saveEntry=function(){const ids=new Set((vault||[]).map(v=>v.id));const r=se.apply(this,arguments);setTimeout(()=>{try{const nw=vault.find(v=>!ids.has(v.id));if(nw)avSuggestEntry(nw);}catch(e){}},450);return r;};}
  if(typeof saveDoc==='function'){const sd=saveDoc;saveDoc=function(){const ids=new Set((documents||[]).map(v=>v.id));const r=sd.apply(this,arguments);setTimeout(()=>{try{const nw=documents.find(v=>!ids.has(v.id));if(nw)avSuggestDoc(nw);}catch(e){}},450);return r;};}
})();

/* ── alcunhas: «quando eu disser banco, é o Millennium» ── */
function avAliases(){try{return JSON.parse(localStorage.getItem('av_aliases')||'{}')||{};}catch(e){return {};}}
function avAliasSaveAll(o){try{localStorage.setItem('av_aliases',JSON.stringify(o));}catch(e){}}
function avAliasItems(){const out=[];const add=(a,f)=>(a||[]).forEach(x=>{const n=x&&f(x);if(n)out.push(String(n));});
  try{add(vault,x=>!x.archived&&x.name);add(bankCards,x=>x.name||x.bank);add(storeCards,x=>x.name);add(documents,x=>x.title||x.name);add(assets,x=>x.name);add(personalInfo,x=>x.name);add(typeof subscriptions!=='undefined'?subscriptions:[],x=>x.name);}catch(e){}return out;}
function avAliasResolve(t){const k=aurNorm(t).trim();if(!k)return null;const items=avAliasItems();return items.find(n=>aurNorm(n)===k)||items.find(n=>aurNorm(n).includes(k))||items.find(n=>k.includes(aurNorm(n))&&aurNorm(n).length>=3)||null;}
function avAliasCmd(raw){
  const n=aurNorm(raw).replace(/[«»"“”]/g,'').replace(/[?!.]+$/,'').trim();let m;
  if(/^(que |quais )?(as )?(minhas )?(alcunhas|apelidos)( tenho)?$|^(my )?aliases$/.test(n))return {list:true};
  if((m=n.match(/^(?:esquece|apaga|remove|tira|forget|delete)(?: a| the)? (?:alcunha|apelido|alias) (.+)$/)))return {del:m[1].trim()};
  if((m=n.match(/^(?:alcunha|apelido|alias)\s*:?\s*(.+?)\s*(?:=|->|e|é|means|is)\s*(?:o |a |the )?(.+)$/)))return {set:[m[1],m[2]],explicit:true};
  if((m=n.match(/^quando (?:eu )?(?:disser|escrever|digo)\s+(.+?)\s*,?\s*(?:e|é|quero dizer|refiro-me a|refiro me a|significa)\s+(?:o |a )?(.+)$/)))return {set:[m[1],m[2]],explicit:true};
  if((m=n.match(/^when i (?:say|type) (.+?),? i mean (?:the |my )?(.+)$/)))return {set:[m[1],m[2]],explicit:true};
  if((m=n.match(/^(?:o|a) (?:meu |minha )?([a-z0-9 ]{2,24}?) (?:e|é) (?:o|a) (.+)$/))&&!/^(que|qual|quanto|onde|como)\b/.test(m[1])&&avAliasResolve(m[2]))return {set:[m[1],m[2]]};
  return null;
}
function avAliasHandle(raw){
  const c=avAliasCmd(raw);if(!c)return false;const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;const A=avAliases();
  if(c.list){const ks=Object.keys(A);aurSay(ks.length?aurL('🏷️ As tuas alcunhas:\n','🏷️ Your aliases:\n')+ks.map(k=>'• <b>'+aurEsc(k)+'</b> → '+aurEsc(A[k])).join('\n'):aurL('Ainda não tens alcunhas. Experimenta: «quando eu disser banco, é o Millennium».','No aliases yet. Try: “when I say bank, I mean Millennium”.'));return true;}
  if(c.del){const k=aurNorm(c.del).trim();if(A[k]){delete A[k];avAliasSaveAll(A);aurSay(aurL('🏷️ Esqueci a alcunha «','🏷️ Forgot the alias “')+aurEsc(k)+aurL('».','”.'));}else aurSay(aurL('Não tenho nenhuma alcunha «','I don’t have an alias “')+aurEsc(k)+aurL('».','”.'));return true;}
  const alias=aurNorm(c.set[0]).trim(),target=avAliasResolve(c.set[1])||c.set[1].trim();
  if(!alias||alias.length>30){return false;}
  A[alias]=target;avAliasSaveAll(A);
  const found=!!avAliasResolve(c.set[1]);
  aurSay(aurL('🏷️ Combinado: quando disseres <b>«'+aurEsc(alias)+'»</b>, percebo <b>'+aurEsc(target)+'</b>.','🏷️ Got it: when you say <b>“'+aurEsc(alias)+'”</b>, I’ll understand <b>'+aurEsc(target)+'</b>.')+(found?'':aurL('\n<span class="a-dim">(Ainda não encontrei nada com esse nome no cofre.)</span>','\n<span class="a-dim">(I couldn’t find anything with that name in the vault yet.)</span>')),[{label:aurL('Experimentar: password do '+alias,'Try: '+alias+' password'),fn:()=>aurQuick(aurL('password do '+alias,alias+' password'))}]);
  return true;
}
function avApplyAliases(raw){
  const A=avAliases(),ks=Object.keys(A).sort((a,b)=>b.length-a.length);if(!ks.length)return raw;
  let n=' '+aurNorm(raw)+' ',hit=false;
  ks.forEach(k=>{const re=new RegExp('([\\s,.;:!?«»"“”(])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=[\\s,.;:!?«»"“”)])','g');if(re.test(n)){hit=true;n=n.replace(re,'$1'+aurNorm(A[k]));}});
  return hit?n.trim():raw;
}

/* ── resumo semanal (aviso discreto ao entrar numa semana nova; não é mais uma caixa no Dashboard) ── */
function avWeekId(d){const t=new Date(d||Date.now());t.setHours(0,0,0,0);t.setDate(t.getDate()-((t.getDay()+6)%7));return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}
function avWeakList(){const V=(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived&&v.pw);const cnt={};V.forEach(v=>{cnt[v.pw]=(cnt[v.pw]||0)+1;});return V.filter(v=>(typeof getPwScore==='function'&&getPwScore(v.pw)<2)||cnt[v.pw]>1);}
function avWeekSummary(){
  AUR.lang=aurAppLang();const en=avEn();
  const t0=new Date();t0.setHours(0,0,0,0);const t7=new Date(t0);t7.setDate(t7.getDate()+7);
  const ev=avCalEvents().filter(e=>e.d<t7).sort((a,b)=>a.d-b.d);
  const subs=ev.filter(e=>e.type==='renew'),other=ev.filter(e=>e.type!=='renew');
  const tot=subs.reduce((s,e)=>s+(parseFloat(String(e.amount||0).replace(',','.'))||0),0);
  const weak=avWeakList().length,old=(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived&&v.pw&&v.pwUpdated&&Date.now()-v.pwUpdated>365*864e5).length;
  const dd=d=>d.toLocaleDateString(en?'en-GB':'pt-PT',{weekday:'short',day:'2-digit',month:'2-digit'});
  let h=aurL('🗓️ <b>A tua semana</b>\n','🗓️ <b>Your week</b>\n');
  h+=other.length?other.slice(0,5).map(e=>'• ⏳ '+aurEsc(e.label)+' — '+dd(e.d)).join('\n')+'\n':aurL('• Nada expira esta semana ✓\n','• Nothing expires this week ✓\n');
  if(subs.length)h+='• 🔁 '+subs.length+aurL(subs.length===1?' subscrição renova':' subscrições renovam',subs.length===1?' subscription renews':' subscriptions renew')+(tot?' · '+tot.toFixed(2).replace('.',en?'.':',')+' €':'')+'\n';
  h+=weak?'• 🛡️ '+weak+aurL(weak===1?' password fraca ou repetida':' passwords fracas ou repetidas',weak===1?' weak or reused password':' weak or reused passwords')+'\n':aurL('• 🛡️ Passwords em ordem ✓\n','• 🛡️ Passwords look good ✓\n');
  if(old)h+='• 🔑 '+old+aurL(old===1?' password com mais de 1 ano':' passwords com mais de 1 ano',old===1?' password older than a year':' passwords older than a year');
  const ch=[];if(weak)ch.push({label:aurL('🛡️ Rever passwords fracas','🛡️ Fix weak passwords'),fn:()=>avCleanupStart()});if(ev.length)ch.push({label:aurL('📲 Enviar para o calendário','📲 Send to calendar'),fn:()=>avExportICS()});
  aurSay(h.replace(/\n$/,''),ch);
}
(function(){
  if(typeof doUnlock!=='function')return;const du=doUnlock;
  doUnlock=function(){const r=du.apply(this,arguments);setTimeout(()=>{try{
    if(!masterKey||presentationMode)return;const wk=avWeekId();if(localStorage.getItem('av_week_seen')===wk)return;
    if(!(typeof vault!=='undefined'&&vault.length))return;
    localStorage.setItem('av_week_seen',wk);
    avNudge(avEn()?'Your <b>weekly summary</b> is ready.':'O teu <b>resumo da semana</b> está pronto.',[{label:avEn()?'See':'Ver',fn:()=>{auroraOpen();avWeekSummary();}}],15000);
  }catch(e){}},5000);return r;};
})();

/* ── limpeza guiada das passwords fracas ou repetidas (uma a uma) ── */
const AVC={q:[],i:0,newPw:null,done:0,undo:null};
function avCleanupStart(){
  try{auroraOpen();}catch(e){}AUR.lang=aurAppLang();
  AVC.q=avWeakList().map(v=>v.id);AVC.i=0;AVC.done=0;AVC.newPw=null;AVC.undo=null;
  if(!AVC.q.length){aurSay(aurL('🛡️ Não tens passwords fracas nem repetidas. Excelente!','🛡️ You have no weak or reused passwords. Excellent!'));return;}
  aurSay(aurL('🛡️ Vamos rever <b>'+AVC.q.length+'</b> '+(AVC.q.length===1?'password':'passwords')+', uma de cada vez. Para cada uma: eu gero uma nova, tu mudas no site e eu guardo aqui.','🛡️ Let’s review <b>'+AVC.q.length+'</b> '+(AVC.q.length===1?'password':'passwords')+', one at a time. For each: I make a new one, you change it on the site, and I save it here.'));
  avCleanupStep();
}
function avCleanupCur(){return vault.find(v=>v.id===AVC.q[AVC.i]);}
function avCleanupStep(){
  while(AVC.i<AVC.q.length&&!avWeakList().some(v=>v.id===AVC.q[AVC.i]))AVC.i++;
  if(AVC.i>=AVC.q.length){aurSay(aurL('✅ Terminado! Atualizaste <b>'+AVC.done+'</b> '+(AVC.done===1?'password':'passwords')+'.','✅ Done! You updated <b>'+AVC.done+'</b> '+(AVC.done===1?'password':'passwords')+'.'));return;}
  const v=avCleanupCur(),V=avWeakList(),reused=(vault||[]).filter(x=>x.id!==v.id&&!x.archived&&x.pw===v.pw).map(x=>x.name);
  const why=reused.length?aurL('repetida também em: '+reused.slice(0,3).map(aurEsc).join(', '),'also used in: '+reused.slice(0,3).map(aurEsc).join(', ')):aurL('password fraca','weak password');
  aurSay('🛡️ <b>'+(AVC.i+1)+aurL(' de ',' of ')+AVC.q.length+'</b> · <b>'+aurEsc(v.name)+'</b>'+(v.user?' <span class="a-dim">('+aurEsc(v.user)+')</span>':'')+'\n'+why,
    [{label:aurL('🔑 Gerar nova e copiar','🔑 Make a new one & copy'),fn:()=>avCleanupGen()},{label:aurL('↩ Saltar','↩ Skip'),fn:()=>{AVC.i++;avCleanupStep();}},{label:aurL('⏹ Parar','⏹ Stop'),fn:()=>aurSay(aurL('Ok, parei. Continuas quando quiseres: «rever passwords fracas».','Ok, stopped. Continue anytime: “fix weak passwords”.'))}]);
}
function avCleanupGen(){
  const v=avCleanupCur();if(!v)return avCleanupStep();
  AVC.newPw=aurGenPw(20);try{copyText(AVC.newPw,aurL('Password nova copiada','New password copied'));}catch(e){}
  const ch=[];
  if(v.url)ch.push({label:aurL('🌐 Abrir o site','🌐 Open the site'),fn:()=>{let u=String(v.url).trim();if(!/^https?:\/\//i.test(u))u='https://'+u;try{window.open(u,'_blank','noopener');}catch(e){}}});
  ch.push({label:aurL('✓ Já mudei — guardar','✓ Changed it — save'),fn:()=>avCleanupSave()},{label:aurL('↩ Saltar','↩ Skip'),fn:()=>{AVC.newPw=null;AVC.i++;avCleanupStep();}});
  aurSay(aurL('📋 Copiei uma password nova (20 caracteres).\n1) Abre o site e muda lá a password — cola esta.\n2) Volta aqui e toca em «Já mudei — guardar».','📋 I copied a new password (20 characters).\n1) Open the site and change the password there — paste this one.\n2) Come back and tap “Changed it — save”.'),ch);
}
function avCleanupSave(){
  const v=avCleanupCur();if(!v||!AVC.newPw)return avCleanupStep();
  AVC.undo={id:v.id,pw:v.pw,at:v.pwUpdated};v.pw=AVC.newPw;v.pwUpdated=Date.now();AVC.newPw=null;AVC.done++;
  try{logActivity('edit',v.name,'🛡️');}catch(e){}markUnsaved();try{renderAll();}catch(e){}
  aurSay(aurL('✓ Guardado: <b>'+aurEsc(v.name)+'</b> tem agora uma password forte.','✓ Saved: <b>'+aurEsc(v.name)+'</b> now has a strong password.'),[{label:aurL('Próxima →','Next →'),fn:()=>{AVC.i++;avCleanupStep();}},{label:aurL('↶ Desfazer','↶ Undo'),fn:()=>{const u=AVC.undo,x=u&&vault.find(y=>y.id===u.id);if(x){x.pw=u.pw;x.pwUpdated=u.at;AVC.done=Math.max(0,AVC.done-1);markUnsaved();try{renderAll();}catch(e){}aurSay(aurL('↶ Voltei a pôr a password anterior do <b>'+aurEsc(x.name)+'</b>.','↶ Restored the previous password for <b>'+aurEsc(x.name)+'</b>.'),[{label:aurL('Continuar','Continue'),fn:()=>avCleanupStep()}]);}}}]);
}

/* ── ligação à Aurora: alcunhas, resumo semanal, limpeza, calendário ── */
(function(){
  if(typeof aurHandle!=='function')return;const ah=aurHandle;
  aurHandle=function(raw){
    if(typeof AVF!=='undefined'&&AVF.q&&AVF.q.awaiting)return ah.call(this,raw); // ficheiro à espera de destino: nomes de pastas ficam tal e qual
    if(raw&&avAliasHandle(raw))return true;
    const n=aurNorm(raw||'').replace(/[?!.]+$/,'').trim();
    const setL=()=>{const dl=aurDetectLang(raw);if(dl)AUR.lang=dl;};
    if(/^(resumo (da|desta) semana|a minha semana|como (esta|vai) a minha semana|weekly summary|my week|week summary)$/.test(n)){setL();avWeekSummary();return true;}
    if(/^(limpeza( das passwords)?|limpa(r)? (as )?passwords( fracas)?|rev(er|e) (as )?passwords( fracas)?|melhora(r)? (as )?(minhas )?passwords|passwords fracas|fix (my )?weak passwords|clean ?up (my )?passwords|weak passwords)$/.test(n)){setL();avCleanupStart();return true;}
    if(/\b(envia|enviar|exporta|exportar|mete|meter|poe|por|junta|juntar|adiciona|adicionar)\b.*\b(renovacoes|datas|validades|lembretes|avisos)\b.*\bcalendario\b|\b(export|send|add)\b.*\b(renewals|dates|reminders)\b.*\bcalendar\b/.test(n)){setL();aurSay(aurL('📲 A preparar as datas para o teu calendário…','📲 Preparing the dates for your calendar…'));avExportICS();return true;}
    return ah.call(this,avApplyAliases(raw));
  };
})();


/* ══ v9.82 — CARTÕES ESTILO REVOLUT ══
   Na frente só os últimos 4 dígitos. Os dados (número, validade, CVV, PIN) só entram na página depois de confirmares
   a identidade (impressão digital / PIN / palavra-passe mestra — a mesma verificação do ecrã de entrada) e saem outra vez ao esconder. */
const AV_CC={open:null,timer:0,left:0,authAt:0};
const AV_EYE='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const AV_EYE_OFF='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
const AV_COPY='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
function avCardNet(num){const d=String(num||'').replace(/\D/g,'');if(/^4/.test(d))return 'visa';if(/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d))return 'mc';if(/^3[47]/.test(d))return 'amex';if(/^(6011|65|64[4-9])/.test(d))return 'discover';return '';}
function avCardNetHTML(num,small){const n=avCardNet(num);const st=small?' style="position:static;font-size:1rem"':'';
  if(n==='visa')return '<span class="av-cc-net"'+st+'>VISA</span>';if(n==='mc')return '<span class="av-cc-net mc"'+st+'><i></i><i></i></span>';if(n==='amex')return '<span class="av-cc-net"'+st+'>AMEX</span>';if(n==='discover')return '<span class="av-cc-net"'+st+'>DISCOVER</span>';return '';}
function avCardGroup(num){const d=String(num||'').replace(/\D/g,'');if(!d)return '—';if(avCardNet(d)==='amex')return [d.slice(0,4),d.slice(4,10),d.slice(10)].filter(Boolean).join(' ');return d.replace(/(.{4})/g,'$1 ').trim();}
renderBankCards=function(){
  const grid=document.getElementById('cards-grid-area');if(!grid)return;
  avCardHideAll(true);
  const en=avEn(),activeCards=bankCards.filter(cd=>!cd.archived);
  if(!activeCards.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><p>'+t('cardEmpty')+'</p></div>';try{avEnhanceEmpty();}catch(e){}return;}
  const TL=t('cardTypeLabels')||{};
  const btn=(fn,svg,lbl,cls)=>'<button class="card-btn'+(cls?' '+cls:'')+'" '+avActAttrs(fn)+'>'+svg+' '+lbl+'</button>';
  grid.innerHTML=activeCards.map(card=>{
    const d=String(card.number||'').replace(/\D/g,''),last4=d.slice(-4)||'••••',col=card.color||'#1a3a6b';
    return '<div class="bank-card-wrap av-cc" id="cc-'+card.id+'">'
     +'<div class="av-cc-scene" data-act="avCardSceneTap" data-arg="'+esc(card.id)+'"><div class="av-cc-card">'
     +'<div class="av-cc-face av-cc-front" style="background:linear-gradient(135deg,'+col+','+col+'cc)">'
     +'<div class="av-cc-top"><span class="av-cc-bank">'+esc(card.bank||'')+'</span>'+(card.type&&TL[card.type]?'<span class="av-cc-badge">'+esc(TL[card.type])+'</span>':'')+'</div>'
     +'<div class="av-cc-chip"></div><svg class="av-cc-nfc" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17"/></svg>'
     +'<div class="av-cc-num">•••• •••• •••• '+esc(last4)+'</div><div class="av-cc-holder">'+esc(card.holder||'')+'</div>'+avCardNetHTML(d)
     +'</div><div class="av-cc-face av-cc-back" id="cc-back-'+card.id+'" style="background:linear-gradient(135deg,'+col+','+col+'cc)"></div>'
     +'</div></div>'
     +'<button class="av-cc-reveal" id="cc-btn-'+card.id+'" data-act="avCardReveal" data-arg="'+esc(card.id)+'">'+AV_EYE+'<span>'+(en?'Show details':'Mostrar dados')+'</span></button>'
     +'<div class="av-cc-timer" id="cc-timer-'+card.id+'"></div>'
     +'<div class="bank-card-actions">'
     +btn("openCardModal('"+card.id+"')",'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',en?'Edit':'Editar')
     +btn("archiveCard('"+card.id+"')",'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg>',en?'Archive':'Arquivar')
     +btn("deleteCard('"+card.id+"')",'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',en?'Delete':'Apagar','danger')
     +'</div>'+(card.notes?'<div style="font-size:.62rem;color:var(--text-muted);padding:4px 2px;line-height:1.5">'+esc(card.notes)+'</div>':'')+'</div>';
  }).join('');
};
function avCardBackHTML(c){
  const en=avEn(),d=String(c.number||'').replace(/\D/g,'');
  return '<div class="av-cc-stripe"></div>'
   +'<div class="av-cc-top"><span class="av-cc-bank">'+esc(c.bank||'')+'</span>'+avCardNetHTML(d,true)+'</div>'
   +'<div class="av-cc-row"><div><small>'+(en?'Card number':'Número do cartão')+'</small><div class="av-cc-big">'+esc(avCardGroup(d))+'</div></div>'+(d?'<button class="av-cc-cp" title="'+(en?'Copy number':'Copiar número')+'" data-act="avCardCopy" data-arg="'+esc(c.id)+'" data-arg2="number" data-stop>'+AV_COPY+'</button>':'')+'</div>'
   +'<div class="av-cc-row"><div><small>'+(en?'Expiry':'Validade')+'</small><div class="av-cc-mid">'+esc(c.expiry||'—')+'</div></div>'
   +'<div><small>CVV</small><div class="av-cc-mid">'+esc(c.cvv||'—')+'</div></div>'
   +(c.pin?'<div><small>PIN</small><div class="av-cc-mid av-cc-pin" data-act="avCardPinTap" data-arg="'+esc(c.id)+'" data-this data-stop>••••</div></div>':'')
   +'<div style="flex:1;text-align:right"><small>'+(en?'Holder':'Titular')+'</small><div class="av-cc-mid" style="font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.holder||'—')+'</div></div>'
   +(c.cvv?'<button class="av-cc-cp" title="'+(en?'Copy CVV':'Copiar CVV')+'" data-act="avCardCopy" data-arg="'+esc(c.id)+'" data-arg2="cvv" data-stop>'+AV_COPY+'</button>':'')+'</div>';
}
function avCardPin(el,id){const c=bankCards.find(x=>x.id===id);if(!c||AV_CC.open!==id)return;el.textContent=el.textContent==='••••'?c.pin:'••••';}
function avCardCopy(id,f){const c=bankCards.find(x=>x.id===id);if(!c||AV_CC.open!==id)return;const v=f==='number'?String(c.number||'').replace(/\D/g,''):String(c[f]||'');if(v)copyText(v,f==='number'?(avEn()?'Card number copied':'Número do cartão copiado'):(avEn()?'CVV copied':'CVV copiado'));}
function avCardSceneTap(id){if(AV_CC.open===id)avCardHide(id);}
async function avCardReveal(id){
  if(AV_CC.open===id){avCardHide(id);return;}
  const c=bankCards.find(x=>x.id===id);if(!c)return;
  const ok=await avAuth(avEn()?'To show the card details':'Para mostrar os dados do cartão');if(!ok)return;
  avCardHideAll(true);
  const wrap=document.getElementById('cc-'+id),back=document.getElementById('cc-back-'+id);if(!wrap||!back)return;
  back.innerHTML=avCardBackHTML(c);wrap.classList.add('flipped');AV_CC.open=id;
  const b=document.getElementById('cc-btn-'+id);if(b)b.innerHTML=AV_EYE_OFF+'<span>'+(avEn()?'Hide details':'Esconder dados')+'</span>';
  AV_CC.left=30;avCardTick();clearInterval(AV_CC.timer);AV_CC.timer=setInterval(avCardTick,1000);
}
function avCardTick(){const id=AV_CC.open;if(!id){clearInterval(AV_CC.timer);return;}const el=document.getElementById('cc-timer-'+id);
  if(AV_CC.left<=0){avCardHide(id);return;}if(el)el.textContent=(avEn()?'Hides automatically in ':'Esconde-se sozinho em ')+AV_CC.left+' s';AV_CC.left--;}
function avCardHide(id,instant){
  const wrap=document.getElementById('cc-'+id);if(wrap)wrap.classList.remove('flipped');
  if(AV_CC.open===id){AV_CC.open=null;clearInterval(AV_CC.timer);}
  const t=document.getElementById('cc-timer-'+id);if(t)t.textContent='';
  const b=document.getElementById('cc-btn-'+id);if(b)b.innerHTML=AV_EYE+'<span>'+(avEn()?'Show details':'Mostrar dados')+'</span>';
  const clear=()=>{const bk=document.getElementById('cc-back-'+id);if(bk&&AV_CC.open!==id)bk.innerHTML='';};
  if(instant)clear();else setTimeout(clear,850);
}
function avCardHideAll(instant){if(AV_CC.open)avCardHide(AV_CC.open,instant);}
/* confirmação de identidade (mesma verificação do ecrã de entrada) */
function avAuth(sub){
  if(Date.now()-AV_CC.authAt<60000)return Promise.resolve(true);
  return new Promise(async resolve=>{
    const en=avEn();let hasPin=false,hasBio=false;
    try{hasPin=!!(await getPinRec());}catch(e){}try{hasBio=!!(await idbGet('qu_bio'));}catch(e){}
    let ov=document.getElementById('av-auth');if(!ov){ov=document.createElement('div');ov.id='av-auth';document.body.appendChild(ov);}
    let done=false;const finish=ok=>{if(done)return;done=true;ov.classList.remove('open');ov.innerHTML='';if(ok)AV_CC.authAt=Date.now();resolve(ok);};
    const same=pw=>!masterPwRaw||pw===masterPwRaw;
    const FP='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 11c0 3.5-1 6.5-3 9M8.5 7.5A5 5 0 0 1 17 11c0 2-.3 4-1 6M5.5 9.5A8 8 0 0 1 12 4a8 8 0 0 1 8 8c0 1.5-.2 3-.5 4.3M12 15c-.3 2-1 4-2 5.5M15 13.5c0 2.5-.5 5-1.5 7"/></svg>';
    const show=mode=>{
      const alt=[];if(mode!=='bio'&&hasBio)alt.push(['bio',en?'Use fingerprint':'Usar impressão digital']);if(mode!=='pin'&&hasPin)alt.push(['pin',en?'Use PIN':'Usar PIN']);if(mode!=='master')alt.push(['master',en?'Use master password':'Usar palavra-passe mestra']);
      let body='';
      if(mode==='bio')body='<button class="av-auth-fp" id="av-auth-fp" aria-label="'+(en?'Use fingerprint':'Usar impressão digital')+'">'+FP+'</button><h4>'+(en?'Confirm it’s you':'Confirma que és tu')+'</h4><p>'+esc(sub)+'</p>';
      else body='<h4 style="margin-top:6px">'+(en?'Confirm it’s you':'Confirma que és tu')+'</h4><p>'+esc(sub)+'</p><input class="av-auth-in" id="av-auth-in" '+(mode==='pin'?'type="password" inputmode="numeric" autocomplete="off" placeholder="PIN"':'type="password" autocomplete="current-password" placeholder="'+(en?'Master password':'Palavra-passe mestra')+'" style="letter-spacing:1px;font-weight:500"')+'><button class="av-auth-go" id="av-auth-go">'+(en?'Confirm':'Confirmar')+'</button>';
      ov.innerHTML='<div class="av-auth-box" role="dialog" aria-modal="true"><button class="av-auth-x" aria-label="'+(en?'Cancel':'Cancelar')+'">✕</button>'+body+'<div class="av-auth-err" id="av-auth-err"></div><div class="av-auth-alt">'+alt.map(a=>'<button data-m="'+a[0]+'">'+a[1]+'</button>').join('')+'</div></div>';
      ov.classList.add('open');
      ov.querySelector('.av-auth-x').onclick=()=>finish(false);
      ov.onclick=e=>{if(e.target===ov)finish(false);};
      ov.querySelectorAll('.av-auth-alt button').forEach(b=>b.onclick=()=>show(b.dataset.m));
      const err=m=>{const e=document.getElementById('av-auth-err');if(e)e.textContent=m;};
      if(mode==='bio'){const go=async()=>{err('');const r=await tryBio();if(r&&r.pw&&same(r.pw))finish(true);else if(r&&r.gone){hasBio=false;show(hasPin?'pin':'master');}else if(r&&r.err==='cancelled')err(en?'Cancelled — tap the fingerprint to try again.':'Cancelado — toca na impressão digital para tentar outra vez.');else err(en?'Couldn’t confirm — try again or use another method.':'Não foi possível confirmar — tenta outra vez ou usa outro método.');};
        document.getElementById('av-auth-fp').onclick=go;go();}
      else{const inp=document.getElementById('av-auth-in'),gob=document.getElementById('av-auth-go');setTimeout(()=>inp.focus(),60);
        const go=async()=>{const v=inp.value;if(!v)return;gob.disabled=true;err('');
          if(mode==='pin'){const r=await tryPin(v);gob.disabled=false;
            if(r&&r.pw&&same(r.pw))return finish(true);
            if(r&&r.blocked){hasPin=false;err(en?'PIN blocked after too many tries — use the master password.':'PIN bloqueado por tentativas a mais — usa a palavra-passe mestra.');setTimeout(()=>show('master'),1400);return;}
            if(r&&r.gone){hasPin=false;show('master');return;}
            inp.value='';err((en?'Wrong PIN':'PIN errado')+(r&&r.left!=null?(en?' — '+r.left+' tries left':' — faltam '+r.left+' tentativas'):''));}
          else{gob.disabled=false;if(masterPwRaw&&v===masterPwRaw)return finish(true);inp.value='';err(en?'Wrong password':'Palavra-passe errada');}};
        gob.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go();if(e.key==='Escape')finish(false);};}
    };
    show(hasBio?'bio':(hasPin?'pin':'master'));
  });
}
(function(){
  if(typeof switchTab==='function'){const st=switchTab;switchTab=function(){avCardHideAll(true);return st.apply(this,arguments);};}
  if(typeof lockApp==='function'){const la=lockApp;lockApp=function(){avCardHideAll(true);AV_CC.authAt=0;return la.apply(this,arguments);};}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){avCardHideAll(true);AV_CC.authAt=0;}});
  if(typeof openCardModal==='function'){const oc=openCardModal;openCardModal=function(){const r=oc.apply(this,arguments);try{const l=document.getElementById('card-cvv-lbl');if(l)l.innerHTML='CVV <span style="font-size:.5rem;color:var(--text-muted);letter-spacing:1px">'+(avEn()?'(optional · encrypted)':'(opcional · encriptado)')+'</span>';}catch(e){}return r;};}
})();


