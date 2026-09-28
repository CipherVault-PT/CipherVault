// ══ CRYPTO ══ → js/crypto.js

// ══ INDEXEDDB KV (handles de ficheiros) ══
// Uma só ligação reutilizada (antes abria-se uma nova em cada leitura/escrita e nenhuma era fechada)
let _idbP=null;
function idbOpen(){
  if(_idbP)return _idbP;
  _idbP=new Promise((res,rej)=>{
    const r=indexedDB.open('ciphervault',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('kv');
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();_idbP=null;};db.onclose=()=>{_idbP=null;};res(db);};
    r.onerror=()=>{_idbP=null;rej(r.error);};
  });
  return _idbP;
}
function idbTx(mode,run){
  const attempt=retry=>idbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction('kv',mode);
    tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('abort'));
    run(tx.objectStore('kv'),tx,res,rej);
  })).catch(e=>{if(retry&&e&&e.name==='InvalidStateError'){_idbP=null;return attempt(false);}throw e;});
  return attempt(true);
}
async function idbSet(k,v){return idbTx('readwrite',(st,tx,res)=>{st.put(v,k);tx.oncomplete=()=>res();});}
async function idbGet(k){return idbTx('readonly',(st,tx,res,rej)=>{const rq=st.get(k);rq.onsuccess=()=>res(rq.result);rq.onerror=()=>rej(rq.error);});}
async function idbDel(k){return idbTx('readwrite',(st,tx,res)=>{st.delete(k);tx.oncomplete=()=>res();});}

// ══ FILE SYSTEM ACCESS ══
let vaultFileHandle=null;
const FSA_OK='showOpenFilePicker' in window;
async function refreshContinueBtn(){
  const wrap=document.getElementById('l-continue-wrap');if(!wrap)return;
  if(!FSA_OK){wrap.style.display='none';return;}
  try{
    const h=await idbGet('vaultHandle');
    if(h){
      wrap.style.display='flex';
      document.getElementById('l-continue-name').textContent=h.name;
    }else wrap.style.display='none';
  }catch(e){wrap.style.display='none';}
}
async function showFileMeta(file){
  const el=document.getElementById('l-file-meta');
  if(!el||!file)return;
  const en=currentLang==='en';
  const warn=[];let ago='';
  if(file.lastModified){
    const diff=Date.now()-file.lastModified,days=Math.floor(diff/86400000),hrs=Math.floor(diff/3600000);
    if(days>=1)ago=en?`${days} day(s) ago`:`há ${days} dia(s)`;
    else if(hrs>=1)ago=en?`${hrs}h ago`:`há ${hrs}h`;
    else ago=en?'less than 1h ago':'há menos de 1h';
    if(days>=30)warn.push('⚠️ '+(en?'This copy is over a month old.':'Esta cópia tem mais de um mês.'));
  }
  try{
    const obj=JSON.parse(await file.text());
    const fmt=obj&&obj.payload&&obj.payload.v?obj.payload.v:1;
    if(fmt>3)warn.push('<span style="color:var(--red)">⚠️ '+(en?'Saved by a newer app version.':'Gravado por uma versão mais recente da app.')+'</span>');
  }catch(e){}
  const fn=document.getElementById('l-file-name');
  if(fn)fn.textContent=file.name+(ago?' · '+(en?'saved ':'gravado ')+ago:'');
  el.innerHTML=warn.map(w=>'<div>'+w+'</div>').join('');
  el.style.display=warn.length?'block':'none';
}
async function continueLastVault(){
  if(lockedOut)return;
  try{
    const h=await idbGet('vaultHandle');if(!h)return;
    let perm=await h.queryPermission({mode:'readwrite'});
    if(perm!=='granted')perm=await h.requestPermission({mode:'readwrite'});
    if(perm!=='granted'){toast(currentLang==='en'?'Permission denied.':'Permissão negada.');return;}
    vaultFileHandle=h;lockSwipeNeed=false;
    const file=await h.getFile();
    pendingVaultFile=file;
    document.getElementById('login-state-initial').style.display='none';
    document.getElementById('login-state-open').style.display='block';
    document.getElementById('open-step-file').style.display='none';
    document.getElementById('open-step-pw').style.display='block';
    document.getElementById('l-file-name').textContent='📁 '+file.name;
    document.getElementById('master-pw').value='';
    showFileMeta(file);
    refreshQuickUnlock(true);
  }catch(e){
    toast(currentLang==='en'?'Could not open the file.':'Não foi possível abrir o ficheiro.');
    try{await idbDel('vaultHandle');}catch(_){}
    refreshContinueBtn();
  }
}
async function forgetLastVault(ev){
  if(ev)ev.stopPropagation();
  try{await idbDel('vaultHandle');}catch(e){}
  vaultFileHandle=null;
  refreshContinueBtn();
  toast(currentLang==='en'?'File forgotten.':'Ficheiro esquecido.');
}
async function pickVaultFile(){
  if(!FSA_OK){document.getElementById('file-input').click();return;}
  try{
    const[h]=await window.showOpenFilePicker({types:[{description:'Aurora Vault',accept:{'application/octet-stream':['.vault','.cofre']}}]});
    vaultFileHandle=h;
    try{await idbSet('vaultHandle',h);}catch(e){}
    const file=await h.getFile();
    pendingVaultText=null;lockHeldPw=null;
    pendingVaultFile=file;
    document.getElementById('open-step-file').style.display='none';
    document.getElementById('open-step-pw').style.display='block';
    document.getElementById('l-file-name').textContent=file.name;
    document.getElementById('master-pw').value='';
    showFileMeta(file);lockSubText();
    refreshQuickUnlock(true);lockUseTypedPw();
  }catch(e){/* cancelado */}
}

// ══ DESBLOQUEIO RÁPIDO (PIN 24h + biometria WebAuthn PRF) ══
const PIN_MAX_TRIES=5,PIN_ITER=600000;
const PIN_DURATIONS={'1':1,'7':7,'30':30,'never':null};
function pinDurationKey(){try{return localStorage.getItem('cv_pin_days')||'30';}catch(e){return '30';}}
function pinDurationMs(){const d=PIN_DURATIONS[pinDurationKey()];return d===null||d===undefined?null:d*86400000;}
function pinExpiryFromNow(){const ms=pinDurationMs();return ms===null?null:Date.now()+ms;}
function pinDurationLabel(k){
  const en=currentLang==='en';
  return{'1':en?'1 day':'1 dia','7':en?'7 days':'7 dias','30':en?'30 days':'30 dias','never':en?'Never expires':'Sem expirar'}[k]||k;
}
function bytesToArr(u8){return Array.from(u8);}
function arrToBytes(a){return new Uint8Array(a);}
async function pinKeyFrom(pin,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode('cvpin:'+pin),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:PIN_ITER,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function wrapSecret(key,text){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(text)));
  return{iv:bytesToArr(iv),wrapped:bytesToArr(ct)};
}
async function unwrapSecret(key,rec){
  const out=await crypto.subtle.decrypt({name:'AES-GCM',iv:arrToBytes(rec.iv)},key,arrToBytes(rec.wrapped));
  return new TextDecoder().decode(out);
}
function pinEnabledFlag(v){
  try{if(v===undefined)return localStorage.getItem('cv_pin_on')==='1';localStorage.setItem('cv_pin_on',v?'1':'0');}catch(e){}
  return !!v;
}
/* O PIN e a biometria guardam (encriptados) a palavra-passe e a chave já derivada do cofre:
   assim abrir com PIN custa uma só derivação e a biometria é imediata. Registos antigos só têm a palavra-passe. */
const PIN_LEN=6;
let _quKeys={};
// Tudo o que lê e regrava os registos do PIN/biometria corre em fila: em paralelo, um sobrepunha-se ao outro
// (e o contador de tentativas do PIN era contornável)
let _pinQ=Promise.resolve();
function pinSerial(fn){return function(...a){const p=_pinQ.then(()=>fn(...a));_pinQ=p.catch(()=>{});return p;};}
const b64e=u8=>btoa(String.fromCharCode(...u8));
const b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function quickSecret(){
  const raw=masterKey&&KEY_RAW.get(masterKey);
  if(!raw||!window._salt)return masterPwRaw;
  return 'AVQ2:'+JSON.stringify({pw:masterPwRaw,k:b64e(raw),s:b64e(window._salt),i:curIter()});
}
function parseQuickSecret(txt){
  if(!txt.startsWith('AVQ2:'))return{pw:txt};
  const o=JSON.parse(txt.slice(5));return{pw:o.pw,qk:o};
}
function quickFresh(qk){return !!(qk&&masterKey&&window._salt&&qk.i===curIter()&&qk.s===b64e(window._salt));}
const refreshQuickSecrets=pinSerial(async function(){
  if(!masterPwRaw||!masterKey)return;
  const sec=quickSecret();
  try{
    const kp=_quKeys.pin,rec=kp&&await getPinRec();
    if(rec&&sameBytes(rec.salt,kp.salt)){const w=await wrapSecret(kp.key,sec);rec.iv=w.iv;rec.wrapped=w.wrapped;await idbSet('qu_pin',rec);}
  }catch(e){}
  try{
    const kb=_quKeys.bio,rec=kb&&await idbGet('qu_bio');
    if(rec&&sameBytes(rec.credId,kb.credId)){const w=await wrapSecret(kb.key,sec);rec.iv=w.iv;rec.wrapped=w.wrapped;await idbSet('qu_bio',rec);}
  }catch(e){}
});
const savePinUnlock=pinSerial(async function(pin){
  if(!masterPwRaw)return false;
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await pinKeyFrom(pin,salt);
  const w=await wrapSecret(key,quickSecret());
  await idbSet('qu_pin',{salt:bytesToArr(salt),iv:w.iv,wrapped:w.wrapped,expiresAt:pinExpiryFromNow(),tries:0,len:pin.length});
  _quKeys.pin={key,salt:bytesToArr(salt)};
  pinEnabledFlag(true);
  return true;
});
async function getPinRec(){
  try{
    const rec=await idbGet('qu_pin');
    if(!rec)return null;
    if(rec.expiresAt&&Date.now()>rec.expiresAt){await idbDel('qu_pin');return null;}
    return rec;
  }catch(e){return null;}
}
const tryPin=pinSerial(tryPinRun);
async function tryPinRun(pin){
  const rec=await getPinRec();
  if(!rec)return{gone:true};
  try{
    const key=await pinKeyFrom(pin,arrToBytes(rec.salt));
    const q=parseQuickSecret(await unwrapSecret(key,rec));
    rec.tries=0;rec.expiresAt=pinExpiryFromNow();await idbSet('qu_pin',rec);
    _quKeys.pin={key,salt:rec.salt};
    return{...q,len:rec.len||4};
  }catch(e){
    rec.tries=(rec.tries||0)+1;
    if(rec.tries>=PIN_MAX_TRIES){await idbDel('qu_pin');return{blocked:true};}
    await idbSet('qu_pin',rec);
    return{left:PIN_MAX_TRIES-rec.tries};
  }
}
const clearPinUnlock=pinSerial(async function(keepFlag){
  try{await idbDel('qu_pin');}catch(e){}
  if(!keepFlag)pinEnabledFlag(false);
});
// ── Biometria ──
async function bioSupported(){
  if(!window.PublicKeyCredential||!window.isSecureContext)return false;
  try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch(e){return false;}
}
async function prfEval(credIdArr,saltArr){
  const assertion=await navigator.credentials.get({publicKey:{
    challenge:crypto.getRandomValues(new Uint8Array(32)),
    allowCredentials:[{type:'public-key',id:arrToBytes(credIdArr)}],
    userVerification:'required',timeout:60000,
    extensions:{prf:{eval:{first:arrToBytes(saltArr)}}}
  }});
  const r=assertion?.getClientExtensionResults?.();
  const first=r&&r.prf&&r.prf.results&&r.prf.results.first;
  return first?new Uint8Array(first):null;
}
async function prfToKey(bytes){
  return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function saveBioUnlock(){
  if(!masterPwRaw)return{err:'nopw'};
  if(!await bioSupported())return{err:'unsupported'};
  let cred;
  try{
    cred=await navigator.credentials.create({publicKey:{
      challenge:crypto.getRandomValues(new Uint8Array(32)),
      rp:{name:'Aurora Vault',id:location.hostname},
      user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'Aurora Vault',displayName:'Aurora Vault'},
      pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'preferred'},
      timeout:60000,extensions:{prf:{}}
    }});
  }catch(e){return{err:e&&e.name==='NotAllowedError'?'cancelled':'create'};}
  if(!cred)return{err:'create'};
  const ext=cred.getClientExtensionResults?.();
  if(ext&&ext.prf&&ext.prf.enabled===false)return{err:'noprf'};
  const credId=bytesToArr(new Uint8Array(cred.rawId));
  const salt=bytesToArr(crypto.getRandomValues(new Uint8Array(32)));
  let prf;
  try{prf=await prfEval(credId,salt);}catch(e){return{err:'noprf'};}
  if(!prf)return{err:'noprf'};
  const key=await prfToKey(prf);
  const w=await wrapSecret(key,quickSecret());
  await pinSerial(()=>idbSet('qu_bio',{credId,salt,iv:w.iv,wrapped:w.wrapped}))();
  _quKeys.bio={key,credId};
  return{ok:true};
}
async function tryBio(){
  let rec;
  try{rec=await idbGet('qu_bio');}catch(e){rec=null;}
  if(!rec)return{gone:true};
  let prf;
  try{prf=await prfEval(rec.credId,rec.salt);}
  catch(e){return{err:e&&e.name==='NotAllowedError'?'cancelled':'failed'};}
  if(!prf)return{err:'failed'};
  try{
    const key=await prfToKey(prf);
    const q=parseQuickSecret(await unwrapSecret(key,rec));
    _quKeys.bio={key,credId:rec.credId};
    return q;
  }catch(e){return{err:'failed'};}
}
const touchPinExpiry=pinSerial(async function(){
  try{
    const rec=await idbGet('qu_pin');
    if(!rec)return;
    rec.expiresAt=pinExpiryFromNow();
    await idbSet('qu_pin',rec);
  }catch(e){}
});
async function setPinDuration(v){
  try{localStorage.setItem('cv_pin_days',v);}catch(e){}
  await touchPinExpiry();
  renderQuickSettings();
  const en=currentLang==='en';
  toast((en?'PIN validity: ':'Validade do PIN: ')+pinDurationLabel(v));
}
const clearBioUnlock=pinSerial(async function(){try{await idbDel('qu_bio');}catch(e){}});
async function clearQuickUnlock(){_quKeys={};await clearPinUnlock();await clearBioUnlock();}

// ── UI do ecrã de login ──
let unlockMode='master',quickAvail={bio:false,pin:false,pinLen:PIN_LEN},_pinUpgradeDue=false;
async function refreshQuickUnlock(auto){
  if(!document.getElementById('quick-unlock'))return;
  let bioRec=null;
  try{bioRec=await idbGet('qu_bio');}catch(e){}
  quickAvail.bio=!!bioRec&&await bioSupported();
  const pinRec=await getPinRec();
  quickAvail.pin=!!pinRec;quickAvail.pinLen=(pinRec&&pinRec.len)||4;
  { /* respeita o modo que a pessoa escolheu neste ecrã de entrada (a preparação do ecrã corre várias vezes e apagava a escolha) */
    const pf=(typeof _avUserMode!=='undefined')?_avUserMode:null;
    unlockMode=(pf&&(pf==='master'||(pf==='pin'&&quickAvail.pin)||(pf==='bio'&&quickAvail.bio)))?pf:(quickAvail.bio?'bio':(quickAvail.pin?'pin':'master'));}
  applyUnlockMode(auto===true);
}
function applyUnlockMode(autoBio){
  const en=currentLang==='en';
  const q=document.getElementById('quick-unlock');
  const bioBtn=document.getElementById('bio-btn');
  const pinEntry=document.getElementById('pin-entry');
  const masterEntry=document.getElementById('master-entry');
  const links=document.getElementById('unlock-links');
  if(!q||!bioBtn||!pinEntry||!masterEntry||!links)return;
  bioBtn.style.display='none';
  pinEntry.style.display=unlockMode==='pin'?'block':'none';
  masterEntry.style.display=unlockMode==='master'?'block':'none';
  q.style.display=unlockMode==='pin'?'block':'none';
  const bt=document.getElementById('bio-btn-txt');
  if(bt)bt.textContent=en?'Unlock with biometrics':'Desbloquear com biometria';
  const pl=document.getElementById('l-pin-label');
  if(pl)pl.textContent=en?'Enter your PIN':'Introduz o teu PIN';
  const parts=[];
  if(unlockMode!=='bio'&&quickAvail.bio)parts.push(`<button class="unlock-link" data-act="setUnlockMode" data-arg="bio">${en?'Use biometrics':'Usar biometria'}</button>`);
  if(unlockMode!=='pin'&&quickAvail.pin)parts.push(`<button class="unlock-link" data-act="setUnlockMode" data-arg="pin">${en?'Use PIN':'Usar PIN'}</button>`);
  if(unlockMode!=='master')parts.push(`<button class="unlock-link" data-act="setUnlockMode" data-arg="master">${en?'Recover access':'Recuperar acesso'}</button>`);
  parts.push(`<button class="unlock-link" data-act="lockOtherVault">${en?'Other vault':'Outro cofre'}</button>`);
  const eb=document.getElementById('l-enter-btn');if(eb)eb.style.display=unlockMode==='bio'?'none':'';
  const et=document.getElementById('l-enter-txt');if(et)et.textContent=en?'Enter the Vault':'Entrar no Cofre';
  const ml=document.getElementById('l-master-label');if(ml)ml.textContent=en?'Master password':'Palavra-passe mestra';
  links.innerHTML=parts.join('<span class="link-sep">·</span>');
  links.style.display=parts.length?'flex':'none';
  if(unlockMode==='pin'){
    const pi=document.getElementById('pin-input');
    if(pi){pi.value='';pi.type='password';pi.maxLength=quickAvail.pinLen;pi.placeholder='•'.repeat(quickAvail.pinLen);const pe=document.getElementById('pin-err');if(pe)pe.textContent='';setTimeout(()=>pi.focus(),120);}
  }
  if(unlockMode==='master')setTimeout(()=>{const mp=document.getElementById('master-pw');if(mp)mp.focus();},120);
  if(unlockMode==='bio'&&!lockBioPrompting){if(autoBio&&!lockSwipeNeed){lockSwipeApply();return lockBioStart();}lockSwipeNeed=true;}
  lockSwipeApply();
}
let _avUserMode=null;
function setUnlockMode(m){
  _avUserMode=m;unlockMode=m;lockSwipeRetry=false;
  if(m==='bio'){lockSwipeNeed=false;return lockBioStart();}
  lockSwipeNeed=false;applyUnlockMode(false);
}
async function onPinInput(){
  const el=document.getElementById('pin-input');
  el.value=el.value.replace(/\D/g,'');
  if(el.value.length<quickAvail.pinLen)return;
  if(!(await lockEnsureFile()))return;
  const pin=el.value.slice(0,quickAvail.pinLen);el.value='';
  const en=currentLang==='en';
  const err=document.getElementById('pin-err');
  const res=await tryPin(pin);
  if(res.pw){err.textContent='';_pinUpgradeDue=res.len<PIN_LEN;submitOpenVault(res.pw,res.qk);return;}
  if(res.blocked){
    err.textContent=en?'Too many attempts — PIN disabled.':'Demasiadas tentativas — PIN desativado.';
    setTimeout(refreshQuickUnlock,1600);return;
  }
  if(res.gone){err.textContent=en?'PIN expired. Use the master password.':'O PIN expirou. Usa a chave mestra.';setTimeout(refreshQuickUnlock,1600);return;}
  err.textContent=(en?'Wrong PIN. ':'PIN errado. ')+(en?`${res.left} attempt(s) left.`:`Restam ${res.left} tentativa(s).`);
  setTimeout(()=>{const pi=document.getElementById('pin-input');if(pi)pi.focus();},60);
}
let bioBusy=false;
async function doBioUnlock(isAuto){
  if(bioBusy||unlockMode!=='bio')return 'busy';
  bioBusy=true;
  const en=currentLang==='en';
  try{
    if(!pendingVaultFile&&!pendingVaultText&&!(await lockEnsureFile()))return 'fail';
    const res=await tryBio();
    if(res.pw){submitOpenVault(res.pw,res.qk);return 'ok';}
    if(res.gone){refreshQuickUnlock();return 'gone';}
    if(res.err==='cancelled')return 'cancel';
    toast(en?'Biometrics failed. Try again or use the PIN.':'Biometria falhou. Tenta outra vez ou usa o PIN.');
    return 'fail';
  }finally{bioBusy=false;}
}

// ── Configuração (Definições) ──
function openPinSetup(renew){
  const en=currentLang==='en';
  if(!masterPwRaw){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  document.getElementById('pinsetup-title').textContent=en?'🔢 Quick PIN':'🔢 PIN Rápido';
  document.getElementById('pinsetup-intro').textContent=renew==='upgrade'
    ?(en?'For extra security the PIN now has 6 digits. Choose a new one — your current PIN keeps working until you do.':'Para mais segurança, o PIN passa a ter 6 dígitos. Escolhe um novo — o PIN atual continua a funcionar até o fazeres.')
    :renew
    ?(en?'Your PIN expired. Set it again to keep using it on this device.':'O teu PIN expirou. Define-o outra vez para continuares a usá-lo neste dispositivo.')
    :(en?`A 6-digit PIN to reopen this vault on this device (${pinDurationLabel(pinDurationKey()).toLowerCase()}). The master password always works as a fallback.`:`Um PIN de 6 dígitos para reabrir este cofre neste dispositivo (${pinDurationLabel(pinDurationKey()).toLowerCase()}). A chave mestra funciona sempre como alternativa.`);
  document.getElementById('ps-pin1-lbl').textContent=en?'PIN (6 digits)':'PIN (6 dígitos)';
  document.getElementById('ps-pin2-lbl').textContent=en?'Confirm PIN':'Confirmar PIN';
  document.getElementById('ps-ok-btn').textContent=en?'Enable':'Ativar';
  document.getElementById('ps-cancel-btn').textContent=renew?(en?'Later':'Mais tarde'):(en?'Cancel':'Cancelar');
  ['ps-pin1','ps-pin2'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('ps-err').textContent='';
  document.getElementById('pinsetup-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('ps-pin1').focus(),100);
}
// Sequências, repetições e datas de nascimento (DDMMAA / AAAA) são as primeiras a ser tentadas
function weakPin(p){
  if(/^(\d)\1+$/.test(p)||/^(\d\d)\1+$/.test(p)||/^(\d{3})\1$/.test(p))return true;
  const up='01234567890',dn='09876543210';if(up.includes(p)||dn.includes(p))return true;
  if(p.length===6){const d=+p.slice(0,2),m=+p.slice(2,4);if(d>=1&&d<=31&&m>=1&&m<=12)return true;if(/^(19|20)\d\d/.test(p.slice(2))&&+p.slice(0,2)<=12)return true;}
  return ['123123','112233','121212','159753','147258','258369','696969','102030'].includes(p);
}
function closePinSetup(){document.getElementById('pinsetup-overlay').classList.remove('open');}
async function confirmPinSetup(){
  const en=currentLang==='en';
  const p1=document.getElementById('ps-pin1').value.replace(/\D/g,'');
  const p2=document.getElementById('ps-pin2').value.replace(/\D/g,'');
  const err=document.getElementById('ps-err');
  if(p1.length!==PIN_LEN){err.textContent=en?'The PIN must have 6 digits.':'O PIN tem de ter 6 dígitos.';return;}
  if(p1!==p2){err.textContent=en?'The PINs do not match.':'Os PINs não coincidem.';return;}
  if(weakPin(p1)){
    if(!confirm(en?'That PIN is very easy to guess. Use it anyway?':'Esse PIN é muito fácil de adivinhar. Usar mesmo assim?'))return;
  }
  const ok=await savePinUnlock(p1);
  if(!ok){err.textContent=en?'Could not save the PIN.':'Não foi possível guardar o PIN.';return;}
  closePinSetup();renderQuickSettings();
  toast(en?'PIN enabled ✓':'PIN ativado ✓');
}
async function doBioSetup(){
  const en=currentLang==='en';
  let rec=null;try{rec=await idbGet('qu_bio');}catch(e){}
  if(rec){
    if(!confirm(en?'Remove biometric unlock from this device?':'Remover o desbloqueio por biometria deste dispositivo?'))return;
    await clearBioUnlock();renderQuickSettings();
    toast(en?'Biometrics removed.':'Biometria removida.');return;
  }
  if(!await bioSupported()){
    toast(en?'No biometric sensor available on this device/browser.':'Sem sensor biométrico disponível neste dispositivo/browser.');return;
  }
  toast(en?'Confirm with your biometrics...':'Confirma com a tua biometria...');
  const res=await saveBioUnlock();
  if(res.ok){renderQuickSettings();toast(en?'Biometric unlock enabled ✓':'Desbloqueio por biometria ativado ✓');return;}
  if(res.err==='cancelled')return;
  if(res.err==='noprf'){
    toast(en?'This device does not support encryption via biometrics (WebAuthn PRF).':'Este dispositivo não suporta encriptação por biometria (WebAuthn PRF).');
    await clearBioUnlock();return;
  }
  toast(en?'Could not enable biometrics.':'Não foi possível ativar a biometria.');
}
function renderExportSettings(){
  const en=currentLang==='en';
  const t1=document.getElementById('s-export-title');
  if(t1)t1.textContent=en?'📤 Share selected entries':'📤 Partilhar entradas selecionadas';
  const ot=document.getElementById('export-open-txt');
  if(ot)ot.textContent=en?'Choose & export':'Escolher e exportar';
  const desc=document.getElementById('export-desc');
  if(desc)desc.textContent=en?'Export a few entries as their own encrypted file — to give family or a colleague only what they need.':'Exporta algumas entradas como um ficheiro encriptado próprio — para dares à família ou a um colega só o que precisam.';
}
async function renderSnapshotSettings(){
  const en=currentLang==='en';
  const t1=document.getElementById('s-snap-title');
  if(t1)t1.textContent=en?'💾 Backups':'💾 Cópias de Segurança';
  const ot=document.getElementById('snap-open-txt');
  if(ot)ot.textContent=en?'View & restore snapshots':'Ver e restaurar cópias';
  const list=await getSnapshots();
  const desc=document.getElementById('snap-desc');
  if(desc)desc.textContent=en
    ?`${list.length} of ${SNAP_KEEP} snapshots kept on this device, encrypted. A new one is saved each time you save the vault.`
    :`${list.length} de ${SNAP_KEEP} cópias guardadas neste dispositivo, encriptadas. É criada uma nova sempre que gravas o cofre.`;
}
async function renderQuickSettings(){
  const st=document.getElementById('quick-status');if(!st)return;
  const en=currentLang==='en';
  document.getElementById('s-quick-title').textContent=en?'🔓 Quick Unlock':'🔓 Desbloqueio Rápido';
  const pinRec=await getPinRec();
  let bioRec=null;try{bioRec=await idbGet('qu_bio');}catch(e){}
  const bioOk=await bioSupported();
  const lines=[];
  if(pinRec){
    let when;
    if(!pinRec.expiresAt)when=en?'no expiry':'sem expirar';
    else{
      const ms=Math.max(0,pinRec.expiresAt-Date.now());
      const days=Math.floor(ms/86400000);
      when=days>=1
        ?(en?`${days} day(s) left`:`faltam ${days} dia(s)`)
        :(en?`~${Math.max(1,Math.round(ms/3600000))}h left`:`faltam ~${Math.max(1,Math.round(ms/3600000))}h`);
    }
    lines.push(`🔢 <strong style="color:var(--accent-ink)">${en?'PIN active':'PIN ativo'}</strong> — ${when}`);
  }else lines.push(`🔢 ${en?'PIN not set':'PIN não configurado'}`);
  if(bioRec)lines.push(`👆 <strong style="color:var(--accent-ink)">${en?'Biometrics active':'Biometria ativa'}</strong> ${en?'on this device':'neste dispositivo'}`);
  else lines.push(`👆 ${bioOk?(en?'Biometrics available — not enabled':'Biometria disponível — por ativar'):(en?'No biometric sensor here':'Sem sensor biométrico aqui')}`);
  st.innerHTML=lines.join('<br>');
  document.getElementById('pin-cfg-txt').textContent=pinRec?(en?'Change / remove PIN':'Alterar / remover PIN'):(en?'Set up PIN':'Configurar PIN');
  const bcb=document.getElementById('bio-cfg-btn');
  document.getElementById('bio-cfg-txt').textContent=bioRec?(en?'Remove biometrics':'Remover biometria'):(en?'Enable biometrics':'Ativar biometria');
  if(bcb)bcb.style.opacity=(bioOk||bioRec)?'1':'.5';
  const durSel=document.getElementById('pin-dur');
  if(durSel){
    durSel.innerHTML=Object.keys(PIN_DURATIONS).map(k=>`<option value="${k}">${pinDurationLabel(k)}</option>`).join('');
    durSel.value=pinDurationKey();
  }
  const durLbl=document.getElementById('pin-dur-lbl');
  if(durLbl)durLbl.textContent=en?'PIN validity':'Validade do PIN';
  const durRow=document.getElementById('pin-dur-row');
  if(durRow)durRow.style.display=pinRec?'flex':'none';
  document.getElementById('quick-note').textContent=en
    ?'Stored only in this browser, encrypted. The master password is always required on new devices and after the PIN expires.'
    :'Guardado só neste browser, encriptado. A chave mestra continua sempre a ser precisa em dispositivos novos e depois de o PIN expirar.';
}
async function maybePromptPinRenew(){
  if(!pinEnabledFlag())return;
  const rec=await getPinRec();
  if(rec)return;
  setTimeout(()=>{if(masterKey&&!presentationMode)openPinSetup(true);},1200);
}

