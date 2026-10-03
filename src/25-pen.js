
/* ══ v10.28 — kit para a pen: a app (versão atual), uma cópia encriptada do cofre e um LEIA-ME, num ZIP feito aqui ══
   Funciona num computador, sem internet e sem servidor: abre-se «ABRIR-AQUI.html», que leva o estilo, o código, as fontes e
   o fundo dentro dele. O resto (PDF, QR, ícones) fica ao lado; o OCR das fotos fica de fora (não funciona a partir de ficheiros). */
const AV_PEN_FILES=['vendor/jsqr.js',
  'vendor/pdfjs-3.11.174/pdf.min.js','vendor/pdfjs-3.11.174/pdf.worker.min.js','vendor/pdfjs-3.11.174/LICENSE',
  'img/aurora-l.webp','img/aurora-p.webp','img/av-icon-v1.svg','img/av-icon-v1-32.png','img/av-icon-v1-192.png',
  'img/av-icon-v1-512.png','img/av-icon-v1-apple-180.png','img/av-icon-v1-maskable-512.png'];
const AV_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function avCrc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=AV_CRC[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
// ZIP sem compressão (as imagens e bibliotecas já vêm comprimidas): basta para qualquer computador o abrir
function avZip(entries){
  const enc=new TextEncoder(),parts=[],central=[];let off=0;
  const d=new Date(),time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  for(const e of entries){
    const name=enc.encode(e.name),data=e.data instanceof Uint8Array?e.data:enc.encode(e.data),crc=avCrc32(data);
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);
    h.setUint16(10,time,true);h.setUint16(12,date,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);
    h.setUint16(26,name.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);
    c.setUint16(12,time,true);c.setUint16(14,date,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);
    c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),name);
    off+=30+name.length+data.length;
  }
  const size=central.reduce((s,x)=>s+x.length,0),end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,entries.length,true);end.setUint16(10,entries.length,true);end.setUint32(12,size,true);end.setUint32(16,off,true);
  return new Blob([...parts,...central,new Uint8Array(end.buffer)],{type:'application/zip'});
}
function avB64(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);}
async function avPenFetch(path,asText){
  const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw new Error(path);
  return asText?r.text():new Uint8Array(await r.arrayBuffer());
}
function avPenReadme(en,withVault){
  const d=new Date().toLocaleDateString(en?'en-GB':'pt-PT',{year:'numeric',month:'long',day:'numeric'});
  return en?`AURORA VAULT — KIT FOR A USB STICK
Made on ${d}

HOW TO OPEN (on a computer, no internet needed)
1. If this is still a ZIP file: right-click it → «Extract All…» and keep the «Aurora Vault» folder (on the stick or on the computer).
2. Double-click «ABRIR-AQUI.html» — it opens in the web browser (Chrome or Edge work best).
3. Choose «Open Vault» and pick the file «ciphervault.vault»${withVault?' that is in this folder':''}.
4. Type the master password.

GOOD TO KNOW
- Everything is encrypted (AES-256). Without the master password nobody can open the vault.
${withVault?`- The copy of the vault in this folder is from ${d}. The most recent copy is on Google Drive (file «ciphervault.vault»), if it is in use.
`:'- This kit has no copy of the vault: put «ciphervault.vault» next to this file.\n'}- The 6-digit codes (2FA) are in the 2FA tab, which has its own lock: on a new computer it opens with the 2FA recovery code.
- From the stick, reading text from photos (OCR) and Google Drive sync are not available. Everything else works.
- Online version (when available): ${location.origin+location.pathname}
`:`AURORA VAULT — KIT PARA PEN
Feito a ${d}

COMO ABRIR (num computador, não precisa de internet)
1. Se isto ainda for um ficheiro ZIP: botão direito → «Extrair Tudo…» e guarda a pasta «Aurora Vault» (na pen ou no computador).
2. Faz duplo clique em «ABRIR-AQUI.html» — abre no browser (o Chrome ou o Edge funcionam melhor).
3. Escolhe «Abrir Cofre» e seleciona o ficheiro «ciphervault.vault»${withVault?', que está nesta pasta':''}.
4. Escreve a palavra-passe mestra.

BOM SABER
- Está tudo encriptado (AES-256). Sem a palavra-passe mestra ninguém consegue abrir o cofre.
${withVault?`- A cópia do cofre nesta pasta é de ${d}. A cópia mais recente está no Google Drive (ficheiro «ciphervault.vault»), se estiver a ser usado.
`:'- Este kit não tem cópia do cofre: põe o «ciphervault.vault» ao lado deste ficheiro.\n'}- Os códigos de 6 dígitos (2FA) estão no separador 2FA, que tem um fecho próprio: num computador novo abre com o código de recuperação 2FA.
- A partir da pen não estão disponíveis a leitura de texto em fotos (OCR) nem a sincronização com o Google Drive. Tudo o resto funciona.
- Versão online (enquanto existir): ${location.origin+location.pathname}
`;
}
async function avSha256(txt){return avB64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt))));}
// «ABRIR-AQUI.html» leva tudo dentro (estilo, código, fontes, fundo): funciona mesmo aberto diretamente de dentro do ZIP,
// que no Windows só extrai esse ficheiro para uma pasta temporária
async function avPenHtml(){
  let html=(await avPenFetch('index.html',true)).replace(/<link rel="preload" as="font"[^>]*>\s*/g,'');
  let css=await avPenFetch('styles.css',true);
  const fonts=[...new Set([...css.matchAll(/url\((vendor\/fonts\/[\w.-]+\.woff2)\)/g)].map(m=>m[1]))];
  for(const u of fonts){const b=await avPenFetch(u);css=css.split('url('+u+')').join('url(data:font/woff2;base64,'+avB64(b)+')');}
  html=html.replace(/<link rel="stylesheet" href="styles\.css[^"]*">/,()=>'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');
  const imgs={};for(const f of ['img/aurora-l.webp','img/aurora-p.webp'])imgs[f]='data:image/webp;base64,'+avB64(await avPenFetch(f));
  for(const f of ['img/av-icon-v1.svg','img/av-icon-v1-32.png']){const b=await avPenFetch(f);html=html.split('"'+f+'"').join('"data:'+(f.endsWith('.svg')?'image/svg+xml':'image/png')+';base64,'+avB64(b)+'"');}
  const hashes=[];
  for(const m of [...html.matchAll(/<script src="([\w/.-]+\.js)\?v=[^"]*"><\/script>/g)]){
    let js=(await avPenFetch(m[1],true)).replace(/<\/script/gi,'<\\/script');
    if(m[1]==='app.js')for(const [f,d] of Object.entries(imgs))js=js.split("'"+f+"'").join("'"+d+"'");
    hashes.push("'sha256-"+await avSha256(js)+"'");
    html=html.replace(m[0],()=>'<script>'+js+'</script>');
  }
  return html.replace("script-src 'self'","script-src 'self' "+hashes.join(' '));
}
async function avPenBuild(withVault){
  const en=avEn(),out=[{name:'ABRIR-AQUI.html',data:await avPenHtml()}];
  for(const f of AV_PEN_FILES)out.push({name:f,data:await avPenFetch(f)});
  let vaultIn=false;
  if(withVault){
    try{if(typeof hasUnsaved!=='undefined'&&hasUnsaved)await saveFile({auto:true});}catch(e){}
    let json='';try{const l=await localVaultGet();json=(l&&l.json)||'';}catch(e){}
    if(!json&&typeof pendingVaultText==='string')json=pendingVaultText;
    if(json){out.push({name:'ciphervault.vault',data:json});vaultIn=true;}
  }
  out.push({name:en?'READ-ME.txt':'LEIA-ME.txt',data:avPenReadme(en,vaultIn).replace(/\n/g,'\r\n')});
  return {blob:avZip(out.map(e=>({name:'Aurora Vault/'+e.name,data:e.data}))),vaultIn};
}
async function avPenDownload(){
  const en=avEn();
  if(location.protocol==='file:'){toast(en?'Open the online app to make a new kit.':'Abre a app online para fazer um kit novo.');return;}
  const btn=document.getElementById('s-pen-btn');if(btn)btn.disabled=true;
  toast(en?'Preparing the kit…':'A preparar o kit…');
  try{
    const {blob,vaultIn}=await avPenBuild(!!masterKey);
    const d=new Date(),z=n=>String(n).padStart(2,'0');
    downloadBlob(blob,'aurora-vault-pen-'+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'.zip');
    toast(vaultIn?(en?'📦 Kit ready: app + encrypted copy of the vault. Extract the ZIP onto the stick (right-click → Extract All).':'📦 Kit pronto: app + cópia encriptada do cofre. Extrai o ZIP para a pen (botão direito → Extrair Tudo).')
      :(en?'📦 Kit ready (app only). Extract the ZIP onto the stick (right-click → Extract All).':'📦 Kit pronto (só a app). Extrai o ZIP para a pen (botão direito → Extrair Tudo).'));
  }catch(e){toast(en?'Could not make the kit — check the connection and try again.':'Não foi possível fazer o kit — verifica a ligação e tenta outra vez.');}
  if(btn)btn.disabled=false;
}
