
/* ══ v10.25 — aviso de tentativas falhadas ao entrar e verificação da cópia no Drive ══ */
const AVFAIL={key:'av_fails',mine:[]};
function avFailsGet(){try{const a=JSON.parse(localStorage.getItem(AVFAIL.key)||'[]');return Array.isArray(a)?a.filter(f=>f&&typeof f.t==='number'):[];}catch(e){return [];}}
// só conta no ecrã de entrada; guarda apenas a hora e o tipo (nada de sensível)
function avFailRecord(kind){
  if(masterKey)return;
  const t=Date.now();AVFAIL.mine.push(t);
  try{const a=avFailsGet();a.push({t,k:kind});localStorage.setItem(AVFAIL.key,JSON.stringify(a.slice(-50)));}catch(e){}
}
function avWhen(t){
  const en=avEn(),d=new Date(t),now=new Date(),z=n=>String(n).padStart(2,'0'),hm=z(d.getHours())+':'+z(d.getMinutes());
  const day=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),diff=Math.round((day(now)-day(d))/864e5);
  if(diff===0)return (en?'today at ':'hoje às ')+hm;
  if(diff===1)return (en?'yesterday at ':'ontem às ')+hm;
  return d.toLocaleDateString(en?'en-GB':'pt-PT',{day:'numeric',month:'short'})+(en?' at ':' às ')+hm;
}
// ao entrar: as tentativas desta sessão que acabaram de acontecer (enganos meus) não contam
function avFailsReport(){
  if(!masterKey||presentationMode)return null;
  const now=Date.now(),all=avFailsGet();
  try{localStorage.removeItem(AVFAIL.key);}catch(e){}
  const others=all.filter(f=>!(AVFAIL.mine.includes(f.t)&&now-f.t<5*60e3));
  AVFAIL.mine=[];
  if(!others.length)return null;
  const en=avEn(),n=others.length,last=Math.max(...others.map(f=>f.t));
  const html='⚠️ '+(en?'<b>'+n+' wrong attempt'+(n>1?'s':'')+'</b> to get in since you last opened the vault (last one '+avWhen(last)+'). If it wasn’t you, change the master password.'
    :'<b>'+n+' tentativa'+(n>1?'s':'')+' errada'+(n>1?'s':'')+'</b> para entrar desde a última vez (a última '+avWhen(last)+'). Se não foste tu, muda a palavra-passe mestra.');
  avNudge(html,[{label:en?'Change password':'Mudar palavra-passe',fn:()=>{try{openChangePwModal();}catch(e){}}}],30000);
  return {n,last};
}

/* A cópia no Drive abre mesmo? De 7 em 7 dias, depois de entrar, descarrega-a e desencripta-a em memória com a
   palavra-passe atual. Nada é gravado; só avisa se não abrir. Falhas de rede não contam (tenta noutra altura). */
const AVB={every:7*864e5,busy:false};
function avBackupState(){try{return JSON.parse(localStorage.getItem('av_bkcheck')||'null');}catch(e){return null;}}
async function avBackupCheck(force){
  if(AVB.busy||!masterKey||presentationMode||typeof driveOn!=='function'||!driveOn()||!dCfg('fid'))return null;
  const st=avBackupState();
  if(!force&&st&&Date.now()-st.at<AVB.every)return null;
  let text;
  AVB.busy=true;
  try{text=await driveDownload(!!force);}catch(e){AVB.busy=false;return null;}
  let ok=false;
  try{
    const c=JSON.parse(text),salt=new Uint8Array(c.salt),iter=containerIter(c);
    const same=window._salt&&b64e(salt)===b64e(window._salt)&&iter===window._iter;
    await decrypt(same?masterKey:await deriveKey(masterPwRaw,salt,iter),c.payload);
    ok=true;
  }catch(e){}
  AVB.busy=false;
  if(!masterKey)return null;
  try{localStorage.setItem('av_bkcheck',JSON.stringify({at:Date.now(),ok}));}catch(e){}
  try{renderDriveSettings();}catch(e){}
  if(!ok){
    const en=avEn();
    avNudge('⚠️ '+(en?'<b>The copy on Google Drive does not open</b> with your current master password — it may be damaged or saved with another password. Save the vault to send a fresh copy.'
      :'<b>A cópia no Google Drive não abre</b> com a tua palavra-passe atual — pode estar danificada ou ter sido gravada com outra palavra-passe. Grava o cofre para enviar uma cópia nova.'),
      [{label:en?'Save now':'Gravar agora',fn:()=>{try{saveFile();}catch(e){}}}],30000);
  }
  return ok;
}
function avBackupLine(){
  const st=avBackupState();if(!st)return '';
  const en=avEn(),days=Math.floor((Date.now()-st.at)/864e5);
  const ago=days<1?(en?'today':'hoje'):days===1?(en?'yesterday':'ontem'):(en?days+' days ago':'há '+days+' dias');
  return st.ok?(en?'✅ Drive copy checked '+ago+' — it opens with your password.':'✅ Cópia do Drive verificada '+ago+' — abre com a tua palavra-passe.')
    :(en?'⚠️ Drive copy checked '+ago+' — it did NOT open.':'⚠️ Cópia do Drive verificada '+ago+' — NÃO abriu.');
}
(function(){
  if(typeof doUnlock==='function'){const d=doUnlock;doUnlock=function(){const r=d.apply(this,arguments);
    setTimeout(()=>{try{avFailsReport();}catch(e){}},2200);
    setTimeout(()=>{try{avBackupCheck(false);}catch(e){}},25000);
    return r;};}
  if(typeof renderDriveSettings==='function'){const r=renderDriveSettings;renderDriveSettings=function(){const x=r.apply(this,arguments);
    try{const box=document.getElementById('drive-state'),l=avBackupLine();if(box&&l&&driveOn())box.textContent+='\n'+l;}catch(e){}
    return x;};}
})();
