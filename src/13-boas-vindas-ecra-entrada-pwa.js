// ══ WELCOME SCREEN ══
let welcomeStep=0;
function renderWelcome(){
  const steps=(T[currentLang]||T.pt).welcomeSteps||T.pt.welcomeSteps;
  const total=steps.length;
  const step=steps[Math.min(welcomeStep,total-1)];
  const isFirst=welcomeStep===0;
  const isLast=welcomeStep>=total-1;
  const dots=[...Array(total)].map((_,i)=>`<div class="welcome-dot${i===welcomeStep?' active':''}"></div>`).join('');
  const inner=document.getElementById('welcome-inner');
  if(!inner)return;
  inner.innerHTML=`
    <div class="welcome-step active">
      <div class="welcome-icon">${step.icon}</div>
      <div class="welcome-title">${step.title}</div>
      <div class="welcome-text">${step.text}</div>
      <div class="welcome-dots">${dots}</div>
      <div class="welcome-btns">
        ${!isFirst?`<button class="btn btn-ghost" data-act="prevWelcome">${t('wBtnPrev')}</button>`:''}
        ${isLast
          ?`<button class="btn btn-gold" style="min-width:160px" data-act="skipWelcome">${t('wBtnDone')}</button>`
          :`<button class="btn btn-gold" style="min-width:160px" data-act="nextWelcome">${isFirst?t('wBtnStart'):t('wBtnNext')}</button>`
        }
      </div>
      ${!isLast?`<button class="welcome-skip" data-act="skipWelcome">${t('wBtnSkip')}</button>`:''}
    </div>`;
}
function showWelcome(){
  welcomeStep=0;
  try{renderWelcome();}catch(e){console.warn('renderWelcome error:',e);return;}
  setTimeout(()=>{
    const el=document.getElementById('welcome-screen');
    if(el)el.classList.add('show');
  },400);
}
function nextWelcome(){
  try{
    const total=(T[currentLang]||T.pt).welcomeSteps.length;
    if(welcomeStep>=total-1){skipWelcome();return;}
    welcomeStep++;renderWelcome();
  }catch(e){skipWelcome();}
}
function prevWelcome(){
  if(welcomeStep<=0)return;
  try{welcomeStep--;renderWelcome();}catch(e){}
}
function skipWelcome(){
  welcomeStep=0;
  try{
    const el=document.getElementById('welcome-screen');
    if(el)el.classList.remove('show');
  }catch(e){}
  try{localStorage.setItem('cv_welcomed','1');}catch(e){}
}
function checkFirstTime(){
  try{
    const welcomed=localStorage.getItem('cv_welcomed');
    if(!welcomed){showWelcome();}
  }catch(e){}
}

// ══ READ MODE ══
function openReadMode(id){
  const entry=vault.find(v=>v.id===id);if(!entry)return;
  const content=document.getElementById('read-content');
  const catLabel=getCatLabel(entry.cat);
  const userIcon2=entry.icon&&entry.icon!=='⭐'?entry.icon:null;
  const brandSvg=userIcon2?null:getBrandIcon(entry);
  const brandBadge=userIcon2?`<div class="read-brand-emoji">${userIcon2}</div>`:(brandSvg?`<div class="read-brand-logo">${brandSvg}</div>`:`<div class="read-brand-emoji">${getServiceIcon(entry.name)||'🔐'}</div>`);
  let html=`
    <div class="read-brand-head">${brandBadge}</div>
    <span class="read-card-cat">${vaultCatInfo(entry.cat).icon} ${esc(vaultCatInfo(entry.cat).label)}</span>
    <div class="read-card-title">${esc(entry.name)}</div>`;
  if(entry.user)html+=`<div class="read-field"><span class="read-field-label">${t('cardUser')}</span><div class="read-field-value">${esc(entry.user)}</div></div>`;
  if(entry.pw)html+=`<div class="read-field"><span class="read-field-label">${t('cardPw')}</span><div class="read-field-value masked" id="read-pw">••••••••••••</div></div>`;
  if(entry.url)html+=`<div class="read-field"><span class="read-field-label">${t('cardUrl')}</span><div class="read-field-value" style="font-size:.9rem;color:var(--accent-dim)">${esc(entry.url)}</div></div>`;
  if(entry.notes)html+=`<div class="read-field"><span class="read-field-label">${t('cardNotes')}</span><div class="read-field-value" style="font-size:.95rem;font-family:inherit;color:var(--text-muted)">${esc(entry.notes)}</div></div>`;
  if((entry.tags||[]).length)html+=`<div class="read-field"><span class="read-field-label">Tags</span><div style="display:flex;gap:6px;flex-wrap:wrap">${entry.tags.map(tag=>`<span class="card-tag" style="font-size:.68rem;padding:4px 10px">${esc(tag)}</span>`).join('')}</div></div>`;
  (entry.fields||[]).forEach(f=>{html+=`<div class="read-field"><span class="read-field-label">${esc(f.k)}</span><div class="read-field-value">${esc(f.v)}</div></div>`;});
  content.innerHTML=html;
  const actions=document.getElementById('read-actions');
  let actHtml='';
  if(entry.pw)actHtml+=`<button class="btn btn-gold" data-act="avReadTogglePw" data-arg="${esc(entry.id)}">${currentLang==='en'?'Show/Hide Password':'Mostrar/Esconder Password'}</button>`;
  if(entry.pw)actHtml+=`<button class="btn btn-ghost" data-act="avCopyPw" data-arg="${esc(entry.id)}">${currentLang==='en'?'Copy Password':'Copiar Password'}</button>`;
  if(isWifiEntry(entry))actHtml+=`<button class="btn btn-ghost" data-act="openWifiQR" data-arg="${esc(entry.id)}">📶 ${currentLang==='en'?'WiFi QR':'QR WiFi'}</button>`;
  if(entry.url)actHtml+=`<button class="btn btn-ghost" data-act="avGoSite" data-arg="${esc(entry.id)}">${t('btnGoSite')}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readShare" data-arg="${esc(entry.id)}">🔗 ${currentLang==='en'?'Share QR':'Partilhar QR'}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readEdit" data-arg="${esc(entry.id)}">${t('btnEdit')}</button>`;
  actions.innerHTML=actHtml;
  document.getElementById('read-modal').classList.add('open');
}

function openDocPreview(id){
  const doc=documents.find(d=>d.id===id);if(!doc)return;
  const content=document.getElementById('read-content');
  const catInfo=DOC_CATS[doc.cat]||{icon:'📋'};
  const fileIcon=doc.file?getFileIcon(doc.file.name):'📎';
  const autoIcon=getDocAutoIcon(doc);
  const expStatus=getExpiryStatus(doc.expiry);
  let html=`
    <span class="read-card-cat">${catInfo.icon} ${getDocCatLabel(doc.cat)}</span>
    <div class="read-card-title">${autoIcon} ${esc(doc.title)}</div>`;
  html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Location':'Localização'}</span><div class="read-field-value" style="font-size:.85rem">📍 ${esc(folderPathLabel(doc.folderId||null))}</div></div>`;
  if(doc.desc)html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Description':'Descrição'}</span><div class="read-field-value" style="font-size:.95rem;font-family:inherit;color:var(--text-muted);line-height:1.6">${esc(doc.desc)}</div></div>`;
  if(doc.date)html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Date':'Data'}</span><div class="read-field-value">${esc(doc.date)}</div></div>`;
  if(doc.expiry){
    const badge=expStatus?`<span class="doc-expiry-badge ${expStatus.cls}" style="font-size:.72rem;padding:4px 10px;margin-left:10px">⏰ ${expStatus.label}</span>`:'';
    html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'Expiry':'Validade'}</span><div class="read-field-value" style="display:flex;align-items:center">${esc(doc.expiry)}${badge}</div></div>`;
  }
  if(doc.file)html+=`<div class="read-field"><span class="read-field-label">${currentLang==='en'?'File':'Ficheiro'}</span><div class="read-field-value" style="font-size:.85rem">${fileIcon} ${esc(doc.file.name)} <span style="color:var(--text-muted);font-size:.75rem">(${formatFileSize(docFileBytes(doc.file))})</span></div></div>`;
  else html+=`<div class="read-field"><div style="font-size:.78rem;color:var(--text-muted);font-style:italic">${currentLang==='en'?'No file attached':'Sem ficheiro anexado'}</div></div>`;
  content.innerHTML=html;
  const actions=document.getElementById('read-actions');
  let actHtml='';
  if(doc.file)actHtml+=`<button class="btn btn-gold" data-act="downloadDoc" data-arg="${esc(doc.id)}">${currentLang==='en'?'⬇ Download':'⬇ Transferir'}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readOpenDoc" data-arg="${esc(doc.id)}">${t('btnEdit')}</button>`;
  actHtml+=`<button class="btn btn-ghost" data-act="readGoFolder" data-arg="${esc(doc.folderId||'')}">${currentLang==='en'?'Open folder':'Abrir pasta'}</button>`;
  actions.innerHTML=actHtml;
  document.getElementById('read-modal').classList.add('open');
}

function closeReadMode(){document.getElementById('read-modal').classList.remove('open');}

// ══ DRAG & DROP VAULT FILE ══
document.addEventListener('dragover',e=>{
  if(!document.getElementById('lock-screen').style.display||document.getElementById('lock-screen').style.display==='flex'||document.getElementById('lock-screen').style.display===''){
    e.preventDefault();
    document.getElementById('drag-overlay').classList.add('show');
  }
});
document.addEventListener('dragleave',e=>{
  if(!e.relatedTarget||e.relatedTarget===document.body){
    document.getElementById('drag-overlay').classList.remove('show');
  }
});
document.addEventListener('drop',e=>{
  e.preventDefault();
  document.getElementById('drag-overlay').classList.remove('show');
  const file=e.dataTransfer?.files[0];
  if(!file)return;
  const ls=document.getElementById('lock-screen');
  if(!ls||ls.style.display==='none'||lockedOut)return;   // com o cofre aberto, isto não é para aqui
  if(/\.(vault|cofre)$/i.test(file.name)){
    // Antes: backToInitial()/startOpenVault() apagavam o ficheiro largado e abriam o seletor — e a palavra-passe
    // acabava por ser tentada noutro ficheiro (o memorizado). Um ficheiro largado não tem «handle»: gravar pede o destino.
    backToInitial();
    pendingVaultFile=file;vaultFileHandle=null;
    document.getElementById('login-state-initial').style.display='none';
    document.getElementById('login-state-new').style.display='none';
    document.getElementById('login-state-open').style.display='block';
    document.getElementById('open-step-file').style.display='none';
    document.getElementById('open-step-pw').style.display='block';
    document.getElementById('l-file-name').textContent='📁 '+file.name;
    document.getElementById('master-pw').value='';
    showFileMeta(file);lockSubText();
    refreshQuickUnlock(true);
  }
});

try{applyLangStatic();}catch(e){console.warn('applyLangStatic error:',e);}
try{
  // Apply saved theme and colors
  document.documentElement.setAttribute('data-theme',currentTheme);
  document.getElementById('theme-btn') && (document.getElementById('theme-btn').textContent=currentTheme==='dark'?'🌙':'☀️');
  applyThemeColors(currentTheme);
}catch(e){console.warn('applyThemeColors error:',e);}
try{renderHowTo();}catch(e){console.warn('renderHowTo error:',e);}
try{refreshContinueBtn();}catch(e){}

/* ══ ENTRADA DIRETA — cofre memorizado → pede logo o PIN ══
   O PIN desembrulha a chave guardada neste dispositivo e não precisa do ficheiro; o ficheiro só é
   lido no momento de entrar. O Chrome exige um toque para autorizar o acesso ao ficheiro, por isso
   essa autorização é pedida ao tocar no campo ou em «Entrar no Cofre» — nunca sozinha. */
let lockHeldPw=null,lockHeldQk=null,lockEnsureP=null;
function lockOnPwStep(){const o=document.getElementById('login-state-open'),s=document.getElementById('open-step-pw');return !!(o&&s&&o.style.display!=='none'&&s.style.display!=='none');}
function lockSubText(){
  const en=currentLang==='en',sub=document.getElementById('l-panel-sub');if(!sub)return;
  const newOn=document.getElementById('login-state-new')&&document.getElementById('login-state-new').style.display!=='none';
  sub.textContent=lockOnPwStep()?(en?'Access your digital vault':'Acede ao teu cofre digital'):newOn?(en?'Create your vault':'Cria o teu cofre'):(en?'Choose how to begin':'Escolhe como queres começar');
}
function lockLangExtras(){
  const en=currentLang==='en';
  const s=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};
  s('l-enter-txt',en?'Enter the Vault':'Entrar no Cofre');
  s('l-back-mine',en?'← Back to my vault':'← Voltar ao meu cofre');
  s('l-forget-mine',en?'Forget':'Esquecer');
  s('lock-encrypt-short',en?'100% Encrypted · 100% Offline':'100% Encriptado · 100% Offline');
  s('l-master-label',en?'Master password':'Palavra-passe mestra');
  s('lk-start-label',en?'Master password':'Palavra-passe mestra');
  s('lk-start-msg',en?'Create a new vault or load one you already have.':'Cria um cofre novo ou carrega um que já tenhas.');
  lockSwipeText();
  if(lockOnPwStep()&&typeof applyUnlockMode==='function')try{applyUnlockMode(false);}catch(e){}
}
function lockShowPwStep(){
  ['login-state-initial','login-state-new'].forEach(i=>{const e=document.getElementById(i);if(e)e.style.display='none';});
  document.getElementById('login-state-open').style.display='block';
  document.getElementById('open-step-file').style.display='none';
  document.getElementById('open-step-pw').style.display='block';
  document.getElementById('master-pw').value='';
  lockSubText();
}
async function lockDirectInit(){
  if(pendingVaultFile||pendingVaultText||lockedOut)return false;
  if(!FSA_OK)return avDevInit();
  let hd=null;try{hd=await idbGet('vaultHandle');}catch(e){}
  if(!hd&&!pendingVaultFile&&!pendingVaultText&&localStorage.getItem('av_dev_mode')==='1')return avDevInit(true);
  if(!hd||pendingVaultFile||pendingVaultText)return false;
  vaultFileHandle=hd;lockSwipeNeed=true;lockSwipeRetry=false;lockShowPwStep();
  const fn=document.getElementById('l-file-name');if(fn)fn.textContent=hd.name||'';
  const fm=document.getElementById('l-file-meta');if(fm)fm.style.display='none';
  let granted=false;
  try{granted=(await hd.queryPermission({mode:'readwrite'}))==='granted';}catch(e){}
  if(granted){try{const f=await hd.getFile();pendingVaultFile=f;showFileMeta(f);}catch(e){granted=false;}}
  if(!granted&&await lockUseSyncedCopy(hd))return true;
  await refreshQuickUnlock(granted);
  return true;
}
/* Com o Drive ligado, desbloqueia pela cópia encriptada interna (sempre atualizada ao gravar) em vez do ficheiro:
   o Chrome no Android não guarda a autorização do ficheiro, e assim não pergunta nada. Depois de entrar, o Drive
   sincroniza como sempre; o ficheiro só é pedido quando se grava à mão. */
async function lockUseSyncedCopy(hd){
  if(typeof driveOn!=='function'||!driveOn())return false;
  let loc=null,link=null;
  try{loc=await localVaultGet();link=await idbGet('av_local_link');}catch(e){}
  if(!loc||!loc.json||!link||link.name!==hd.name||!link.salt||vaultSaltOf(loc.json)!==link.salt)return false;
  if(pendingVaultFile||pendingVaultText)return false;
  pendingVaultText=loc.json;
  const en=currentLang==='en',fn=document.getElementById('l-file-name');
  if(fn)fn.textContent='☁️ '+hd.name+' · '+(en?'synced with Drive':'sincronizado com o Drive');
  await refreshQuickUnlock(true);
  return true;
}
function lockEnsureFile(){
  if(pendingVaultFile||pendingVaultText)return Promise.resolve(true);
  if(lockEnsureP)return lockEnsureP;
  lockEnsureP=(async()=>{
    const en=currentLang==='en';
    let hd=vaultFileHandle;if(!hd){try{hd=await idbGet('vaultHandle');}catch(e){}}
    if(!hd){lockOtherVault();return false;}
    try{
      let perm=await hd.queryPermission({mode:'readwrite'});
      if(perm!=='granted')perm=await hd.requestPermission({mode:'readwrite'});
      if(perm!=='granted'){setLockError(en?'Allow access to the vault file to continue.':'Autoriza o acesso ao ficheiro do cofre para continuar.');return false;}
      vaultFileHandle=hd;
      const f=await hd.getFile();pendingVaultFile=f;showFileMeta(f);
      return true;
    }catch(e){
      if(e&&(e.name==='SecurityError'||e.name==='NotAllowedError')){setLockError(en?'Tap “Enter the Vault” to allow access to the file.':'Toca em «Entrar no Cofre» para autorizar o acesso ao ficheiro.');return false;}
      toast(en?'Could not open the file.':'Não foi possível abrir o ficheiro.');
      try{await idbDel('vaultHandle');}catch(_){}
      vaultFileHandle=null;lockOtherVault();return false;
    }
  })();
  lockEnsureP.finally(()=>{lockEnsureP=null;});
  return lockEnsureP;
}
function lockFieldTap(kind){
  const el=document.getElementById(kind==='pin'?'pin-input':'master-pw');
  if(el&&document.activeElement!==el)el.focus();
  if(!pendingVaultFile&&!pendingVaultText)lockEnsureFile();
}
function lockToggleEye(id){
  const el=document.getElementById(id);if(!el)return;
  el.type=el.type==='password'?'text':'password';
  const b=el.parentElement&&el.parentElement.querySelector('.lk-eye');if(b)b.classList.toggle('on',el.type==='text');
  el.focus();
}
async function lockEnter(){
  if(lockedOut)return;
  const en=currentLang==='en';
  if(lockHeldPw){const pw=lockHeldPw,qk=lockHeldQk;if(await lockEnsureFile())submitOpenVault(pw,qk);return;}
  if(unlockMode==='bio')return lockBioStart();
  if(unlockMode==='pin'){
    const el=document.getElementById('pin-input');
    const n=quickAvail.pinLen;
    if(el&&el.value.length>=n)return onPinInput();
    const ok=await lockEnsureFile();
    if(el)el.focus();
    const err=document.getElementById('pin-err');
    if(ok&&err)err.textContent=en?`Enter your ${n}-digit PIN.`:`Introduz o PIN de ${n} dígitos.`;
    return;
  }
  const mp=document.getElementById('master-pw');
  if(mp&&!mp.value){mp.focus();if(!pendingVaultFile&&!pendingVaultText)lockEnsureFile();return;}
  return submitOpenVault();
}
async function lockMineLinks(){
  const box=document.getElementById('l-mine-links');if(!box)return;
  let hd=null;if(FSA_OK){try{hd=await idbGet('vaultHandle');}catch(e){}}
  let dev=false;if(!FSA_OK){try{const l=await localVaultGet();dev=!!(l&&l.json);}catch(e){}}
  const has=!!(pendingVaultFile||pendingVaultText||hd||dev);
  box.style.display=has?'flex':'none';
  avDevHint(!FSA_OK&&!has);
  const fg=document.getElementById('l-forget-mine'),sep=box.querySelector('.link-sep');
  if(fg)fg.style.display=hd?'':'none';if(sep)sep.style.display=hd?'':'none';
}
function lockOtherVault(){
  document.getElementById('login-state-open').style.display='none';
  document.getElementById('login-state-new').style.display='none';
  document.getElementById('login-state-initial').style.display='block';
  document.getElementById('lock-error').textContent='';
  lockSubText();lockMineLinks();
}
function lockBackToMine(){
  if(pendingVaultFile||pendingVaultText){lockShowPwStep();refreshQuickUnlock(false);return;}
  lockDirectInit().then(ok=>{if(!ok)lockMineLinks();});
}
async function lockForgetMine(){
  const en=currentLang==='en';
  if(!confirm(en?'Forget the remembered vault on this device? The file itself is not touched.':'Esquecer o cofre memorizado neste dispositivo? O ficheiro em si não é alterado.'))return;
  try{await idbDel('vaultHandle');}catch(e){}
  vaultFileHandle=null;pendingVaultFile=null;pendingVaultText=null;lockHeldPw=null;
  lockMineLinks();toast(en?'Vault forgotten on this device.':'Cofre esquecido neste dispositivo.');
}

/* ══ ECRÃ DE ENTRADA v10.8 — cofre memorizado: «desliza para cima» → impressão digital (ou PIN, ou palavra-passe);
   primeira vez: palavra-passe mestra logo à vista + «Carregar cofre» / «Criar cofre» ══ */
var lockSwipeNeed=false,lockTypedPw='',lockBioPrompting=false,lockSwipeRetry=false;
// Pede a impressão digital já (tem de ser dentro do gesto: deslizar, tocar ou escolher o ficheiro); se não der, volta o «desliza»
function lockBioStart(){
  lockBioPrompting=true;lockSwipeNeed=false;
  applyUnlockMode(false);
  return Promise.resolve(doBioUnlock(false)).then(r=>{
    lockBioPrompting=false;
    if(r==='ok'||r==='busy'||(typeof masterKey!=='undefined'&&masterKey))return;
    if(r==='gone'){lockSwipeRetry=false;return;}
    lockSwipeNeed=true;lockSwipeRetry=true;applyUnlockMode(false);
  },()=>{lockBioPrompting=false;lockSwipeNeed=true;lockSwipeRetry=true;applyUnlockMode(false);});
}
function lockSwipeText(){
  const en=currentLang==='en',touch=!window.matchMedia||matchMedia('(pointer:coarse)').matches;
  const t=lockSwipeRetry?(touch?(en?'Swipe up to try again':'Desliza para cima para tentar outra vez'):(en?'Click or swipe up to try again':'Clica ou desliza para cima para tentar outra vez'))
    :touch?(en?'Swipe up to unlock':'Desliza para cima para desbloquear'):(en?'Click or swipe up to unlock':'Clica ou desliza para cima para desbloquear');
  const el=document.getElementById('lk-swipe-txt');if(el)el.textContent=t;
  const sw=document.getElementById('lk-swipe');if(sw)sw.setAttribute('aria-label',t);
}
function lockSwipeApply(){
  const sw=document.getElementById('lk-swipe');if(!sw)return;
  const on=lockSwipeNeed&&!lockedOut&&lockOnPwStep();
  sw.style.display=on?'':'none';sw.classList.remove('gone');sw.style.removeProperty('--dy');
  ['quick-unlock','master-entry','l-enter-btn'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.toggle('lk-hide',on);});
  const ln=document.getElementById('unlock-links');if(ln)ln.classList.toggle('lk-hide',on&&!lockSwipeRetry);   // depois de uma falha: «Usar PIN», «Recuperar acesso»…
  if(on)lockSwipeText();
}
function lockSwipeGo(){
  if(!lockSwipeNeed)return;
  lockSwipeNeed=false;
  const sw=document.getElementById('lk-swipe');
  if(sw)sw.classList.add('gone');
  if(unlockMode==='bio'){lockSwipeRetry=false;return lockBioStart();}
  setTimeout(()=>{
    lockSwipeApply();
    if(unlockMode==='bio')doBioUnlock(false);
    else{const el=document.getElementById(unlockMode==='pin'?'pin-input':'master-pw');if(el)el.focus();}
  },sw?180:0);
}
(function(){
  const sw=typeof document!=='undefined'&&document.getElementById('lk-swipe');if(!sw)return;
  let y0=null,dy=0;
  const end=e=>{
    if(y0===null)return;
    const d=dy;y0=null;dy=0;sw.classList.remove('drag');
    if(d<-60||(e.type==='pointerup'&&e.pointerType==='mouse'&&d>-6))return lockSwipeGo();
    sw.style.removeProperty('--dy');
    if(e.type==='pointerup'){sw.classList.remove('nudge');void sw.offsetWidth;sw.classList.add('nudge');}
  };
  sw.addEventListener('pointerdown',e=>{if(!lockSwipeNeed)return;y0=e.clientY;dy=0;sw.classList.add('drag');try{sw.setPointerCapture(e.pointerId);}catch(_){}});
  sw.addEventListener('pointermove',e=>{if(y0===null)return;dy=Math.min(0,e.clientY-y0);sw.style.setProperty('--dy',Math.max(dy,-140)+'px');});
  sw.addEventListener('pointerup',end);sw.addEventListener('pointercancel',end);
  sw.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();lockSwipeGo();}});
})();
function lockStartPw(){const el=document.getElementById('start-pw');return el?el.value:'';}
function lockStartOpen(){
  lockTypedPw=lockStartPw();
  const el=document.getElementById('start-pw');if(el)el.value='';
  startOpenVault();
}
function lockStartNew(){
  const pw=lockStartPw(),en=currentLang==='en';
  if(!pw){setLockError(en?'Type the master password you want to use first.':'Escreve primeiro a palavra-passe mestra que queres usar.');const el=document.getElementById('start-pw');if(el)el.focus();return;}
  if(pw.length<4){setLockError(t('lockMinChars'));return;}
  document.getElementById('start-pw').value='';
  startNewVault();
  const p1=document.getElementById('new-pw1');p1.value=pw;
  try{onNewPw1Input();}catch(e){}
  setTimeout(()=>{const p2=document.getElementById('new-pw2');if(p2)p2.focus();},140);
}
function lockStartEnter(){
  const en=currentLang==='en';
  if(!lockStartPw()){const el=document.getElementById('start-pw');if(el)el.focus();return;}
  setLockError(en?'Now choose: Load vault or Create vault.':'Agora escolhe: Carregar cofre ou Criar cofre.');
}
// Palavra-passe escrita no início + ficheiro escolhido → entra logo
function lockUseTypedPw(){
  const pw=lockTypedPw;lockTypedPw='';if(!pw)return;
  _avUserMode='master';unlockMode='master';applyUnlockMode(false);
  const mp=document.getElementById('master-pw');if(mp)mp.value=pw;
  submitOpenVault();
}

/* ══ AURORA DO ECRÃ DE ENTRADA — fotografia (ampliada a 4K) com a aurora animada na placa gráfica (WebGL) ══
   As imagens nítidas vão embutidas neste ficheiro (funciona em qualquer sítio, até aberto do PC); a miniatura
   aparece logo, desfocada, e dá lugar à nítida assim que esta é descodificada. Só os píxeis da aurora ondulam e pulsam; montanhas, neve e
   rochas ficam quietas; as estrelas cintilam. Desenha à resolução real do ecrã (até 2,5×) e baixa sozinha se o
   aparelho for lento. Sem WebGL ou com «reduzir movimento» fica a fotografia nítida estática. */
const AURORA_IMG={p:{src:'img/aurora-p.webp',ph:'data:image/webp;base64,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'},l:{src:'img/aurora-l.webp',ph:'data:image/webp;base64,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'}};
const ASKY={run:false,raf:0,last:0,t:8,gl:null,prog:null,loc:null,tex:{},hi:{},levels:null,lv:0,slow:0,cw:0,ch:0,maxTex:4096};
function askyPick(){return window.innerWidth/Math.max(1,window.innerHeight)<1?'p':'l';}
// Ecrãs grandes com densidade 2× passavam de 5 milhões de píxeis por frame: aí começa em 1,5× (a foto fica igual)
function askyScale(){if(!ASKY.levels){let d=Math.min(window.devicePixelRatio||1,2);if(d>1.5&&innerWidth*innerHeight*d*d>3.5e6)d=1.5;ASKY.levels=[...new Set([d,Math.min(d,1.5),1])];}return ASKY.levels[ASKY.lv]||1;}
function askyHi(k){
  if(ASKY.hi[k])return ASKY.hi[k];
  const o={img:new Image(),ok:false};ASKY.hi[k]=o;
  o.img.decoding='async';
  o.img.onload=()=>{o.ok=true;const el=document.getElementById('asky-img');
    if(el&&el.dataset.k===k){el.style.backgroundImage='url('+AURORA_IMG[k].src+')';el.classList.add('sharp');}
    if(ASKY.gl&&!ASKY.run)askyDraw();};
  o.img.src=AURORA_IMG[k].src;
  return o;
}
function askyBg(){
  const el=document.getElementById('asky-img');if(!el)return;const k=askyPick();
  if(el.dataset.k===k)return;el.dataset.k=k;
  const o=askyHi(k);el.classList.toggle('sharp',o.ok);
  el.style.backgroundImage='url('+(o.ok?AURORA_IMG[k].src:AURORA_IMG[k].ph)+')';
}
function askySize(force){
  const sky=document.getElementById('asky'),cv=document.getElementById('aurora-gl');if(!sky||!cv)return;
  const w=window.innerWidth,hh=window.innerHeight;
  if(!force&&w===ASKY.cw&&hh<=ASKY.ch)return;
  ASKY.ch=w===ASKY.cw?Math.max(ASKY.ch,hh):hh;ASKY.cw=w;
  sky.style.height=ASKY.ch+'px';
  const s=askyScale();cv.width=Math.round(w*s);cv.height=Math.round(ASKY.ch*s);
  askyBg();
}
const ASKY_VS='attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
const ASKY_FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_img;uniform vec2 u_res,u_isz;uniform float u_t,u_sky;varying vec2 v;
float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1.,0.)),f.x),mix(h12(i+vec2(0.,1.)),h12(i+vec2(1.,1.)),f.x),f.y);}
float amask(vec3 c){float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));
  float gr=smoothstep(.03,.16,c.g-max(c.r,c.b)),mg=smoothstep(.02,.10,min(c.r,c.b)-c.g);
  return max(gr,mg)*smoothstep(.07,.22,mx)*smoothstep(.05,.14,mx-mn);}
void main(){
  float A=u_res.x/u_res.y,B=u_isz.x/u_isz.y;
  vec2 s=A>B?vec2(1.,B/A):vec2(A/B,1.);
  vec2 uv=(v-.5)*s+.5;
  vec3 base=texture2D(u_img,uv).rgb;float m0=amask(base);float t=u_t;
  float n=vn(uv*vec2(3.,5.)+vec2(t*.06,-t*.04));
  vec2 off=vec2(sin(uv.y*20.+t*.8+n*6.2832)*.0042+(vn(uv*7.+t*.12)-.5)*.005,sin(uv.x*13.-t*.55+n*4.)*.0032);
  vec3 dsp=texture2D(u_img,uv+off).rgb;float m=min(m0,amask(dsp));
  vec3 col=mix(base,dsp,m);
  float ray=vn(vec2(uv.x*80.+n*4.,t*.4));
  float pulse=.5+.5*sin(uv.x*8.+uv.y*5.-t*.7+n*5.);
  col*=1.+m0*(.26*(ray-.5)+.2*(pulse-.5));
  if(uv.y<u_sky){
    vec2 ref=u_isz*(1024./max(u_isz.x,u_isz.y));vec2 px=2./ref;vec3 W=vec3(.3333);
    float lc=dot(base,vec3(.299,.587,.114));
    float ln=(dot(texture2D(u_img,uv+vec2(px.x,0.)).rgb,W)+dot(texture2D(u_img,uv-vec2(px.x,0.)).rgb,W)+dot(texture2D(u_img,uv+vec2(0.,px.y)).rgb,W)+dot(texture2D(u_img,uv-vec2(0.,px.y)).rgb,W))*.25;
    float star=smoothstep(.06,.22,lc-ln)*(1.-m0)*(1.-smoothstep(.10,.18,ln));
    float ph=h12(floor(uv*ref));
    col*=1.+star*(.5+.5*sin(t*(1.2+ph*2.4)+ph*6.2832)-.5)*1.1;
  }
  gl_FragColor=vec4(col,1.);
}`;
function askyGL(){
  try{
    const cv=document.getElementById('aurora-gl');if(!cv)return false;
    const gl=cv.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
    if(!gl)return false;
    const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,ASKY_VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,ASKY_FS));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const ap=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
    ASKY.prog=pr;ASKY.loc={res:gl.getUniformLocation(pr,'u_res'),isz:gl.getUniformLocation(pr,'u_isz'),t:gl.getUniformLocation(pr,'u_t'),sky:gl.getUniformLocation(pr,'u_sky')};
    ASKY.maxTex=Math.min(8192,gl.getParameter(gl.MAX_TEXTURE_SIZE)||4096);
    cv.addEventListener('webglcontextlost',e=>{e.preventDefault();ASKY.run=false;ASKY.gl=false;cv.classList.remove('on');},{once:true});
    return gl;
  }catch(e){console.warn('Aurora WebGL:',e.message);return false;}
}
function askyTex(k){
  const hi=askyHi(k);if(!hi.ok)return null;
  const gl=ASKY.gl,cv=gl.canvas,iw=hi.img.naturalWidth,ih=hi.img.naturalHeight,B=iw/ih,A=cv.width/cv.height;
  const need=Math.ceil((A>B?cv.width:cv.height*B)*1.1);
  let o=ASKY.tex[k];
  if(o&&o.tw>=Math.min(need,iw))return o;
  let tw=Math.min(iw,need,ASKY.maxTex),th=Math.round(tw/B);
  if(th>ASKY.maxTex){th=ASKY.maxTex;tw=Math.round(th*B);}
  let src=hi.img;
  if(tw<iw){
    // Reduzir uma foto 4K bloqueava o ecrã dezenas de ms: createImageBitmap faz isso fora da thread principal
    if(window.createImageBitmap&&!hi.bmpFail){
      if(!(hi.bmp&&hi.bmpTw===tw)){
        if(hi.bmpReq!==tw){hi.bmpReq=tw;createImageBitmap(hi.img,{resizeWidth:tw,resizeHeight:th,resizeQuality:'high'})
          .then(b=>{if(hi.bmp&&hi.bmp.close)hi.bmp.close();hi.bmp=b;hi.bmpTw=tw;if(ASKY.gl&&!ASKY.run)askyDraw();})
          .catch(()=>{hi.bmpFail=true;hi.bmpReq=0;});}
        return o||null; // até estar pronta vê-se a fotografia normal (sem animação)
      }
      src=hi.bmp;
    }else{const c=document.createElement('canvas');c.width=tw;c.height=th;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(hi.img,0,0,tw,th);src=c;}
  }
  try{
    if(!o){o={t:gl.createTexture(),tw:0,th:0};ASKY.tex[k]=o;}
    gl.bindTexture(gl.TEXTURE_2D,o.t);
    [[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR]].forEach(q=>gl.texParameteri(gl.TEXTURE_2D,q[0],q[1]));
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,src);
    o.tw=tw;o.th=th;return o;
  }catch(e){console.warn('Aurora textura:',e.message);ASKY.gl=false;ASKY.run=false;cv.classList.remove('on');return null;}
}
function askyDraw(){
  const gl=ASKY.gl;if(!gl)return false;
  const k=askyPick(),o=askyTex(k);if(!o)return false;
  const cv=gl.canvas,L=ASKY.loc;
  gl.viewport(0,0,cv.width,cv.height);gl.useProgram(ASKY.prog);gl.bindTexture(gl.TEXTURE_2D,o.t);
  gl.uniform2f(L.res,cv.width,cv.height);gl.uniform2f(L.isz,o.tw,o.th);gl.uniform1f(L.t,ASKY.t);gl.uniform1f(L.sky,k==='p'?.5:.3);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  if(!cv.classList.contains('on'))cv.classList.add('on');
  return true;
}
function askyFrame(ts){
  if(!ASKY.run)return;
  const ls=document.getElementById('lock-screen');
  if(!ls||ls.style.display==='none'||document.hidden){ASKY.run=false;if(ls&&ls.style.display==='none'&&ASKY.bgPaused){ASKY.bgPaused=false;try{AuroraBG.start();}catch(e){}}return;}
  if(avIdle()){ASKY.run=false;return;} // fica o último frame; volta ao primeiro toque
  ASKY.raf=requestAnimationFrame(askyFrame);
  if(ASKY.last&&ts-ASKY.last<33)return;
  const dt=ASKY.last?ts-ASKY.last:33;ASKY.last=ts;ASKY.t+=Math.min(.1,dt/1000);
  askyDraw();
  ASKY.slow=dt>75?ASKY.slow+1:Math.max(0,ASKY.slow-1);
  if(ASKY.slow>30){ASKY.slow=0;if(ASKY.lv<ASKY.levels.length-1){ASKY.lv++;askySize(true);}else{ASKY.run=false;}}
}
function auroraSkyStart(){
  if(typeof document==='undefined')return;
  const ls=document.getElementById('lock-screen');if(!ls||ls.style.display==='none')return;
  askySize(false);askyBg();
  if(ASKY.gl===null)ASKY.gl=askyGL();
  try{if(typeof AuroraBG!=='undefined'&&AuroraBG.stop){AuroraBG.stop();ASKY.bgPaused=true;}}catch(e){}
  if(!ASKY.gl)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){askyDraw();return;}
  if(ASKY.run)return;
  ASKY.run=true;ASKY.last=0;ASKY.raf=requestAnimationFrame(askyFrame);
}
window.addEventListener('resize',()=>{askySize(false);if(ASKY.gl&&!ASKY.run)askyDraw();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)auroraSkyStart();});
AV_IDLE.cbs.push(()=>{try{
  const ls=document.getElementById('lock-screen');
  if(ls&&ls.style.display==='none'){if(ASKY.bgPaused){ASKY.bgPaused=false;AuroraBG.start();}return;}
  auroraSkyStart();
}catch(e){}});
try{auroraSkyStart();}catch(e){}
try{lockDirectInit();}catch(e){}
try{lockMineLinks();lockLangExtras();lockSubText();}catch(e){}
try{const lv=document.getElementById('l-version');if(lv)lv.textContent='v'+APP_VERSION;}catch(e){}
try{applyPrivacy();}catch(e){}

// ══ PWA ══
try{buildManifest();}catch(e){console.warn('buildManifest:',e);}
if('serviceWorker' in navigator){
  const hadController=!!navigator.serviceWorker.controller;
  let swReloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController||swReloaded)return;
    swReloaded=true;
    const safe=!masterKey&&!document.querySelector('.modal-overlay.open');
    if(safe){location.reload();}
    else{
      window.__cvUpdateReady=true;
      toast(currentLang==='en'?'✨ Update ready — lock (Ctrl+L) to apply':'✨ Atualização pronta — bloqueia (Ctrl+L) para aplicar');
    }
  });
  // Só depois de a página carregar: na 1.ª visita, a instalação competia pela rede com a app e com a foto do fundo
  const avSwPrecache=reg=>{try{
    const urls=performance.getEntriesByType('resource').map(r=>r.name).filter(u=>u.startsWith(location.origin)&&/\.(webp|woff2)$/.test(new URL(u).pathname));
    const w=reg.active||navigator.serviceWorker.controller;if(urls.length&&w)w.postMessage({type:'av-precache',urls});
  }catch(e){}};
  const avSwRegister=()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
    .then(()=>navigator.serviceWorker.ready).then(avSwPrecache).catch(()=>{});
  if(document.readyState==='complete')setTimeout(avSwRegister,800);
  else addEventListener('load',()=>setTimeout(avSwRegister,800),{once:true});
  const _origLockApp=lockApp;
  lockApp=function(){_origLockApp();if(window.__cvUpdateReady)setTimeout(()=>location.reload(),300);};
}

