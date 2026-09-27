/* Aurora Vault — encriptação do cofre.
   AES-256-GCM; chave da palavra-passe mestra com PBKDF2-SHA256 (600 000 iterações; cofres antigos: 200 000, migram sozinhos).
   Formato do ficheiro: {salt:[16 bytes], iter?:600000, payload:{v, iv, data}} — dados comprimidos (gzip) antes de encriptar.
   Carregado antes do app.js; usa, só quando é chamado, o estado do cofre aberto (masterKey, masterPwRaw…) definido lá. */
function sameBytes(a,b){if(!a||!b||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
/* Chave mestra: PBKDF2-SHA256. Cofres antigos: 200 000 iterações (sem «iter» no ficheiro).
   Cofres novos e migrados: 600 000 (recomendação OWASP atual), gravado em «iter» no ficheiro. */
const KDF_ITER_LEGACY=200000,KDF_ITER=600000;
const KEY_RAW=new WeakMap();
function curIter(){return window._iter||KDF_ITER_LEGACY;}
function containerIter(c){const n=+(c&&c.iter);return n>=1000?n:KDF_ITER_LEGACY;}
function keySnap(){return{key:masterKey,salt:window._salt,iter:curIter()};}
function mkContainer(ks,payload){
  const c={salt:Array.from(ks.salt)};
  if(ks.iter!==KDF_ITER_LEGACY){c.iter=ks.iter;payload={...payload,v:3};}
  c.payload=payload;return c;
}
async function importRawKey(raw){
  const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
  KEY_RAW.set(key,raw);return key;
}
async function deriveKey(pw,salt,iter){
  iter=iter||KDF_ITER_LEGACY;
  // Mesma palavra-passe, salt e iterações do cofre aberto → a chave já existe (poupa o PBKDF2)
  if(masterKey&&pw===masterPwRaw&&sameBytes(salt,window._salt)&&iter===curIter())return masterKey;
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),{name:'PBKDF2'},false,['deriveBits']);
  const raw=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},km,256));
  return importRawKey(raw);
}
// Cofre aberto com 200k iterações → nova chave com 600k e salt novo; fica gravado no próximo save
let _kdfUp=null;
function maybeUpgradeKdf(){
  if(_kdfUp||!masterKey||!masterPwRaw||curIter()>=KDF_ITER||vaultReadOnly||presentationMode)return _kdfUp;
  const pw=masterPwRaw,k0=masterKey,salt=crypto.getRandomValues(new Uint8Array(16));
  _kdfUp=deriveKey(pw,salt,KDF_ITER).then(key=>{
    if(masterKey!==k0||masterPwRaw!==pw)return false;
    window._salt=salt;window._iter=KDF_ITER;masterKey=key;
    refreshQuickSecrets();
    if(typeof autoSaveOn==='function'&&autoSaveOn())markUnsaved(); // sem gravação automática fica para o próximo «Guardar»
    return true;
  }).catch(()=>false).finally(()=>{_kdfUp=null;});
  return _kdfUp;
}
// ── Codecs assíncronos nativos (base64 fora da main thread) ──
function u8ToB64(u8){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result.split(',')[1]);fr.onerror=rej;fr.readAsDataURL(new Blob([u8]));});}
async function b64ToU8(s){const r=await fetch('data:application/octet-stream;base64,'+s);return new Uint8Array(await r.arrayBuffer());}
async function gzipBytes(u8){if(typeof CompressionStream==='undefined')return null;try{const cs=new CompressionStream('gzip');const w=cs.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(cs.readable).arrayBuffer());}catch(e){return null;}}
async function gunzipBytes(u8){const ds=new DecompressionStream('gzip');const w=ds.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer());}
/* Comprimir + encriptar + base64 correm num Web Worker para não congelar o ecrã (um cofre de 8 MB
   bloqueava ~270 ms). O resultado é idêntico ao do método normal, que fica como reserva. */
const AV_CW_SRC="const b64=u=>new FileReaderSync().readAsDataURL(new Blob([u])).split(',')[1];"
 +"self.onmessage=async e=>{const {id,key,json}=e.data;try{let bytes=new TextEncoder().encode(json);"
 +"if(typeof CompressionStream!=='undefined'){try{const cs=new CompressionStream('gzip');const w=cs.writable.getWriter();w.write(bytes);w.close();"
 +"const gz=new Uint8Array(await new Response(cs.readable).arrayBuffer());if(gz.length<bytes.length)bytes=gz;}catch(_){}}"
 +"const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));"
 +"self.postMessage({id,ok:true,res:{v:2,iv:b64(iv),data:b64(ct)}});}catch(err){self.postMessage({id,ok:false,err:String((err&&err.message)||err)});}};";
let _avCW=null,_avCWid=0,_avCWcb={},_avCWfail=false;
function avCryptoWorker(){
  if(_avCWfail||typeof Worker==='undefined')return null;if(_avCW)return _avCW;
  try{
    _avCW=new Worker(URL.createObjectURL(new Blob([AV_CW_SRC],{type:'text/javascript'})));
    _avCW.onmessage=e=>{const cb=_avCWcb[e.data.id];if(cb){delete _avCWcb[e.data.id];cb(e.data);}};
    _avCW.onerror=()=>{_avCWfail=true;const cbs=Object.values(_avCWcb);_avCWcb={};_avCW=null;cbs.forEach(cb=>cb({ok:false,err:'worker'}));};
    return _avCW;
  }catch(e){_avCWfail=true;return null;}
}
async function encrypt(key,data){
  const json=JSON.stringify(data);
  const w=avCryptoWorker();
  if(w){
    try{
      return await new Promise((res,rej)=>{
        const id=++_avCWid;_avCWcb[id]=m=>m.ok?res(m.res):rej(new Error(m.err));
        try{w.postMessage({id,key,json});}catch(err){delete _avCWcb[id];_avCWfail=true;rej(err);return;}
        setTimeout(()=>{if(_avCWcb[id]){delete _avCWcb[id];rej(new Error('timeout'));}},90000);
      });
    }catch(e){/* reserva: método normal */}
  }
  return encryptMain(key,json);
}
async function encryptMain(key,json){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  let bytes=new TextEncoder().encode(json);
  const gz=await gzipBytes(bytes);
  if(gz&&gz.length<bytes.length)bytes=gz; // magic 1f8b marca o formato
  const e=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));
  return{v:2,iv:await u8ToB64(iv),data:await u8ToB64(e)};
}
async function decrypt(key,payload){
  const iv=Array.isArray(payload.iv)?new Uint8Array(payload.iv):await b64ToU8(payload.iv);
  const d=Array.isArray(payload.data)?new Uint8Array(payload.data):await b64ToU8(payload.data);
  let dec=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,d));
  if(dec.length>2&&dec[0]===0x1f&&dec[1]===0x8b)dec=await gunzipBytes(dec);
  return JSON.parse(new TextDecoder().decode(dec));
}

