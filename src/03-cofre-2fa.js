// ══ COFRE 2FA — CHAVE INDEPENDENTE DA CHAVE MESTRA ══
const RC_ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const T2_MAX_TRIES=5,T2_PIN_ITER=600000,T2_REC_ITER=210000;
function genRecoveryCode(){
  const b=crypto.getRandomValues(new Uint8Array(20));
  let s='';
  for(let i=0;i<20;i++)s+=RC_ALPHABET[b[i]&31];
  return s.match(/.{4}/g).join('-');
}
function rcNormalize(s){
  return String(s||'').toUpperCase().split('').filter(ch=>RC_ALPHABET.includes(ch)).join('');
}
function rcValid(s){return rcNormalize(s).length===20;}
async function deriveRecKey(code,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode('cv2fa-rec:'+rcNormalize(code)),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:T2_REC_ITER,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function derive2faPinKey(pin,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode('cv2fa-pin:'+pin),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:T2_PIN_ITER,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function importTotpKey(b64){
  return crypto.subtle.importKey('raw',await b64ToU8(b64),{name:'AES-GCM'},false,['encrypt','decrypt']);
}
let totpSig=null;
async function encryptTotpArray(){
  if(!totpKey)return totpEnc;
  try{totpSig=syncStable(totp);}catch(e){}
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const bytes=new TextEncoder().encode(JSON.stringify(totp));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},totpKey,bytes));
  return{v:1,iv:await u8ToB64(iv),data:await u8ToB64(ct)};
}
async function decryptTotpArray(key,blob){
  if(!blob)return [];
  const iv=await b64ToU8(blob.iv),ct=await b64ToU8(blob.data);
  const out=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
  const arr=JSON.parse(new TextDecoder().decode(out));
  return Array.isArray(arr)?arr:[];
}
// ── Ativar a proteção ──
async function setup2faVault(pin){
  const raw=crypto.getRandomValues(new Uint8Array(32));
  const rawB64=await u8ToB64(raw);
  totpKey=await importTotpKey(rawB64);
  const code=genRecoveryCode();
  const rSalt=crypto.getRandomValues(new Uint8Array(16));
  const rKey=await deriveRecKey(code,rSalt);
  const rw=await wrapSecret(rKey,rawB64);
  totpRecWrap={salt:bytesToArr(rSalt),iv:rw.iv,wrapped:rw.wrapped};
  totpEnc=await encryptTotpArray();
  totpUnlocked=true;
  session2faRaw=rawB64;
  if(pin)await set2faPin(pin,rawB64);
  markUnsaved();
  return code;
}
async function set2faPin(pin,rawB64){
  if(!rawB64){
    if(!totpKey)return false;
    rawB64=session2faRaw;
  }
  if(!rawB64)return false;
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await derive2faPinKey(pin,salt);
  const w=await wrapSecret(key,rawB64);
  await idbSet('t2_pin',{salt:bytesToArr(salt),iv:w.iv,wrapped:w.wrapped,tries:0,len:pin.length});
  const check=await idbGet('t2_pin');
  return !!(check&&check.wrapped);
}
let session2faRaw=null;
// ── Abrir ──
const open2faWithPin=pinSerial(open2faWithPinRun);
async function open2faWithPinRun(pin){
  let rec;try{rec=await idbGet('t2_pin');}catch(e){rec=null;}
  if(!rec)return{gone:true};
  let rawB64=null;
  // Fase 1 — só validar o PIN. Um erro AQUI é mesmo PIN errado.
  try{
    const key=await derive2faPinKey(pin,arrToBytes(rec.salt));
    rawB64=await unwrapSecret(key,rec);
  }catch(e){
    rec.tries=(rec.tries||0)+1;
    if(rec.tries>=T2_MAX_TRIES){await idbDel('t2_pin');return{blocked:true};}
    await idbSet('t2_pin',rec);
    return{left:T2_MAX_TRIES-rec.tries};
  }
  // PIN correto: repõe o contador antes de mais nada
  try{rec.tries=0;await idbSet('t2_pin',rec);}catch(e){}
  // Fase 2 — decifrar. Um erro aqui NÃO é culpa do PIN e nunca o apaga.
  try{
    return{...await finish2faUnlock(rawB64),len:rec.len||4};
  }catch(e){
    return{decryptFailed:true};
  }
}
async function open2faWithRecovery(code){
  if(!totpRecWrap)return{err:true};
  if(!rcValid(code))return{invalid:true};
  try{
    const key=await deriveRecKey(code,arrToBytes(totpRecWrap.salt));
    const rawB64=await unwrapSecret(key,totpRecWrap);
    return await finish2faUnlock(rawB64);
  }catch(e){return{wrong:true};}
}
async function open2faWithBio(){
  let rec;try{rec=await idbGet('t2_bio');}catch(e){rec=null;}
  if(!rec)return{gone:true};
  let prf;
  try{prf=await prfEval(rec.credId,rec.salt);}
  catch(e){return{err:e&&e.name==='NotAllowedError'?'cancelled':'failed'};}
  if(!prf)return{err:'failed'};
  try{
    const key=await prfToKey(prf);
    const rawB64=await unwrapSecret(key,rec);
    return await finish2faUnlock(rawB64);
  }catch(e){return{err:'failed'};}
}
async function set2faBio(){
  if(!session2faRaw)return{err:'locked'};
  if(!await bioSupported())return{err:'unsupported'};
  let cred;
  try{
    cred=await navigator.credentials.create({publicKey:{
      challenge:crypto.getRandomValues(new Uint8Array(32)),
      rp:{name:'Aurora Vault 2FA',id:location.hostname},
      user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'Aurora Vault-2FA',displayName:'Aurora Vault 2FA'},
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
  const w=await wrapSecret(key,session2faRaw);
  await idbSet('t2_bio',{credId,salt,iv:w.iv,wrapped:w.wrapped});
  return{ok:true};
}
async function finish2faUnlock(rawB64){
  totpKey=await importTotpKey(rawB64);
  session2faRaw=rawB64;
  totp=await decryptTotpArray(totpKey,totpEnc);
  try{totpSig=syncStable(totp);}catch(e){}
  totpUnlocked=true;
  return{ok:true};
}
function lock2faVault(){
  totp=[];totpKey=null;totpUnlocked=false;session2faRaw=null;
}
async function clear2faDevice(){
  try{await idbDel('t2_pin');}catch(e){}
  try{await idbDel('t2_bio');}catch(e){}
}
async function check2faMismatch(){
  try{
    if(totpRecWrap)return;
    const hasDev=(await idbGet('t2_pin'))||(await idbGet('t2_bio'));
    if(!hasDev)return;
    const en=currentLang==='en';
    setTimeout(()=>{
      alert(en
        ?'⚠️ This device remembers a protected 2FA vault, but the file you just opened has no protection.\n\nThis usually means the file is an older copy — the one you saved after enabling protection may be somewhere else (check your Downloads folder).\n\nNothing was deleted from this file.'
        :'⚠️ Este dispositivo tem memória de um cofre 2FA protegido, mas o ficheiro que acabaste de abrir não tem proteção nenhuma.\n\nNormalmente isto significa que este ficheiro é uma cópia mais antiga — o que gravaste depois de ativar a proteção pode estar noutro sítio (vê as Transferências).\n\nNada foi apagado deste ficheiro.');
    },900);
  }catch(e){}
}
function checkVaultFormat(){
  if(!vaultReadOnly)return;
  const en=currentLang==='en';
  setTimeout(()=>{
    alert(en
      ?'⚠️ This vault was saved by a NEWER version of Aurora Vault.\n\nSaving from here would delete data this version does not understand. Saving is disabled until you update the app (reload the page twice).'
      :'⚠️ Este cofre foi gravado por uma versão MAIS RECENTE do Aurora Vault.\n\nGravar a partir daqui apagaria dados que esta versão não entende. A gravação fica bloqueada até atualizares a app (recarrega a página duas vezes).');
  },700);
}
async function has2faPin(){try{return !!(await idbGet('t2_pin'));}catch(e){return false;}}
async function has2faBio(){try{return !!(await idbGet('t2_bio'));}catch(e){return false;}}

// ══ COFRE 2FA — INTERFACE ══
let t2Mode='pin',t2PendingCode=null,t2ReviewMode=false,t2PinLen=PIN_LEN,_t2PinUpgradeDue=false;
function t2Err(msg){const e=document.getElementById('t2-err');if(e)e.textContent=msg||'';}
async function render2faGate(){
  const lockedEl=document.getElementById('totp-locked');
  if(!lockedEl)return;
  const en=currentLang==='en';
  const setupEl=document.getElementById('totp-setup');
  const grid=document.getElementById('totp-grid');
  const addBtn=document.getElementById('totp-add-btn');
  const info=document.getElementById('totp-info');
  const shield=document.getElementById('totp-shield-btn');
  const isProtected=!!totpRecWrap;
  const locked=isProtected&&!totpUnlocked;
  lockedEl.style.display=locked?'block':'none';
  if(setupEl)setupEl.style.display=(!isProtected&&!presentationMode)?'block':'none';
  if(grid)grid.style.display=locked?'none':'grid';
  if(addBtn)addBtn.style.display=locked?'none':'';
  if(info)info.style.display=locked?'none':'';
  if(shield)shield.style.display=presentationMode?'none':'';
  const st=document.getElementById('totp-shield-txt');
  if(st)st.textContent=en?'Protection':'Proteção';
  const sTitle=document.getElementById('t2-setup-title');
  if(sTitle)sTitle.textContent=en?'Protect your 2FA vault':'Protege o teu cofre 2FA';
  const sSub=document.getElementById('t2-setup-sub');
  if(sSub)sSub.textContent=en
    ?'Close this tab behind its own PIN, with a key the master password cannot open.'
    :'Fecha este separador com um PIN próprio e uma chave que a palavra-passe mestra não abre.';
  const sBtn=document.getElementById('t2-setup-btn');
  if(sBtn)sBtn.textContent=en?'Enable protection':'Ativar proteção';
  if(locked)await render2faUnlockPanel(true);
}
async function render2faUnlockPanel(reset){
  const en=currentLang==='en';
  const hasBio=(await has2faBio())&&(await bioSupported());
  let pinRec=null;try{pinRec=await idbGet('t2_pin');}catch(e){}
  const hasPin=!!pinRec;t2PinLen=(pinRec&&pinRec.len)||4;
  if(reset)t2Mode=hasBio?'bio':(hasPin?'pin':'rec');
  if(t2Mode==='bio'&&!hasBio)t2Mode=hasPin?'pin':'rec';
  if(t2Mode==='pin'&&!hasPin)t2Mode=hasBio?'bio':'rec';
  document.getElementById('t2-lock-title').textContent=en?'2FA vault protected':'Cofre 2FA protegido';
  document.getElementById('t2-lock-sub').textContent=en
    ?'Your codes are encrypted with a key separate from the master password.'
    :'Os teus códigos estão encriptados com uma chave separada da chave mestra.';
  document.getElementById('t2-bio-txt').textContent=en?'Open with biometrics':'Abrir com biometria';
  document.getElementById('t2-rec-btn').textContent=en?'Open 2FA vault':'Abrir cofre 2FA';
  document.getElementById('t2-bio-btn').style.display=t2Mode==='bio'?'block':'none';
  document.getElementById('t2-pin-wrap').style.display=t2Mode==='pin'?'block':'none';
  document.getElementById('t2-rec-wrap').style.display=t2Mode==='rec'?'block':'none';
  if(reset)t2Err('');
  const parts=[];
  if(t2Mode!=='bio'&&hasBio)parts.push(`<button class="unlock-link" data-act="set2faMode" data-arg="bio">👆 ${en?'Use biometrics':'Usar biometria'}</button>`);
  if(t2Mode!=='pin'&&hasPin)parts.push(`<button class="unlock-link" data-act="set2faMode" data-arg="pin">🔢 ${en?'Enter PIN':'Introduzir PIN'}</button>`);
  if(t2Mode!=='rec')parts.push(`<button class="unlock-link" data-act="set2faMode" data-arg="rec">🔑 ${en?'Recovery code':'Código de recuperação'}</button>`);
  document.getElementById('t2-links').innerHTML=parts.join('<span class="link-sep">·</span>');
  if(t2Mode==='pin'){const i=document.getElementById('t2-pin-input');if(i){i.value='';i.maxLength=t2PinLen;i.placeholder='•'.repeat(t2PinLen);setTimeout(()=>i.focus(),120);}}
  if(t2Mode==='rec'){const i=document.getElementById('t2-rec-input');if(i&&reset)i.value='';}
  if(!hasPin&&!hasBio){
    document.getElementById('t2-lock-sub').textContent=en
      ?'This browser has no PIN saved for the 2FA vault. Use the recovery code — you can set a PIN right after.'
      :'Este browser não tem PIN guardado para o cofre 2FA. Usa o código de recuperação — podes definir um PIN logo a seguir.';
  }
}
function set2faMode(m){t2Mode=m;t2Err('');render2faUnlockPanel(false);}
async function on2faPinInput(){
  const el=document.getElementById('t2-pin-input');
  el.value=el.value.replace(/\D/g,'');
  if(el.value.length<t2PinLen)return;
  const pin=el.value.slice(0,t2PinLen);el.value='';
  const en=currentLang==='en';
  const res=await open2faWithPin(pin);
  if(res.ok){_t2PinUpgradeDue=res.len<PIN_LEN;after2faUnlock();return;}
  if(res.blocked){t2Err(en?'Too many attempts. Use the recovery code.':'Demasiadas tentativas. Usa o código de recuperação.');t2Mode='rec';render2faUnlockPanel(false);return;}
  if(res.gone){t2Mode='rec';render2faUnlockPanel(true);return;}
  if(res.decryptFailed){
    t2Err(en?'PIN correct, but the 2FA data could not be read. Use the recovery code.':'PIN correto, mas não foi possível ler os dados 2FA. Usa o código de recuperação.');
    return;
  }
  t2Err((en?'Wrong PIN. ':'PIN errado. ')+(en?`${res.left} left.`:`Restam ${res.left}.`));
  setTimeout(()=>{const i=document.getElementById('t2-pin-input');if(i)i.focus();},60);
}
async function do2faBioUnlock(){
  const en=currentLang==='en';
  const res=await open2faWithBio();
  if(res.ok){after2faUnlock();return;}
  if(res.gone){render2faUnlockPanel(true);return;}
  if(res.err==='cancelled')return;
  t2Err(en?'Biometrics failed. Try the PIN.':'Biometria falhou. Tenta o PIN.');
}
function on2faRecInput(){
  const el=document.getElementById('t2-rec-input');
  const raw=rcNormalize(el.value).slice(0,20);
  el.value=raw.length?raw.match(/.{1,4}/g).join('-'):'';
}
async function do2faRecoveryUnlock(){
  const en=currentLang==='en';
  const code=document.getElementById('t2-rec-input').value;
  if(!rcValid(code)){t2Err(en?'The code must have 20 characters.':'O código tem de ter 20 caracteres.');return;}
  const res=await open2faWithRecovery(code);
  if(res.ok){after2faUnlock();return;}
  t2Err(en?'Wrong recovery code.':'Código de recuperação errado.');
}
function after2faUnlock(){
  t2Err('');
  renderTotp();
  toast(currentLang==='en'?'2FA vault open ✓':'Cofre 2FA aberto ✓');
  offerDevicePin();
}
async function offerDevicePin(){
  if(presentationMode||!totpUnlocked)return;
  if(_t2PinUpgradeDue){
    _t2PinUpgradeDue=false;
    setTimeout(()=>{if(!totpUnlocked)return;t2SetupMode='change';open2faSetup('upgrade');},700);
    return;
  }
  if(await has2faPin())return;
  if(await has2faBio())return;
  const en=currentLang==='en';
  setTimeout(()=>{
    if(!totpUnlocked)return;
    t2SetupMode='change';
    open2faSetup(true);
  },700);
}
// ── Configuração ──
function open2faSetup(isDeviceOnly){
  const en=currentLang==='en';
  if(presentationMode){toast(en?'Not available in demo mode.':'Indisponível no modo demonstração.');return;}
  const devOnly=!!isDeviceOnly||t2SetupMode==='change';
  document.getElementById('t2setup-title').textContent=devOnly
    ?(en?'🔢 PIN for this device':'🔢 PIN para este dispositivo')
    :(en?'🛡️ Protect the 2FA vault':'🛡️ Proteger o cofre 2FA');
  document.getElementById('t2setup-intro').textContent=isDeviceOnly==='upgrade'
    ?(en?'For extra security the 2FA PIN now has 6 digits. Choose a new one — the current PIN keeps working until you do.'
        :'Para mais segurança, o PIN do 2FA passa a ter 6 dígitos. Escolhe um novo — o PIN atual continua a funcionar até o fazeres.')
    :devOnly
    ?(en?'This device has no PIN yet, so it asks for the recovery code every time. Set a PIN and it will open with 6 digits from now on.'
        :'Este dispositivo ainda não tem PIN, por isso pede sempre o código de recuperação. Define um PIN e passa a abrir com 6 dígitos.')
    :(en?'Choose a PIN for this device. You will then get a recovery code — the only other way in, and the only one that works on a new device.'
        :'Escolhe um PIN para este dispositivo. A seguir recebes um código de recuperação — a única outra forma de entrar, e a única que funciona num dispositivo novo.');
  document.getElementById('t2s-pin1-lbl').textContent=en?'2FA tab PIN (6 digits)':'PIN do separador 2FA (6 dígitos)';
  document.getElementById('t2s-pin2-lbl').textContent=en?'Confirm PIN':'Confirmar PIN';
  document.getElementById('t2s-ok-btn').textContent=en?'Enable':'Ativar';
  document.getElementById('t2s-cancel-btn').textContent=devOnly?(en?'Later':'Mais tarde'):(en?'Cancel':'Cancelar');
  document.getElementById('t2s-ok-btn').textContent=devOnly?(en?'Set PIN':'Definir PIN'):(en?'Enable':'Ativar');
  ['t2s-pin1','t2s-pin2'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('t2s-err').textContent='';
  document.getElementById('t2setup-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('t2s-pin1').focus(),100);
}
function close2faSetup(){document.getElementById('t2setup-overlay').classList.remove('open');t2SetupMode='new';}
async function confirm2faSetup(){
  const en=currentLang==='en';
  const p1=document.getElementById('t2s-pin1').value.replace(/\D/g,'');
  const p2=document.getElementById('t2s-pin2').value.replace(/\D/g,'');
  const err=document.getElementById('t2s-err');
  if(p1.length!==PIN_LEN){err.textContent=en?'The PIN must have 6 digits.':'O PIN tem de ter 6 dígitos.';return;}
  if(p1!==p2){err.textContent=en?'The PINs do not match.':'Os PINs não coincidem.';return;}
  if(weakPin(p1)&&!confirm(en?'That PIN is very easy to guess. Use it anyway?':'Esse PIN é muito fácil de adivinhar. Usar mesmo assim?'))return;
  if(pinEnabledFlag()){
    const rec=await getPinRec();
    if(rec){
      try{
        const k=await pinKeyFrom(p1,arrToBytes(rec.salt));
        await unwrapSecret(k,rec);
        if(!confirm(en?'That is the same PIN you use to open the app. Using a different one is safer. Continue anyway?':'Esse é o mesmo PIN que usas para abrir a app. Usar um diferente é mais seguro. Continuar mesmo assim?'))return;
      }catch(e){}
    }
  }
  err.textContent='';
  if(t2SetupMode==='change'){
    const ok=await set2faPin(p1);
    t2SetupMode='new';
    close2faSetup();
    if(ok)toast(en?'PIN saved on this device ✓':'PIN guardado neste dispositivo ✓');
    else alert(en?'The PIN could NOT be saved in this browser. Check that site data is not blocked.':'O PIN NÃO ficou guardado neste browser. Verifica se os dados do site não estão bloqueados.');
    return;
  }
  const code=await setup2faVault(p1);
  close2faSetup();
  renderTotp();
  showRecoveryModal(code,false);
  try{await saveFile();}catch(e){}
}
// ── Código de recuperação ──
function showRecoveryModal(code,isReview){
  const en=currentLang==='en';
  t2PendingCode=code;t2ReviewMode=!!isReview;
  document.getElementById('t2rec-title').textContent=en?'🔑 Recovery code':'🔑 Código de recuperação';
  document.getElementById('t2rec-intro').textContent=isReview
    ?(en?'This is your current recovery code. It opens the 2FA vault on any device.':'Este é o teu código de recuperação atual. Abre o cofre 2FA em qualquer dispositivo.')
    :(en?'Protection is on. Write this code down now — it is the only way into the 2FA vault on a new device.':'Proteção ativada. Escreve este código agora — é a única forma de entrar no cofre 2FA num dispositivo novo.');
  document.getElementById('t2rec-code').textContent=code;
  document.getElementById('t2rec-warn').innerHTML=en
    ?'Keep it on paper, away from the vault file. The master password does <b>not</b> open the 2FA vault.'
    :'Guarda-o em papel, longe do ficheiro do cofre. A palavra-passe mestra <b>não</b> abre o cofre 2FA.';
  document.getElementById('t2rec-copy').textContent=en?'📋 Copy':'📋 Copiar';
  document.getElementById('t2rec-print').textContent=en?'🖨️ Print':'🖨️ Imprimir';
  document.getElementById('t2rec-ack-lbl').textContent=en?'I saved the code somewhere safe':'Guardei o código num sítio seguro';
  document.getElementById('t2rec-done').textContent=en?'Done':'Concluído';
  const ack=document.getElementById('t2rec-ack');
  ack.checked=!!isReview;
  document.getElementById('t2rec-done').disabled=!isReview;
  document.getElementById('t2rec-overlay').classList.add('open');
}
function closeRecoveryModal(){
  document.getElementById('t2rec-overlay').classList.remove('open');
  t2PendingCode=null;
}
function copyRecoveryCode(){
  if(t2PendingCode)copyText(t2PendingCode,currentLang==='en'?'Code copied ✓':'Código copiado ✓');
}
function printRecoveryCode(){
  if(!t2PendingCode)return;
  const en=currentLang==='en';
  const now=new Date().toLocaleDateString(en?'en-GB':'pt-PT',{year:'numeric',month:'long',day:'numeric'});
  const html=`<!DOCTYPE html><html lang="${en?'en':'pt'}"><head><meta charset="UTF-8"><title>${en?'2FA recovery code':'Código de recuperação 2FA'}</title>
<style>@page{size:A4;margin:20mm}body{font-family:Georgia,serif;color:#111;padding:30px;line-height:1.6}
h1{font-size:19pt;border-bottom:2px solid #111;padding-bottom:8px}
.code{font-family:'Courier New',monospace;font-size:20pt;font-weight:bold;letter-spacing:3px;border:2px dashed #111;padding:22px;text-align:center;margin:22px 0}
.w{background:#fff4f4;border:2px solid #c00;padding:11px 14px;color:#900;font-weight:bold;font-size:11pt}
.pbtn{position:fixed;top:14px;right:14px;padding:11px 20px;font-family:system-ui;background:#111;color:#fff;border:0;border-radius:5px;cursor:pointer}
@media print{.pbtn{display:none}body{padding:0}}</style></head><body>
<button class="pbtn">🖨️ ${en?'Print':'Imprimir'}</button>
<h1>${en?'2FA recovery code — Aurora Vault':'Código de recuperação 2FA — Aurora Vault'}</h1>
<p>${en?'This code opens the 2FA vault (verification codes) on any device. It is independent from the master password.':'Este código abre o cofre 2FA (códigos de verificação) em qualquer dispositivo. É independente da palavra-passe mestra.'}</p>
<div class="code">${esc(t2PendingCode)}</div>
<div class="w">⚠️ ${en?'Without this code and without the device PIN, the 2FA codes cannot be recovered. Not even the master password opens them.':'Sem este código e sem o PIN do dispositivo, os códigos 2FA não podem ser recuperados. Nem a palavra-passe mestra os abre.'}</div>
<p style="margin-top:22px;font-size:10pt;color:#666">${en?'Generated on':'Gerado a'} ${now}</p>
</body></html>`;
  const w=window.open('','_blank');
  if(!w){toast(en?'Allow pop-ups to print.':'Permite pop-ups para imprimir.');return;}
  w.document.write(html);w.document.close();{const pb=w.document.querySelector('.pbtn');if(pb)pb.addEventListener('click',()=>w.print());}
}

// ══ COFRE 2FA — GESTOR ══
let t2SetupMode='new';
function open2faManager(){render2faManager();document.getElementById('t2mgr-overlay').classList.add('open');}
function close2faManager(){document.getElementById('t2mgr-overlay').classList.remove('open');}
async function render2faManager(){
  const en=currentLang==='en';
  document.getElementById('t2mgr-title').textContent=en?'🛡️ 2FA vault protection':'🛡️ Proteção do cofre 2FA';
  document.getElementById('t2mgr-close').textContent=en?'Close':'Fechar';
  const isProt=!!totpRecWrap, hasPin=await has2faPin(), hasBio=await has2faBio(), bioOk=await bioSupported();
  const S=[],A=[];
  const btn=(fn,label,danger)=>`<button class="btn ${danger?'btn-ghost':'btn-ghost'}" ${avActAttrs(fn)} style="width:100%;padding:12px;text-align:left;justify-content:flex-start${danger?';color:var(--red);border-color:var(--red)':''}">${label}</button>`;
  if(!isProt){
    S.push(en?'The 2FA vault is <b>not protected</b> — codes are encrypted with the master password only.':'O cofre 2FA <b>não está protegido</b> — os códigos estão encriptados apenas com a chave mestra.');
    A.push(btn('t2mgrSetup()','🛡️ '+(en?'Enable protection':'Ativar proteção')));
  }else if(!totpUnlocked){
    S.push(en?'🛡️ <b style="color:var(--accent-ink)">Protected</b> and closed.':'🛡️ <b style="color:var(--accent-ink)">Protegido</b> e fechado.');
    S.push('🔢 '+(hasPin?(en?'PIN saved on this device':'PIN guardado neste dispositivo'):(en?'<b style="color:var(--red)">No PIN on this device</b>':'<b style="color:var(--red)">Sem PIN neste dispositivo</b>')));
    S.push('👆 '+(hasBio?(en?'Biometrics saved here':'Biometria guardada aqui'):(en?'No biometrics here':'Sem biometria aqui')));
    S.push('<span style="font-size:.9em;opacity:.8">'+(en?'Open the vault to manage it.':'Abre o cofre para o gerires.')+'</span>');
  }else{
    S.push('🛡️ <b style="color:var(--accent-ink)">'+(en?'Protected':'Protegido')+'</b> — '+(en?'independent key':'chave independente'));
    S.push('🔢 '+(hasPin?(en?'PIN set on this device':'PIN definido neste dispositivo'):(en?'No PIN on this device':'Sem PIN neste dispositivo')));
    S.push('👆 '+(hasBio?(en?'Biometrics active here':'Biometria ativa aqui'):(bioOk?(en?'Biometrics available':'Biometria disponível'):(en?'No biometric sensor here':'Sem sensor biométrico aqui'))));
    A.push(btn('regen2faRecovery()','🔑 '+(en?'New recovery code':'Novo código de recuperação')));
    A.push(btn('change2faPin()','🔢 '+(hasPin?(en?'Change PIN':'Alterar PIN'):(en?'Set PIN':'Definir PIN'))));
    if(bioOk||hasBio)A.push(btn('toggle2faBio()','👆 '+(hasBio?(en?'Remove biometrics':'Remover biometria'):(en?'Enable biometrics':'Ativar biometria'))));
    A.push(btn('disable2faProtection()','⚠️ '+(en?'Disable protection':'Desativar proteção'),true));
  }
  document.getElementById('t2mgr-status').innerHTML=S.join('<br>');
  document.getElementById('t2mgr-actions').innerHTML=A.join('');
}
async function regen2faRecovery(){
  const en=currentLang==='en';
  if(!session2faRaw)return;
  if(!confirm(en?'A new code will be generated and the old one stops working. Continue?':'Vai ser gerado um código novo e o antigo deixa de funcionar. Continuar?'))return;
  const code=genRecoveryCode();
  const rSalt=crypto.getRandomValues(new Uint8Array(16));
  const rKey=await deriveRecKey(code,rSalt);
  const rw=await wrapSecret(rKey,session2faRaw);
  totpRecWrap={salt:bytesToArr(rSalt),iv:rw.iv,wrapped:rw.wrapped};
  markUnsaved();
  close2faManager();
  showRecoveryModal(code,false);
}
function change2faPin(){
  t2SetupMode='change';
  close2faManager();
  open2faSetup();
}
async function toggle2faBio(){
  const en=currentLang==='en';
  if(await has2faBio()){
    if(!confirm(en?'Remove biometric access to the 2FA vault on this device?':'Remover o acesso por biometria ao cofre 2FA neste dispositivo?'))return;
    try{await idbDel('t2_bio');}catch(e){}
    render2faManager();toast(en?'Biometrics removed.':'Biometria removida.');return;
  }
  toast(en?'Confirm with your biometrics...':'Confirma com a tua biometria...');
  const res=await set2faBio();
  if(res.ok){render2faManager();toast(en?'Biometrics enabled ✓':'Biometria ativada ✓');return;}
  if(res.err==='cancelled')return;
  if(res.err==='noprf'){toast(en?'This device cannot encrypt via biometrics.':'Este dispositivo não consegue encriptar por biometria.');try{await idbDel('t2_bio');}catch(e){}return;}
  toast(en?'Could not enable biometrics.':'Não foi possível ativar a biometria.');
}
async function disable2faProtection(){
  const en=currentLang==='en';
  if(!totpUnlocked)return;
  if(!confirm(en?'The 2FA codes go back to being protected by the master password only. Continue?':'Os códigos 2FA voltam a ficar protegidos apenas pela chave mestra. Continuar?'))return;
  totpRecWrap=null;totpEnc=null;totpKey=null;session2faRaw=null;totpUnlocked=false;
  await clear2faDevice();
  markUnsaved();
  close2faManager();
  renderTotp();
  toast(en?'Protection disabled.':'Proteção desativada.');
}

