// ══ PWA PERSONALIZADA ══
// O ícone e o nome da app são sempre os oficiais (escudo AV); a antiga personalização por emoji foi retirada
function getPwaPrefs(){
  try{localStorage.removeItem('cv_pwa');}catch(e){}
  return{name:'Aurora Vault',emoji:''};
}
function buildManifest(){
  const prefs=getPwaPrefs();
  const tc=themeColors[currentTheme]||themeColors.dark;
  const bg=tc.bg||'#0d0f14';
  const encBg=encodeURIComponent(bg);
  const inner=`%3Ctext x='256' y='330' font-size='300' text-anchor='middle'%3E${encodeURIComponent(prefs.emoji||'')}%3C/text%3E`;
  const icon=`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='${encBg}'/%3E${inner}%3C/svg%3E`;
  let base='./';try{if(/^https?:$/.test(location.protocol))base=new URL('./',location.href).href;}catch(e){}
  // Ícone da app = escudo AV (PNG: é o que o Android usa para instalar); com emoji escolhido nas definições, fica o emoji
  const icons=prefs.emoji?[{src:icon,sizes:'512x512',type:'image/svg+xml',purpose:'any maskable'}]:[
    {src:base+'img/av-icon-v1-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:base+'img/av-icon-v1-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
    {src:base+'img/av-icon-v1-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}];
  const mf={name:prefs.name,short_name:prefs.name.slice(0,12),description:'Cofre digital pessoal — passwords, documentos, notas, cartões e 2FA — tudo encriptado',start_url:base,scope:base,display:'standalone',background_color:bg,theme_color:bg,orientation:'any',icons};
  const en_=currentLang==='en';
  const shIc=e=>`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='${encBg}'/%3E%3Ctext x='48' y='68' font-size='52' text-anchor='middle'%3E${encodeURIComponent(e)}%3C/text%3E%3C/svg%3E`;
  mf.shortcuts=[
    {name:en_?'Add':'Adicionar',short_name:en_?'Add':'Adicionar',url:base+'?go=add',icons:[{src:shIc('＋'),sizes:'96x96',type:'image/svg+xml'}]},
    {name:en_?'2FA codes':'Códigos 2FA',short_name:'2FA',url:base+'?go=totp',icons:[{src:shIc('🔢'),sizes:'96x96',type:'image/svg+xml'}]},
    {name:en_?'Store cards':'Cartões de loja',short_name:en_?'Cards':'Lojas',url:base+'?go=store',icons:[{src:shIc('🎟️'),sizes:'96x96',type:'image/svg+xml'}]},
    {name:en_?'Search':'Pesquisar',short_name:en_?'Search':'Pesquisar',url:base+'?go=search',icons:[{src:shIc('🔍'),sizes:'96x96',type:'image/svg+xml'}]}
  ];
  mf.share_target={action:base+'share-target',method:'POST',enctype:'multipart/form-data',params:{title:'title',text:'text',url:'url',files:[{name:'files',accept:['image/*','application/pdf','.pdf']}]}};
  const link=document.getElementById('pwa-manifest');
  if(link){
    // Liberta o manifesto anterior (era criado um blob novo a cada mudança de cor, sem nunca libertar os antigos)
    const old=link.getAttribute('href');
    link.setAttribute('href',URL.createObjectURL(new Blob([JSON.stringify(mf)],{type:'application/json'})));
    if(old&&old.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(old),5000);
  }
}

// ══ PARTILHA POR QR ENCRIPTADO ══
let shareEntryId=null,pendingSharePayload=null;
async function deriveShareKey(pw,salt){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
function openShareModal(id){
  shareEntryId=id;
  const en=currentLang==='en';
  document.getElementById('share-title').textContent=en?'🔗 Share via QR':'🔗 Partilhar por QR';
  document.getElementById('share-explain').textContent=en
    ?'Set a temporary password. On the other device you will scan this QR and type this password to import the entry.'
    :'Define uma password temporária. No outro dispositivo vais ler o QR e escrever essa password para importar a entrada.';
  document.getElementById('share-pw-lbl').textContent=en?'Temporary password':'Password temporária';
  document.getElementById('share-gen-btn').textContent=en?'Generate QR':'Gerar QR';
  document.getElementById('share-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('share-done-btn').textContent=en?'Done':'Concluído';
  document.getElementById('share-hint').textContent=en
    ?'On the other device: Vault → 📥 QR → point the camera → type the temporary password.'
    :'No outro dispositivo: Cofre → 📥 QR → aponta a câmara → escreve a password temporária.';
  document.getElementById('share-step-pw').style.display='block';
  document.getElementById('share-step-qr').style.display='none';
  document.getElementById('share-pw').value='';
  document.getElementById('share-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('share-pw').focus(),100);
}
function closeShareModal(){document.getElementById('share-overlay').classList.remove('open');shareEntryId=null;}
async function generateShareQR(){
  const en=currentLang==='en';
  const pw=document.getElementById('share-pw').value.trim();
  if(pw.length<4){toast(en?'Password: at least 4 characters.':'Password: mínimo 4 caracteres.');return;}
  const e=vault.find(v=>v.id===shareEntryId);if(!e)return;
  const lite={name:e.name,user:e.user||'',pw:e.pw||'',url:e.url||'',notes:e.notes||'',tags:e.tags||[],icon:e.icon||'',cat:e.cat||'outro',fields:e.fields||[]};
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveShareKey(pw,salt);
  let bytes=new TextEncoder().encode(JSON.stringify(lite));
  const gz=await gzipBytes(bytes);if(gz&&gz.length<bytes.length)bytes=gz;
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));
  const packed=new Uint8Array(16+12+ct.length);
  packed.set(salt,0);packed.set(iv,16);packed.set(ct,28);
  const payload='CVSHARE1:'+await u8ToB64(packed);
  const m=CVQR.matrix(payload);
  if(!m){toast(en?'Entry too large for a QR (long notes?).':'Entrada demasiado grande para QR (notas longas?).');return;}
  const canvas=document.getElementById('share-canvas');
  const scale=4,quiet=4,size=(m.length+quiet*2)*scale;
  canvas.width=size;canvas.height=size;
  canvas.style.width=Math.min(size,260)+'px';canvas.style.height=Math.min(size,260)+'px';
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000';
  for(let r=0;r<m.length;r++)for(let cc2=0;cc2<m.length;cc2++)
    if(m[r][cc2])ctx.fillRect((cc2+quiet)*scale,(r+quiet)*scale,scale,scale);
  document.getElementById('share-entry-name').textContent='🔐 '+e.name;
  document.getElementById('share-step-pw').style.display='none';
  document.getElementById('share-step-qr').style.display='block';
  if(e.attachment)toast(en?'Note: attachments are not included in the QR.':'Nota: anexos não vão no QR.');
}
function openShareImport(raw){
  pendingSharePayload=raw;
  const en=currentLang==='en';
  document.getElementById('shimport-title').textContent=en?'📥 Import entry':'📥 Importar entrada';
  document.getElementById('shimport-explain').textContent=en
    ?'QR read! Type the temporary password set on the other device.'
    :'QR lido! Escreve a password temporária definida no outro dispositivo.';
  document.getElementById('shimport-pw-lbl').textContent=en?'Temporary password':'Password temporária';
  document.getElementById('shimport-ok-btn').textContent=en?'Import':'Importar';
  document.getElementById('shimport-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('shimport-pw').value='';
  document.getElementById('shimport-err').textContent='';
  document.getElementById('shimport-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('shimport-pw').focus(),100);
}
function closeShareImport(){document.getElementById('shimport-overlay').classList.remove('open');pendingSharePayload=null;}
async function confirmShareImport(){
  const en=currentLang==='en';
  const pw=document.getElementById('shimport-pw').value.trim();
  const errEl=document.getElementById('shimport-err');
  if(!pw||!pendingSharePayload)return;
  try{
    const packed=await b64ToU8(pendingSharePayload.slice(9));
    const salt=packed.slice(0,16),iv=packed.slice(16,28),ct=packed.slice(28);
    const key=await deriveShareKey(pw,salt);
    let dec=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct));
    if(dec.length>2&&dec[0]===0x1f&&dec[1]===0x8b)dec=await gunzipBytes(dec);
    const lite=JSON.parse(new TextDecoder().decode(dec));
    const entry={id:Date.now().toString(36),name:lite.name||'...',user:lite.user||'',pw:lite.pw||'',url:lite.url||'',notes:lite.notes||'',tags:lite.tags||[],icon:lite.icon||'',cat:(CATS[lite.cat]||customCats.some(x=>x.key===lite.cat))?lite.cat:'outro',fields:lite.fields||[],createdAt:Date.now(),pwChangedAt:Date.now()};
    vault.push(entry);
    logActivity('add',entry.name,'📥');
    closeShareImport();
    renderAll();markUnsaved();
    toast(en?`Imported: ${entry.name} ✓`:`Importado: ${entry.name} ✓`);
  }catch(e){
    errEl.textContent=en?'Wrong password or corrupted QR.':'Password errada ou QR corrompido.';
  }
}

// ══ LEITOR DE QR (2FA) ══
let qrScanStream=null,qrScanRAF=null,qrDetector=null,qrScanMode='totp';
async function openQrScanner(mode='totp'){
  qrScanMode=mode;
  const en=currentLang==='en';
  document.getElementById('qrscan-title').textContent=qrScanMode==='share'
    ?(en?'📥 Import via QR':'📥 Importar por QR')
    :(en?'📷 Scan QR Code':'📷 Ler QR Code');
  document.getElementById('qrscan-file-btn').textContent=en?'🖼️ Read from an image':'🖼️ Ler de uma imagem';
  document.getElementById('qrscan-cancel-btn').textContent=en?'Cancel':'Cancelar';
  const status=document.getElementById('qrscan-status');
  status.textContent=en?'Starting camera...':'A iniciar câmara...';
  document.getElementById('qrscan-overlay').classList.add('open');
  qrDetector=avMakeQrDetector();
  if(!qrDetector){status.textContent=en?'QR detector unavailable — use the image option.':'Detetor indisponível — usa a opção de imagem.';return;}
  try{
    qrScanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    const video=document.getElementById('qrscan-video');
    video.srcObject=qrScanStream;
    await video.play();
    status.textContent=qrScanMode==='gauth'?(en?'Point at the Google Authenticator QR code':'Aponta ao QR do Google Authenticator'):(en?'Point at the QR code shown by the website':'Aponta ao QR code que o site mostra');
    qrScanLoop();
  }catch(err){
    status.textContent=en
      ?'Camera unavailable (permission denied?). Use the image option below.'
      :'Câmara indisponível (permissão negada?). Usa a opção de imagem em baixo.';
  }
}
async function qrScanLoop(){
  const video=document.getElementById('qrscan-video');
  if(!qrDetector||!video||!video.srcObject){return;}
  try{
    const codes=await qrDetector.detect(video);
    if(codes.length&&handleScannedQr(codes[0].rawValue))return;
  }catch(e){}
  qrScanRAF=setTimeout(qrScanLoop,250);
}
async function scanQrFromFile(ev){
  const file=ev.target.files[0];ev.target.value='';
  if(!file)return;
  const en=currentLang==='en';
  const status=document.getElementById('qrscan-status');
  try{
    if(!qrDetector)qrDetector=avMakeQrDetector();
    const bmp=await createImageBitmap(file);
    const codes=await qrDetector.detect(bmp);
    if(!codes.length){status.textContent=en?'No QR code found in the image.':'Nenhum QR code encontrado na imagem.';return;}
    handleScannedQr(codes[0].rawValue);
  }catch(e){
    status.textContent=en?'Could not read the image.':'Não foi possível ler a imagem.';
  }
}
function handleScannedQr(raw){
  const en=currentLang==='en';
  if(qrScanMode==='share'){
    if(!raw||!raw.startsWith('CVSHARE1:')){
      document.getElementById('qrscan-status').textContent=en
        ?'That QR is not a Aurora Vault share. Keep trying or cancel.'
        :'Esse QR não é uma partilha Aurora Vault. Tenta outro ou cancela.';
      return false;
    }
    closeQrScanner();
    openShareImport(raw);
    return true;
  }
  const parsed=parseOtpauth(raw||'');
  if(!parsed||!parsed.secret||!b32decode(parsed.secret)){
    document.getElementById('qrscan-status').textContent=en
      ?'That QR is not a 2FA code (otpauth). Keep trying or cancel.'
      :'Esse QR não é um código 2FA (otpauth). Tenta outro ou cancela.';
    return false;
  }
  const nameEl=document.getElementById('tf-name');
  const accEl=document.getElementById('tf-account');
  if(nameEl&&!nameEl.value.trim())nameEl.value=parsed.name;
  if(accEl&&!accEl.value.trim())accEl.value=parsed.account;
  document.getElementById('tf-secret').value=parsed.secret;
  closeQrScanner();
  toast(en?'QR read! Fields filled ✓':'QR lido! Campos preenchidos ✓');
  return true;
}
function closeQrScanner(){
  const o=document.getElementById('qrscan-overlay');
  if(o)o.classList.remove('open');
  if(qrScanRAF){clearTimeout(qrScanRAF);qrScanRAF=null;}
  if(qrScanStream){qrScanStream.getTracks().forEach(t2=>t2.stop());qrScanStream=null;}
  const video=document.getElementById('qrscan-video');
  if(video)video.srcObject=null;
}

// ══ RECICLAGEM ══
const TRASH_DAYS=30;
const TRASH_TYPE_META={
  vault:{icon:'🔐',label:{pt:'Entrada',en:'Entry'}},
  note:{icon:'📝',label:{pt:'Nota',en:'Note'}},
  card:{icon:'💳',label:{pt:'Cartão',en:'Card'}},
  doc:{icon:'📁',label:{pt:'Documento',en:'Document'}},
  totp:{icon:'🔢',label:{pt:'Código 2FA',en:'2FA Code'}},
};
function trashItemName(it){
  if(it.type==='vault')return it.data.name||'...';
  if(it.type==='note')return it.data.title||'...';
  if(it.type==='card')return it.data.bank||'...';
  if(it.type==='doc')return it.data.title||'...';
  if(it.type==='totp')return it.data.name||'...';
  return '...';
}
function cleanOldTrash(){
  trash=trash.filter(it=>Date.now()-it.deletedAt<TRASH_DAYS*86400000);
}
function renderTrash(){
  const grid=document.getElementById('trash-grid');if(!grid)return;
  cleanOldTrash();
  const title=document.getElementById('trash-title');
  if(title)title.textContent=currentLang==='en'?'Recycle Bin':'Reciclagem';
  const emptyBtn=document.getElementById('trash-empty-btn');
  if(emptyBtn){
    emptyBtn.style.display=trash.length?'block':'none';
    emptyBtn.textContent=currentLang==='en'?'🗑️ Empty bin':'🗑️ Esvaziar tudo';
  }
  const info=document.getElementById('trash-info');
  if(info)info.textContent=trash.length
    ?(currentLang==='en'?`Items are kept for ${TRASH_DAYS} days, then permanently deleted.`:`Os itens ficam guardados ${TRASH_DAYS} dias e depois são apagados permanentemente.`)
    :'';
  if(!trash.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
      <p>${currentLang==='en'?'Recycle bin is empty.':'A reciclagem está vazia.'}</p>
    </div>`;
    return;
  }
  grid.innerHTML=trash.map((it,idx)=>{
    const meta=TRASH_TYPE_META[it.type]||{icon:'📄',label:{pt:'Item',en:'Item'}};
    const daysLeft=TRASH_DAYS-Math.floor((Date.now()-it.deletedAt)/86400000);
    const urgent=daysLeft<=5;
    return `<div class="trash-card">
      <div class="trash-card-top">
        <div class="trash-type-icon">${meta.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="trash-card-name">${esc(trashItemName(it))}</div>
          <div class="trash-card-type">${meta.label[currentLang]||meta.label.pt} · ${timeAgo(it.deletedAt)}</div>
        </div>
        <span class="trash-days-badge${urgent?' urgent':''}">⏳ ${daysLeft}d</span>
      </div>
      <div class="card-actions" style="margin-top:0">
        <button class="card-btn" data-act="restoreTrashItem" data-args='[${idx}]'>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          ${currentLang==='en'?'Restore':'Restaurar'}
        </button>
        <button class="card-btn danger" data-act="deleteTrashForever" data-args='[${idx}]'>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          ${currentLang==='en'?'Delete forever':'Apagar já'}
        </button>
      </div>
    </div>`;
  }).join('');
}
function restoreTrashItem(idx){
  const it=trash[idx];if(!it)return;
  if(it.type==='vault')vault.push(it.data);
  else if(it.type==='note')notes.push(it.data);
  else if(it.type==='card')bankCards.push(it.data);
  else if(it.type==='doc')documents.push(it.data);
  else if(it.type==='totp')totp.push(it.data);
  logActivity('restore',trashItemName(it),'♻️');
  trash.splice(idx,1);
  renderAll();
  toast(currentLang==='en'?'Restored! ✓':'Restaurado! ✓');
  markUnsaved();
}
function deleteTrashForever(idx){
  const it=trash[idx];if(!it)return;
  if(!confirm(currentLang==='en'
    ?'Permanently delete? This CANNOT be undone!'
    :'Apagar permanentemente? Esta ação NÃO pode ser desfeita!'))return;
  trash.splice(idx,1);
  renderTrash();
  toast(currentLang==='en'?'Permanently deleted.':'Apagado permanentemente.');
  markUnsaved();
}
function emptyTrash(){
  if(!trash.length)return;
  if(!confirm(currentLang==='en'
    ?`Permanently delete all ${trash.length} items? This CANNOT be undone!`
    :`Apagar permanentemente os ${trash.length} itens? Esta ação NÃO pode ser desfeita!`))return;
  trash=[];
  renderTrash();
  toast(currentLang==='en'?'Recycle bin emptied.':'Reciclagem esvaziada.');
  markUnsaved();
}

// ══ PASTAS DE DOCUMENTOS ══
let editingFolderId=null,movingDocId=null,folderScope='doc',movingKind='doc';
function scopeFolderArr(s){return (s||folderScope)==='vault'?vaultFolders:docFolders;}
function scopeItems(s){return (s||folderScope)==='vault'?vault:documents;}
function scopeCurrentFolder(s){return (s||folderScope)==='vault'?currentVaultFolderId:currentFolderId;}
function scopeRootLabel(s){return (s||folderScope)==='vault'?(currentLang==='en'?'Vault':'Cofre'):(currentLang==='en'?'Documents':'Documentos');}
function scopePathLabel(id,s){return folderPathLabel(id,scopeFolderArr(s),scopeRootLabel(s));}
function rerenderScope(s){
  if((s||folderScope)==='vault'){renderSidebar();renderCards();renderDashboard();}
  else renderDocs();
}
function folderById(id,arr){return (arr||docFolders).find(f=>f.id===id)||null;}
function folderPath(id,arr){
  const list=arr||docFolders;
  const path=[];let cur=folderById(id,list),guard=0;
  while(cur&&guard++<50){path.unshift(cur);cur=cur.parentId?folderById(cur.parentId,list):null;}
  return path;
}
function folderPathLabel(id,arr,rootLabel){
  const root=rootLabel||(currentLang==='en'?'Documents':'Documentos');
  if(!id)return root;
  const p=folderPath(id,arr);
  if(!p.length)return root;
  return p.map(f=>`${f.icon||'📁'} ${f.name}`).join(' / ');
}
function isDescendantFolder(candidateId,ancestorId){
  let cur=folderById(candidateId),guard=0;
  while(cur&&guard++<50){if(cur.id===ancestorId)return true;cur=cur.parentId?folderById(cur.parentId):null;}
  return false;
}
function folderDirectCounts(id,arr,items){
  const list=arr||docFolders,its=items||documents;
  return{
    folders:list.filter(f=>(f.parentId||null)===(id||null)).length,
    docs:its.filter(d=>(d.folderId||null)===(id||null)).length
  };
}
function openFolderModal(id=null,scope='doc'){
  folderScope=scope;
  editingFolderId=id;
  const en=currentLang==='en';
  const isEdit=!!id;
  document.getElementById('folder-modal-title').textContent=isEdit
    ?(en?'📁 Rename Folder':'📁 Renomear Pasta')
    :(en?'📁 New Folder':'📁 Nova Pasta');
  document.getElementById('folder-save-btn').textContent=isEdit?(en?'Save':'Guardar'):(en?'Create':'Criar');
  document.getElementById('folder-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('folder-name').placeholder=en?'Folder name':'Nome da pasta';
  const parentLine=document.getElementById('folder-parent-line');
  if(isEdit){
    const f=folderById(id,scopeFolderArr());
    document.getElementById('folder-name').value=f?.name||'';
    document.getElementById('folder-icon').value=f?.icon||'';
    parentLine.textContent=(en?'In: ':'Em: ')+scopePathLabel(f?.parentId||null);
  }else{
    document.getElementById('folder-name').value='';
    document.getElementById('folder-icon').value='';
    parentLine.textContent=(en?'Will be created in: ':'Será criada em: ')+scopePathLabel(scopeCurrentFolder());
  }
  document.getElementById('folder-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('folder-name').focus(),100);
}
function closeFolderModal(){document.getElementById('folder-overlay').classList.remove('open');editingFolderId=null;}
function saveFolder(){
  const en=currentLang==='en';
  const name=document.getElementById('folder-name').value.trim();
  const icon=(document.getElementById('folder-icon').value||'').trim()||'📁';
  if(!name){toast(en?'Folder name is required!':'Nome da pasta obrigatório!');return;}
  const arr=scopeFolderArr();
  const renaming=!!editingFolderId;
  if(editingFolderId){
    const f=folderById(editingFolderId,arr);
    if(f){f.name=name;f.icon=icon;logActivity('edit',name,'📁');}
  }else{
    arr.push({id:'f'+Date.now().toString(36),name,icon,parentId:scopeCurrentFolder()});
    logActivity('add',name,'📁');
  }
  const sc=folderScope;
  closeFolderModal();rerenderScope(sc);
  toast(renaming?(en?'Folder renamed ✓':'Pasta renomeada ✓'):(en?'Folder created ✓':'Pasta criada ✓'));
  markUnsaved();
}
function deleteFolder(id,scope='doc'){
  const en=currentLang==='en';
  const arr=scopeFolderArr(scope),items=scopeItems(scope);
  const f=folderById(id,arr);if(!f)return;
  const c2=folderDirectCounts(id,arr,items);
  const total=c2.docs+c2.folders;
  const parentLabel=scopePathLabel(f.parentId||null,scope);
  const msg=total
    ?(en?`Delete "${f.name}"? Its ${c2.docs} document(s) and ${c2.folders} subfolder(s) move up to ${parentLabel}.`
        :`Apagar "${f.name}"? Os ${c2.docs} documento(s) e ${c2.folders} subpasta(s) passam para ${parentLabel}.`)
    :(en?`Delete folder "${f.name}"?`:`Apagar a pasta "${f.name}"?`);
  if(!confirm(msg))return;
  items.forEach(d=>{if((d.folderId||null)===id)d.folderId=f.parentId||null;});
  arr.forEach(x=>{if(x.parentId===id)x.parentId=f.parentId||null;});
  if(scope==='vault'){vaultFolders=vaultFolders.filter(x=>x.id!==id);if(currentVaultFolderId===id)currentVaultFolderId=f.parentId||null;}
  else{docFolders=docFolders.filter(x=>x.id!==id);if(currentFolderId===id)currentFolderId=f.parentId||null;}
  logActivity('delete',f.name,'📁');
  rerenderScope(scope);toast(en?'Folder deleted.':'Pasta apagada.');markUnsaved();
}
function openFolder(id){currentFolderId=id;renderDocs();}
function goToFolder(id){currentFolderId=id;renderDocs();}
function populateFolderSelect(selectedId){
  const sel=document.getElementById('doc-folder');if(!sel)return;
  const en=currentLang==='en';
  const opts=[`<option value="">${en?'🏠 Documents (root)':'🏠 Documentos (raiz)'}</option>`];
  const walk=(parentId,depth)=>{
    docFolders.filter(f=>(f.parentId||null)===parentId).forEach(f=>{
      opts.push(`<option value="${f.id}">${'　'.repeat(depth)}${f.icon||'📁'} ${esc(f.name)}</option>`);
      walk(f.id,depth+1);
    });
  };
  walk(null,1);
  sel.innerHTML=opts.join('');
  sel.value=selectedId||'';
}
function openMoveModal(id,kind='doc'){
  movingDocId=id;movingKind=kind;
  const en=currentLang==='en';
  const arr=kind==='vault'?vaultFolders:docFolders;
  const item=kind==='vault'?vault.find(x=>x.id===id):documents.find(x=>x.id===id);
  if(!item)return;
  document.getElementById('move-modal-title').textContent=en?'📂 Move to...':'📂 Mover para...';
  document.getElementById('move-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('move-doc-name').textContent=kind==='vault'
    ?`${item.icon&&item.icon!=='⭐'?item.icon:'🔐'} ${item.name}`
    :`${getDocAutoIcon(item)} ${item.title}`;
  const cur=item.folderId||null;
  const rootLbl=kind==='vault'?(en?'🏠 Vault (root)':'🏠 Cofre (raiz)'):(en?'🏠 Documents (root)':'🏠 Documentos (raiz)');
  const list=[{id:null,label:rootLbl,depth:0}];
  const walk=(parentId,depth)=>{
    arr.filter(f=>(f.parentId||null)===parentId).forEach(f=>{
      list.push({id:f.id,label:`${esc(f.icon||'📁')} ${esc(f.name)}`,depth});
      walk(f.id,depth+1);
    });
  };
  walk(null,1);
  document.getElementById('move-list').innerHTML=list.map(o=>{
    const isCur=(o.id||null)===cur;
    return `<button class="move-opt${isCur?' current':''}" ${isCur?'disabled':`data-act="confirmMoveDoc" data-arg="${esc(o.id||'')}"`}>
      <span style="padding-left:${o.depth*14}px">${o.label}</span>
      ${isCur?`<span style="margin-left:auto;font-size:.6rem;color:var(--text-muted)">${en?'current':'atual'}</span>`:''}
    </button>`;
  }).join('');
  document.getElementById('move-overlay').classList.add('open');
}
function closeMoveModal(){document.getElementById('move-overlay').classList.remove('open');movingDocId=null;}
function confirmMoveDoc(folderId){
  const kind=movingKind;
  const item=kind==='vault'?vault.find(x=>x.id===movingDocId):documents.find(x=>x.id===movingDocId);
  if(!item)return;
  item.folderId=folderId||null;
  logActivity('edit',kind==='vault'?item.name:item.title,'📂');
  closeMoveModal();
  rerenderScope(kind);
  toast((currentLang==='en'?'Moved to ':'Movido para ')+scopePathLabel(folderId||null,kind)+' ✓');
  markUnsaved();
}

// ══ MENU DA BARRA DE TOPO (telemóvel) ══
function toggleTopMenu(ev){
  if(ev)ev.stopPropagation();
  const m=document.getElementById('tb-secondary');
  if(m)m.classList.toggle('open');
}
function closeTopMenu(){
  const m=document.getElementById('tb-secondary');
  if(m)m.classList.remove('open');
}
document.addEventListener('click',e=>{
  const m=document.getElementById('tb-secondary');
  if(!m||!m.classList.contains('open'))return;
  if(e.target.closest('#tb-more'))return;
  if(m.contains(e.target)){
    if(e.target.closest('button'))setTimeout(closeTopMenu,60);
    return;
  }
  closeTopMenu();
});

// ══ HERANÇA DIGITAL ══
function qrDataUrl(text,scale,quiet){
  try{
    const m=CVQR.matrix(text);
    if(!m)return null;
    const cv=document.createElement('canvas');
    const size=(m.length+quiet*2)*scale;
    cv.width=size;cv.height=size;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
    ctx.fillStyle='#000';
    for(let r=0;r<m.length;r++)for(let cc=0;cc<m.length;cc++)
      if(m[r][cc])ctx.fillRect((cc+quiet)*scale,(r+quiet)*scale,scale,scale);
    return cv.toDataURL('image/png');
  }catch(e){return null;}
}
let legacyLang='pt';
function setLegacyLang(l){legacyLang=l;renderLegacyLang();}
function renderLegacyLang(){
  ['pt','en'].forEach(l=>{
    const b=document.getElementById('legacy-lang-'+l);
    if(b)b.classList.toggle('active',legacyLang===l);
  });
}
function openLegacyModal(){
  const en=currentLang==='en';
  if(!masterKey&&!presentationMode){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  document.getElementById('legacy-title').textContent=en?'📜 Digital Legacy':'📜 Herança Digital';
  document.getElementById('legacy-intro').textContent=en
    ?'A sheet to print and keep for the people you trust. It explains how to reach everything in your vault — without containing the master password itself.'
    :'Uma folha para imprimires e guardares para quem confias. Explica como chegar a tudo o que está no cofre — sem conter a palavra-passe mestra.';
  document.getElementById('legacy-lang-lbl').textContent=en?'Document language':'Idioma do documento';
  legacyLang=currentLang;renderLegacyLang();
  document.getElementById('legacy-owner-lbl').textContent=en?'Your name (appears on the sheet)':'O teu nome (aparece na folha)';
  document.getElementById('legacy-msg-lbl').textContent=en?'Personal message (optional)':'Mensagem pessoal (opcional)';
  document.getElementById('legacy-msg').placeholder=en
    ?'Anything you want them to read: practical notes, what matters most, or simply a few words.'
    :'O que quiseres que leiam: notas práticas, o que é mais importante, ou apenas algumas palavras.';
  document.getElementById('legacy-pwbox-lbl').textContent=totpRecWrap
    ?(en?'Include a space to write the master password and the 2FA recovery code on this sheet':'Incluir espaço para escrever a palavra-passe e o código de recuperação 2FA nesta folha')
    :(en?'Include a space to write the master password on this sheet':'Incluir espaço para escrever a palavra-passe nesta folha');
  document.getElementById('legacy-pwwarn').textContent=en
    ?'Recommended off: keep the sheet and the password in separate places. Whoever finds the sheet alone can open nothing.'
    :'Recomendado desligado: guarda a folha e a palavra-passe em sítios separados. Quem encontrar só a folha não abre nada.';
  {const nRec=totp.filter(x=>x&&x.recovery).length,locked=typeof aurTotpLocked==='function'&&aurTotpLocked();
   const box=document.getElementById('legacy-recbox'),w=document.getElementById('legacy-recwarn');
   const show=nRec||locked||totp.length>0;
   document.getElementById('legacy-rec-row').style.display=show?'flex':'none';w.style.display=show?'':'none';
   box.checked=false;box.disabled=locked||!nRec;
   document.getElementById('legacy-recbox-lbl').textContent=en?'Include the 2FA recovery codes'+(nRec?' ('+nRec+')':''):'Incluir os códigos de recuperação da 2FA'+(nRec?' ('+nRec+')':'');
   w.textContent=locked?(en?'The 2FA tab is locked — unlock it first to include the codes.':'O separador 2FA está trancado — desbloqueia-o primeiro para incluir os códigos.')
     :!nRec?(en?(totp.length===1?'Your 2FA account has no recovery codes saved.':'None of your '+totp.length+' 2FA accounts has recovery codes saved.')+' They are the emergency codes each service gives when you turn on 2FA — add them in 2FA → Edit → Recovery codes.'
       :(totp.length===1?'A tua conta 2FA não tem códigos de recuperação guardados.':'Nenhuma das tuas '+totp.length+' contas 2FA tem códigos de recuperação guardados.')+' São os códigos de emergência que cada serviço dá quando ativas a 2FA — adiciona-os em 2FA → Editar → Códigos de recuperação.')
     :(en?'They let someone into those accounts without your phone. Only print them if the sheet will be kept safe.':'Permitem entrar nessas contas sem o teu telemóvel. Só os incluas se a folha ficar bem guardada.');}
  document.getElementById('legacy-gen-btn').textContent=en?'Generate sheet':'Gerar folha';
  document.getElementById('legacy-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('legacy-msg').value=presentationMode?'':(legacyNote||'');
  document.getElementById('legacy-owner').value=presentationMode?'':(legacyOwner||'');
  document.getElementById('legacy-overlay').classList.add('open');
}
function closeLegacyModal(){document.getElementById('legacy-overlay').classList.remove('open');}
function generateLegacyDoc(){
  const en=currentLang==='en';
  const den=legacyLang==='en';
  const msg=document.getElementById('legacy-msg').value.trim();
  const owner=document.getElementById('legacy-owner').value.trim();
  const withPwBox=document.getElementById('legacy-pwbox').checked;
  const recBox=document.getElementById('legacy-recbox'),withRec=!!(recBox&&recBox.checked&&!recBox.disabled);
  const recs=withRec?totp.filter(x=>x&&x.recovery).map(x=>({name:x.issuer||x.name||'—',acc:x.account||'',codes:String(x.recovery)})):[];
  const drv=typeof driveOn==='function'&&driveOn()?{hint:dCfg('hint')}:null;
  const t2prot=!!totpRecWrap;
  if(!presentationMode&&(msg!==legacyNote||owner!==legacyOwner)){
    legacyNote=msg;legacyOwner=owner;markUnsaved();
  }
  const url=location.origin+location.pathname;
  const qr=qrDataUrl(url,4,3);
  const now=new Date().toLocaleDateString(den?'en-GB':'pt-PT',{year:'numeric',month:'long',day:'numeric'});
  const nActive=vault.filter(e=>!e.archived).length;
  const inv=[
    [nActive,den?'accounts and passwords':'contas e palavras-passe'],
    [documents.length,den?'documents':'documentos'],
    [bankCards.length,den?'bank cards':'cartões bancários'],
    [totp.length,den?'verification codes (2FA)':'códigos de verificação (2FA)'],
    [notes.length,den?'secure notes':'notas seguras'],
    [wifiNets.length,den?'WiFi networks':'redes WiFi'],
  ].filter(x=>x[0]>0);
  const line=n=>`<div class="wl"></div>`.repeat(n);
  const L=den?{
    title:'DIGITAL LEGACY',
    sub:'How to reach everything kept in the digital vault',
    of:'Vault of',
    intro:'If you are reading this, you need to get into my digital vault. Everything you need is explained below, step by step. Take your time — nothing here expires in a hurry.',
    s1:'1. What this is',
    p1:'All my accounts, passwords, documents, bank cards and verification codes are inside a single encrypted file named <b>ciphervault.vault</b>. The file is protected with AES-256-GCM encryption: without the master password it is unreadable, and no company or server holds a copy. It exists only where I saved it.',
    s2:'2. What you will find inside',
    s3:'3. Where the file is',
    p3:'Every place a copy is kept — drive, external disk, cloud folder:',
    s4:'4. How to open it',
    p4:'On any computer or phone with a web browser:',
    st1:'Open this address (or scan the code with the phone camera):',
    st2:'Tap <b>“Open Vault”</b>.',
    st3:'Choose the <b>.vault</b> file.',
    st4:'Type the master password and confirm.',
    note:'No internet is needed after the page has loaded once, and nothing is ever uploaded anywhere.',
    s5:'5. IMPORTANT — 6-digit codes (two-step verification)',
    p5:'Many accounts ask for a <b>6-digit code</b> after the password. Those codes may be in three different places:<br><br>&bull; <b>Inside this vault</b>, in the <b>2FA</b> tab — copy the number shown next to the account. It changes every 30 seconds, which is normal.<br>&bull; In a <b>phone app</b>, such as Google Authenticator or Microsoft Authenticator.<br>&bull; By <b>SMS</b>, sent to my mobile number.<br><br>If an account asks for a code and it is not in the vault, look in those apps on my phone.<br><br><b>Do not cancel my phone number or SIM card until everything is sorted out</b> — without it you lose access to every account that sends codes by SMS.',
    s6:'6. Suggested order',
    o1:'<b>Banks, insurance and anything financial</b> — the most time-sensitive.',
    o2:'<b>Documents</b> — ID, licences, contracts, all in the Documents tab.',
    o3:'<b>Subscriptions</b> — cancel what keeps charging every month.',
    o4:'<b>Email accounts</b> — these unlock password resets everywhere else.',
    o5:'<b>Social accounts</b> — close or memorialise them last, there is no rush.',
    s7:'7. Master password',
    pwOn:'Write it here by hand:',
    pwOff:'It is <b>not written on this sheet</b>, on purpose. It is kept separately — I told you where, or it is with the person I named. Without it nothing here can be opened.',
    s8:'A message from me',
    s9:'Copies of this sheet',
    p9:'Who has a copy, and where the vault backups are:',
    t2T:'The 2FA tab has its own lock',
    t2P:'The 6-digit codes kept in the vault are in a separate, locked <b>2FA</b> tab. On any new phone or computer it opens only with the <b>2FA recovery code</b> — it is <b>not</b> the master password. Open the vault, go to the 2FA tab and choose <b>“Recovery code”</b>.',
    t2On:'Write the 2FA recovery code here by hand:',
    t2Off:'The 2FA recovery code is <b>not written on this sheet</b> — it is kept together with the master password.',
    recT:'Recovery codes (two-step verification)',
    recP:'If a 6-digit code cannot be obtained, each account below accepts one of these codes instead. Each code usually works only once.',
    drv:'There is always an up-to-date copy on <b>Google Drive</b>, file <b>ciphervault.vault</b>',
    drvAcc:' in the account ',
    warn:'⚠️ Without the master password there is no recovery. Nobody — not even the people who built the app — can open this file. Keep the sheet somewhere safe and dry.',
    gen:'Generated on',
    stale:'If the master password was changed after this date, this sheet is out of date — ask for a new one.',
    print:'Print'
  }:{
    title:'HERANÇA DIGITAL',
    sub:'Como chegar a tudo o que está guardado no cofre digital',
    of:'Cofre de',
    intro:'Se estás a ler isto, precisas de entrar no meu cofre digital. Está tudo explicado aqui em baixo, passo a passo. Vai com calma — nada disto tem pressa.',
    s1:'1. O que é isto',
    p1:'Todas as minhas contas, palavras-passe, documentos, cartões bancários e códigos de verificação estão dentro de um único ficheiro encriptado chamado <b>ciphervault.vault</b>. O ficheiro está protegido com encriptação AES-256-GCM: sem a palavra-passe mestra é ilegível, e nenhuma empresa ou servidor tem cópia. Só existe onde eu o guardei.',
    s2:'2. O que vais encontrar lá dentro',
    s3:'3. Onde está o ficheiro',
    p3:'Todos os sítios onde existe uma cópia — pen, disco externo, pasta na nuvem:',
    s4:'4. Como abrir',
    p4:'Em qualquer computador ou telemóvel com browser:',
    st1:'Abrir este endereço (ou apontar a câmara do telemóvel ao código):',
    st2:'Clicar em <b>“Abrir Cofre”</b>.',
    st3:'Escolher o ficheiro <b>.vault</b>.',
    st4:'Escrever a palavra-passe mestra e confirmar.',
    note:'Não é preciso internet depois de a página abrir uma vez, e nada é enviado para lado nenhum.',
    s5:'5. IMPORTANTE — códigos de 6 dígitos (verificação em dois passos)',
    p5:'Muitas contas pedem um <b>código de 6 dígitos</b> depois da palavra-passe. Esses códigos podem estar em três sítios diferentes:<br><br>&bull; <b>Dentro deste cofre</b>, no separador <b>2FA</b> — copia o número que aparece ao lado da conta. Muda a cada 30 segundos, o que é normal.<br>&bull; Numa <b>app do telemóvel</b>, como o Google Authenticator ou o Microsoft Authenticator.<br>&bull; Por <b>SMS</b>, enviado para o meu número de telemóvel.<br><br>Se uma conta pedir código e ele não estiver no cofre, procura nessas apps do meu telemóvel.<br><br><b>Não canceles o meu número de telemóvel nem o cartão SIM antes de teres tudo resolvido</b> — sem ele perdes o acesso a todas as contas que enviam código por SMS.',
    s6:'6. Ordem sugerida',
    o1:'<b>Bancos, seguros e tudo o que envolve dinheiro</b> — o mais urgente.',
    o2:'<b>Documentos</b> — cartão de cidadão, cartas, contratos, no separador Documentos.',
    o3:'<b>Subscrições</b> — cancelar o que continua a cobrar todos os meses.',
    o4:'<b>Contas de email</b> — são elas que permitem recuperar tudo o resto.',
    o5:'<b>Redes sociais</b> — encerrar ou memorizar no fim, sem pressa nenhuma.',
    s7:'7. Palavra-passe mestra',
    pwOn:'Escreve aqui à mão:',
    pwOff:'<b>Não está escrita nesta folha</b>, de propósito. Está guardada à parte — eu disse-te onde, ou está com a pessoa que indiquei. Sem ela, nada disto se abre.',
    s8:'Uma mensagem minha',
    s9:'Cópias desta folha',
    p9:'Quem tem cópia, e onde estão as cópias de segurança do cofre:',
    t2T:'O separador 2FA tem um fecho próprio',
    t2P:'Os códigos de 6 dígitos guardados no cofre estão num separador <b>2FA</b> trancado à parte. Num telemóvel ou computador novo, só abre com o <b>código de recuperação 2FA</b> — <b>não</b> é a palavra-passe mestra. Abre o cofre, vai ao separador 2FA e escolhe <b>«Código de recuperação»</b>.',
    t2On:'Escreve aqui à mão o código de recuperação 2FA:',
    t2Off:'O código de recuperação 2FA <b>não está escrito nesta folha</b> — está guardado junto da palavra-passe mestra.',
    recT:'Códigos de recuperação (verificação em dois passos)',
    recP:'Se não for possível obter o código de 6 dígitos, cada conta abaixo aceita em vez disso um destes códigos. Normalmente cada código só serve uma vez.',
    drv:'Há sempre uma cópia atualizada no <b>Google Drive</b>, ficheiro <b>ciphervault.vault</b>',
    drvAcc:' na conta ',
    warn:'⚠️ Sem a palavra-passe mestra não há recuperação possível. Ninguém — nem quem criou a app — consegue abrir este ficheiro. Guarda a folha em sítio seguro e seco.',
    gen:'Gerada a',
    stale:'Se a palavra-passe mestra foi alterada depois desta data, esta folha está desatualizada — pede uma nova.',
    print:'Imprimir'
  };
  const invHtml=inv.length
    ? `<ul class="inv">${inv.map(([n,lbl])=>`<li><b>${n}</b> ${lbl}</li>`).join('')}</ul>`
    : '';
  const html=`<!DOCTYPE html><html lang="${den?'en':'pt'}"><head><meta charset="UTF-8"><title>${L.title} — Aurora Vault</title>
<style>
 @page{size:A4;margin:15mm}
 *{box-sizing:border-box}
 body{font-family:Georgia,'Times New Roman',serif;color:#111;background:#fff;margin:0;padding:24px;line-height:1.55;font-size:12pt}
 .wrap{max-width:760px;margin:0 auto}
 .hd{border-bottom:3px solid #111;padding-bottom:11px;margin-bottom:16px}
 h1{margin:0;font-size:22pt;letter-spacing:1px}
 .sub{font-size:10.5pt;color:#555;margin-top:4px}
 .owner{font-size:11pt;color:#333;margin-top:6px}
 .intro{background:#f3f3f0;border-left:4px solid #111;padding:11px 14px;font-size:11pt;margin-bottom:18px;font-style:italic}
 h2{font-size:12.5pt;margin:18px 0 6px;border-bottom:1px solid #bbb;padding-bottom:3px;page-break-after:avoid}
 p{margin:6px 0}
 ol,ul{margin:6px 0 6px 20px;padding:0}
 li{margin:4px 0}
 ul.inv{list-style:none;margin-left:0;display:flex;flex-wrap:wrap;gap:6px 10px}
 ul.inv li{border:1px solid #ccc;border-radius:14px;padding:4px 12px;font-size:10.5pt;background:#fafaf8}
 .qrbox{display:flex;gap:16px;align-items:center;border:1px solid #ddd;padding:12px;border-radius:6px;background:#fafaf8;margin-top:7px}
 .qrbox img{width:112px;height:112px;display:block}
 .url{font-family:'Courier New',monospace;font-size:11pt;font-weight:bold;word-break:break-all}
 .note{font-size:10pt;color:#555;font-style:italic;margin-top:6px}
 .alert{background:#fffaf0;border:2px solid #b8860b;padding:11px 14px;margin-top:8px;font-size:11pt}
 .wl{border-bottom:1px solid #999;height:25px;margin:8px 0}
 .pwbox{border:2px dashed #111;padding:15px;margin-top:8px;min-height:56px}
 .pwnote{border:1px solid #bbb;padding:11px 14px;margin-top:8px;background:#fafaf8;font-size:11pt}
 .msg{border:1px solid #bbb;border-left:4px solid #666;padding:12px 15px;margin-top:8px;white-space:pre-wrap;font-size:11.5pt;background:#fdfdfb}
 .rec{width:100%;border-collapse:collapse;margin-top:8px;font-size:10.5pt}
 .rec td{border:1px solid #bbb;padding:8px 10px;vertical-align:top}
 .rec .acc{color:#555;font-size:9.5pt}
 .rec .codes{font-family:'Courier New',monospace;white-space:pre-wrap;word-break:break-all;width:60%}
 .warn{background:#fff4f4;border:2px solid #c00;padding:11px 14px;margin-top:18px;font-size:10.5pt;font-weight:bold;color:#900}
 .ft{margin-top:20px;border-top:1px solid #bbb;padding-top:8px;font-size:9.5pt;color:#666}
 .pbtn{position:fixed;top:14px;right:14px;padding:11px 20px;font-family:system-ui,sans-serif;font-size:13px;background:#111;color:#fff;border:0;border-radius:5px;cursor:pointer}
 @media print{.pbtn{display:none}body{padding:0}}
</style></head><body>
<button class="pbtn">🖨️ ${L.print}</button>
<div class="wrap">
  <div class="hd">
    <h1>📜 ${L.title}</h1>
    <div class="sub">${L.sub}</div>
    ${owner?`<div class="owner">${L.of} <b>${esc(owner)}</b></div>`:''}
  </div>
  <div class="intro">${L.intro}</div>

  <h2>${L.s1}</h2><p>${L.p1}</p>

  ${invHtml?`<h2>${L.s2}</h2>${invHtml}`:''}

  <h2>${L.s3}</h2>${drv?`<p class="note">☁️ ${L.drv}${drv.hint?L.drvAcc+'<b>'+esc(drv.hint)+'</b>':''}.</p>`:''}<p>${L.p3}</p>${line(3)}

  <h2>${L.s4}</h2><p>${L.p4}</p>
  <ol>
    <li>${L.st1}
      <div class="qrbox">
        ${qr?`<img src="${qr}" alt="QR">`:''}
        <span class="url">${esc(url)}</span>
      </div>
    </li>
    <li>${L.st2}</li><li>${L.st3}</li><li>${L.st4}</li>
  </ol>
  <p class="note">${L.note}</p>

  <h2>${L.s5}</h2><div class="alert">${L.p5}</div>
  ${t2prot?`<h2>${L.t2T}</h2><p>${L.t2P}</p>${withPwBox?`<p>${L.t2On}</p><div class="pwbox"></div>`:`<div class="pwnote">${L.t2Off}</div>`}`:''}
  ${recs.length?`<h2>${L.recT}</h2><p>${L.recP}</p><table class="rec">${recs.map(r=>`<tr><td><b>${esc(r.name)}</b>${r.acc?`<br><span class="acc">${esc(r.acc)}</span>`:''}</td><td class="codes">${esc(r.codes)}</td></tr>`).join('')}</table>`:''}

  <h2>${L.s6}</h2>
  <ol><li>${L.o1}</li><li>${L.o2}</li><li>${L.o3}</li><li>${L.o4}</li><li>${L.o5}</li></ol>

  <h2>${L.s7}</h2>
  ${withPwBox?`<p>${L.pwOn}</p><div class="pwbox"></div>`:`<div class="pwnote">${L.pwOff}</div>`}

  ${msg?`<h2>${L.s8}</h2><div class="msg">${esc(msg)}</div>`:''}

  <h2>${L.s9}</h2><p>${L.p9}</p>${line(3)}

  <div class="warn">${L.warn}</div>
  <div class="ft">${L.gen} ${now} · ${L.stale}</div>
</div></body></html>`;
  const w=window.open('','_blank');
  if(!w){toast(en?'Allow pop-ups to open the sheet.':'Permite pop-ups para abrir a folha.');return;}
  w.document.write(html);w.document.close();{const pb=w.document.querySelector('.pbtn');if(pb)pb.addEventListener('click',()=>w.print());}
  closeLegacyModal();
  toast(en?'Sheet ready — print it 🖨️':'Folha pronta — imprime 🖨️');
}

// ══ ARRASTAR FICHEIROS PARA A JANELA ══
let dragDepth=0;
function dropAllowed(){
  return !!masterKey&&!presentationMode&&!document.querySelector('.modal-overlay.open');
}
function showDropOverlay(){
  const o=document.getElementById('drop-overlay');if(!o)return;
  const en=currentLang==='en';
  document.getElementById('drop-title').textContent=en?'Drop to add document':'Larga para adicionar documento';
  document.getElementById('drop-sub').textContent=(en?'Into: ':'Em: ')+folderPathLabel(currentFolderId,docFolders);
  o.classList.add('show');
}
function hideDropOverlay(){dragDepth=0;const o=document.getElementById('drop-overlay');if(o)o.classList.remove('show');}
window.addEventListener('dragenter',e=>{
  if(!dropAllowed()||!e.dataTransfer||![...e.dataTransfer.types].includes('Files'))return;
  e.preventDefault();dragDepth++;showDropOverlay();
});
window.addEventListener('dragover',e=>{
  if(!dropAllowed()||!e.dataTransfer||![...e.dataTransfer.types].includes('Files'))return;
  e.preventDefault();e.dataTransfer.dropEffect='copy';
});
window.addEventListener('dragleave',e=>{
  if(!document.getElementById('drop-overlay')?.classList.contains('show'))return;
  dragDepth--;if(dragDepth<=0)hideDropOverlay();
});
window.addEventListener('drop',e=>{
  const o=document.getElementById('drop-overlay');
  if(!o||!o.classList.contains('show'))return;
  e.preventDefault();hideDropOverlay();
  const file=e.dataTransfer?.files?.[0];if(!file)return;
  const en=currentLang==='en';
  if(file.size>12*1024*1024){toast(en?'File too large (max ~12 MB).':'Ficheiro demasiado grande (máx. ~12 MB).');return;}
  switchTab('docs');
  openDocModal();
  const base=file.name.replace(/\.[^.]+$/,'');
  const ti=document.getElementById('doc-title-input');if(ti)ti.value=base;
  readDocFile(file);
  if(e.dataTransfer.files.length>1)toast(en?'Only the first file was added.':'Só o primeiro ficheiro foi adicionado.');
});

// ══ PASTAS DO COFRE ══
function openVaultFolder(id){currentVaultFolderId=id;renderCards();}
function goToVaultFolder(id){currentVaultFolderId=id;currentCat='all';currentTag='';
  const ct=document.getElementById('content-title');if(ct)ct.textContent=t('allEntries');
  renderSidebar();renderCards();}
function renderVaultBreadcrumb(filterActive){
  const bc=document.getElementById('vault-breadcrumb');if(!bc)return;
  const en=currentLang==='en';
  const nf=document.getElementById('vault-newfolder-txt');if(nf)nf.textContent=en?'New folder':'Nova pasta';
  if(filterActive){
    bc.innerHTML=`<span style="font-size:.66rem;color:var(--text-muted)">🔎 ${en?'Showing matches from all folders':'A mostrar resultados de todas as pastas'}</span>`;
    return;
  }
  const path=folderPath(currentVaultFolderId,vaultFolders);
  let html=`<button class="crumb${currentVaultFolderId?'':' current'}" ${currentVaultFolderId?'data-act="goToVaultFolder" data-null':''}>🏠 ${en?'Vault':'Cofre'}</button>`;
  path.forEach((f,i)=>{
    const isLast=i===path.length-1;
    html+=`<span class="crumb-sep">/</span><button class="crumb${isLast?' current':''}" ${isLast?'':`data-act="goToVaultFolder" data-arg="${esc(f.id)}"`}>${f.icon||'📁'} ${esc(f.name)}</button>`;
  });
  if(currentVaultFolderId){
    html+=`<span style="margin-left:auto;display:flex;gap:5px">
      <button class="card-btn" data-act="openFolderModal" data-arg="${esc(currentVaultFolderId)}" data-arg2="vault" title="${en?'Rename':'Renomear'}">✏️</button>
      <button class="card-btn danger" data-act="deleteFolder" data-arg="${esc(currentVaultFolderId)}" data-arg2="vault" title="${en?'Delete folder':'Apagar pasta'}">🗑️</button>
    </span>`;
  }
  bc.innerHTML=html;
}
function populateEntryFolderSelect(selectedId){
  const sel=document.getElementById('entry-folder');if(!sel)return;
  const en=currentLang==='en';
  const opts=[`<option value="">${en?'🏠 Vault (root)':'🏠 Cofre (raiz)'}</option>`];
  const walk=(parentId,depth)=>{
    vaultFolders.filter(f=>(f.parentId||null)===parentId).forEach(f=>{
      opts.push(`<option value="${f.id}">${'　'.repeat(depth)}${f.icon||'📁'} ${esc(f.name)}</option>`);
      walk(f.id,depth+1);
    });
  };
  walk(null,1);
  sel.innerHTML=opts.join('');
  sel.value=selectedId||'';
}

// ══ ÍCONES AUTOMÁTICOS DE DOCUMENTOS ══
const DOC_AUTO_ICONS=[
  [/cart[aã]o\s+de\s+cidad|citizen\s+card|\bcc\b/i,'🪪'],
  [/carta\s+de\s+condu|driving\s+licen|licen[cç]a\s+de\s+condu/i,'🚗'],
  [/passaporte|passport/i,'🛂'],
  [/curr[ií]cul|\bcv\b|resume/i,'📋'],
  [/certificad|certid[aã]o|diploma|curso/i,'📜'],
  [/contrato|contract/i,'📝'],
  [/fatura|recibo|invoice|receipt/i,'🧾'],
  [/seguro|insurance|ap[oó]lice/i,'🛡️'],
  [/\biban\b|\bbanco\b|\bbank\b|extrato/i,'🏦'],
  [/vacin|boletim.*sa[uú]de|sns|utente/i,'💉'],
  [/\bnif\b|contribuinte|finan[cç]as|\birs\b|\btax\b/i,'💶'],
  [/escritura|caderneta|im[oó]vel|predial|arrendamento/i,'🏠'],
  [/ve[ií]culo|matr[ií]cula|\bdua\b|inspe[cç][aã]o/i,'🚙'],
];
function getDocAutoIcon(doc){
  const title=doc.title||'';
  for(const [re,ic] of DOC_AUTO_ICONS){if(re.test(title))return ic;}
  return doc.file?getFileIcon(doc.file.name):'📎';
}

// ══ GERADOR QR (ISO 18004, byte mode, EC L, v1-10 — validado bit-a-bit) ══
const CVQR=(function(){
  const EXP=new Array(256),LOG=new Array(256);
  for(let i=0;i<8;i++)EXP[i]=1<<i;
  for(let i=8;i<256;i++)EXP[i]=EXP[i-4]^EXP[i-5]^EXP[i-6]^EXP[i-8];
  for(let i=0;i<255;i++)LOG[EXP[i]]=i;
  const glog=n=>LOG[n];
  const gexp=n=>{while(n<0)n+=255;while(n>=255)n-=255;return EXP[n];};
  function Poly(num,shift){
    let o=0;while(o<num.length&&num[o]===0)o++;
    this.num=new Array(num.length-o+shift).fill(0);
    for(let i=0;i<num.length-o;i++)this.num[i]=num[i+o];
  }
  Poly.prototype.mul=function(e){
    const num=new Array(this.num.length+e.num.length-1).fill(0);
    for(let i=0;i<this.num.length;i++)for(let j=0;j<e.num.length;j++)
      if(this.num[i]!==0&&e.num[j]!==0)num[i+j]^=gexp(glog(this.num[i])+glog(e.num[j]));
    return new Poly(num,0);
  };
  Poly.prototype.mod=function(e){
    if(this.num.length-e.num.length<0)return this;
    const ratio=glog(this.num[0])-glog(e.num[0]);
    const num=this.num.slice();
    for(let i=0;i<e.num.length;i++)if(e.num[i]!==0)num[i]^=gexp(glog(e.num[i])+ratio);
    return new Poly(num,0).mod(e);
  };
  function ecPoly(n){let a=new Poly([1],0);for(let i=0;i<n;i++)a=a.mul(new Poly([1,gexp(i)],0));return a;}
  const RS={1:[1,26,19],2:[1,44,34],3:[1,70,55],4:[1,100,80],5:[1,134,108],6:[2,86,68],7:[2,98,78],8:[2,121,97],9:[2,146,116],10:[2,86,68,2,87,69],11:[4,101,81],12:[2,116,92,2,117,93],13:[4,133,107],14:[3,145,115,1,146,116],15:[5,109,87,1,110,88],16:[5,122,98,1,123,99],17:[1,135,107,5,136,108],18:[5,150,120,1,151,121],19:[3,141,113,4,142,114],20:[3,135,107,5,136,108],21:[4,144,116,4,145,117],22:[2,139,111,7,140,112],23:[4,151,121,5,152,122],24:[6,147,117,4,148,118],25:[8,132,106,4,133,107]};
  const APOS={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50],11:[6,30,54],12:[6,32,58],13:[6,34,62],14:[6,26,46,66],15:[6,26,48,70],16:[6,26,50,74],17:[6,30,54,78],18:[6,30,56,82],19:[6,30,58,86],20:[6,34,62,90],21:[6,28,50,72,94],22:[6,26,50,74,98],23:[6,30,54,78,102],24:[6,28,54,80,106],25:[6,32,58,84,110]};
  const G15b=0b10100110111,G18b=0b1111100100101,G15M=0b101010000010010;
  const bchDigit=d=>{let n=0;while(d!==0){n++;d>>>=1;}return n;};
  function bchInfo(data){let d=data<<10;while(bchDigit(d)-bchDigit(G15b)>=0)d^=G15b<<(bchDigit(d)-bchDigit(G15b));return((data<<10)|d)^G15M;}
  function bchVer(data){let d=data<<12;while(bchDigit(d)-bchDigit(G18b)>=0)d^=G18b<<(bchDigit(d)-bchDigit(G18b));return(data<<12)|d;}
  const maskFn=(p,i,j)=>{switch(p){case 0:return(i+j)%2===0;case 1:return i%2===0;case 2:return j%3===0;case 3:return(i+j)%3===0;case 4:return(Math.floor(i/2)+Math.floor(j/3))%2===0;case 5:return(i*j)%2+(i*j)%3===0;case 6:return((i*j)%2+(i*j)%3)%2===0;default:return((i*j)%3+(i+j)%2)%2===0;}};
  function utf8(text){
    const b=[];
    for(let i=0;i<text.length;i++){
      let ch=text.charCodeAt(i);
      if(ch<0x80)b.push(ch);
      else if(ch<0x800){b.push(0xC0|(ch>>6),0x80|(ch&0x3F));}
      else if(ch>=0xD800&&ch<0xDC00){const c2=text.charCodeAt(++i);const u=0x10000+((ch-0xD800)<<10)+(c2-0xDC00);b.push(0xF0|(u>>18),0x80|((u>>12)&0x3F),0x80|((u>>6)&0x3F),0x80|(u&0x3F));}
      else{b.push(0xE0|(ch>>12),0x80|((ch>>6)&0x3F),0x80|(ch&0x3F));}
    }
    return b;
  }
  function matrix(text){
    const bytes=utf8(text);
    let version=0,blocks=null;
    for(let v=1;v<=25;v++){
      const raw=RS[v],bl=[];
      for(let i=0;i<raw.length;i+=3)for(let j=0;j<raw[i];j++)bl.push({total:raw[i+1],data:raw[i+2]});
      const totalData=bl.reduce((s,b)=>s+b.data,0);
      const lb=v<10?8:16;
      if(Math.ceil((4+lb+bytes.length*8)/8)<=totalData){version=v;blocks=bl;break;}
    }
    if(!version)return null;
    const totalDataCount=blocks.reduce((s,b)=>s+b.data,0);
    const buf=[];let bufLen=0;
    const put=(num,len)=>{for(let i=len-1;i>=0;i--){const bi=bufLen>>3;if(buf.length<=bi)buf.push(0);if((num>>>i)&1)buf[bi]|=0x80>>>(bufLen&7);bufLen++;}};
    put(4,4);put(bytes.length,version<10?8:16);
    for(const b of bytes)put(b,8);
    if(bufLen+4<=totalDataCount*8)put(0,4);
    while(bufLen%8!==0)put(0,1);
    let pad=true;
    while(bufLen<totalDataCount*8){put(pad?0xEC:0x11,8);pad=!pad;}
    const dcd=[],ecd=[];let off=0,maxDc=0,maxEc=0;
    for(const b of blocks){
      const ec=b.total-b.data;maxDc=Math.max(maxDc,b.data);maxEc=Math.max(maxEc,ec);
      const dc=buf.slice(off,off+b.data);off+=b.data;dcd.push(dc);
      const rs=ecPoly(ec);
      const mp=new Poly(dc,rs.num.length-1).mod(rs);
      const e=new Array(ec);
      for(let i=0;i<ec;i++){const mi=i+mp.num.length-ec;e[i]=mi>=0?mp.num[mi]:0;}
      ecd.push(e);
    }
    const data=[];
    for(let i=0;i<maxDc;i++)for(let b=0;b<blocks.length;b++)if(i<dcd[b].length)data.push(dcd[b][i]);
    for(let i=0;i<maxEc;i++)for(let b=0;b<blocks.length;b++)if(i<ecd[b].length)data.push(ecd[b][i]);
    const N=version*4+17;
    function build(mask){
      const m=Array.from({length:N},()=>new Array(N).fill(null));
      const finder=(row,col)=>{
        for(let r=-1;r<=7;r++){if(row+r<0||row+r>=N)continue;
          for(let cc=-1;cc<=7;cc++){if(col+cc<0||col+cc>=N)continue;
            m[row+r][col+cc]=(r>=0&&r<=6&&(cc===0||cc===6))||(cc>=0&&cc<=6&&(r===0||r===6))||(r>=2&&r<=4&&cc>=2&&cc<=4);
          }}
      };
      finder(0,0);finder(N-7,0);finder(0,N-7);
      const pos=APOS[version];
      for(const row of pos)for(const col of pos){
        if(m[row][col]!==null)continue;
        for(let r=-2;r<=2;r++)for(let cc=-2;cc<=2;cc++)m[row+r][col+cc]=(r===-2||r===2||cc===-2||cc===2||(r===0&&cc===0));
      }
      for(let i=8;i<N-8;i++){if(m[i][6]===null)m[i][6]=(i%2===0);if(m[6][i]===null)m[6][i]=(i%2===0);}
      const bits=bchInfo((1<<3)|mask);
      for(let i=0;i<15;i++){
        const mod=((bits>>i)&1)===1;
        if(i<6)m[i][8]=mod;else if(i<8)m[i+1][8]=mod;else m[N-15+i][8]=mod;
        if(i<8)m[8][N-i-1]=mod;else if(i<9)m[8][15-i-1+1]=mod;else m[8][15-i-1]=mod;
      }
      m[N-8][8]=true;
      if(version>=7){
        const vb=bchVer(version);
        for(let i=0;i<18;i++){
          const mod=((vb>>i)&1)===1;
          m[Math.floor(i/3)][i%3+N-8-3]=mod;
          m[i%3+N-8-3][Math.floor(i/3)]=mod;
        }
      }
      let inc=-1,row=N-1,bitIndex=7,byteIndex=0;
      for(let col=N-1;col>0;col-=2){
        if(col===6)col--;
        while(true){
          for(let cc=0;cc<2;cc++){
            if(m[row][col-cc]===null){
              let dark=false;
              if(byteIndex<data.length)dark=((data[byteIndex]>>>bitIndex)&1)===1;
              if(maskFn(mask,row,col-cc))dark=!dark;
              m[row][col-cc]=dark;
              bitIndex--;if(bitIndex===-1){byteIndex++;bitIndex=7;}
            }
          }
          row+=inc;
          if(row<0||N<=row){row-=inc;inc=-inc;break;}
        }
      }
      return m;
    }
    function penalty(m){
      let score=0;
      for(let dir=0;dir<2;dir++)for(let i=0;i<N;i++){
        let run=1;
        for(let j=1;j<N;j++){
          const cur=dir===0?m[i][j]:m[j][i],prev=dir===0?m[i][j-1]:m[j-1][i];
          if(cur===prev)run++;else{if(run>=5)score+=3+(run-5);run=1;}
        }
        if(run>=5)score+=3+(run-5);
      }
      for(let i=0;i<N-1;i++)for(let j=0;j<N-1;j++){
        const v=m[i][j];
        if(m[i][j+1]===v&&m[i+1][j]===v&&m[i+1][j+1]===v)score+=3;
      }
      const p1=[true,false,true,true,true,false,true,false,false,false,false];
      const p2=[false,false,false,false,true,false,true,true,true,false,true];
      for(let dir=0;dir<2;dir++)for(let i=0;i<N;i++)for(let j=0;j<=N-11;j++){
        let ok1=true,ok2=true;
        for(let k=0;k<11;k++){
          const v=dir===0?m[i][j+k]:m[j+k][i];
          if(v!==p1[k])ok1=false;
          if(v!==p2[k])ok2=false;
        }
        if(ok1)score+=40;if(ok2)score+=40;
      }
      let dark=0;
      for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(m[i][j])dark++;
      score+=Math.floor(Math.abs(dark*100/(N*N)-50)/5)*10;
      return score;
    }
    let best=null,bestScore=Infinity;
    for(let p=0;p<8;p++){
      const m=build(p);const s=penalty(m);
      if(s<bestScore){bestScore=s;best=m;}
    }
    return best;
  }
  return {matrix};
})();

// ══ REDES WIFI (guardadas à parte das passwords) ══
function renderWifiBar(){
  const wrap=document.getElementById('tabs-wifi');if(!wrap)return;
  const en=currentLang==='en';
  const chips=wifiNets.slice(0,4).map(n=>`<button class="wifi-chip" data-act="openWifiNetQR" data-arg="${esc(n.id)}" title="${(en?'Share WiFi: ':'Partilhar WiFi: ')+esc(n.ssid)}">📶 ${esc(n.name||n.ssid)}</button>`).join('');
  const manageLbl=wifiNets.length?(en?'Manage':'Gerir'):(en?'Add WiFi':'Add WiFi');
  wrap.innerHTML=chips+`<button class="wifi-chip add" data-act="openWifiManager" title="${en?'Manage WiFi networks':'Gerir redes WiFi'}">${wifiNets.length?'⚙️':'📶＋'} <span>${manageLbl}</span></button>`;
}
function openWifiManager(){
  const en=currentLang==='en';
  document.getElementById('wifimgr-title').textContent=en?'📶 WiFi Networks':'📶 Redes WiFi';
  document.getElementById('wifimgr-intro').textContent=en
    ?'Stored separately from your passwords. Tap a network to generate the QR your guests scan with their camera.'
    :'Guardadas à parte das tuas passwords. Clica numa rede para gerar o QR que as visitas leem com a câmara.';
  document.getElementById('wf-name-lbl').innerHTML=(en?'Label':'Nome')+' <span style="font-size:.56rem;color:var(--text-muted)">('+(en?'e.g. Home, Office':'ex: Casa, Escritório')+')</span>';
  document.getElementById('wf-ssid-lbl').textContent=en?'Network name (SSID)':'Nome da rede (SSID)';
  document.getElementById('wf-pw-lbl').textContent=en?'Network password':'Password da rede';
  document.getElementById('wf-open-lbl').textContent=en?'Open network (no password)':'Rede aberta (sem password)';
  document.getElementById('wifimgr-close-btn').textContent=en?'Close':'Fechar';
  resetWifiForm();
  renderWifiList();
  document.getElementById('wifimgr-overlay').classList.add('open');
}
function closeWifiManager(){document.getElementById('wifimgr-overlay').classList.remove('open');editingWifiId=null;}
function renderWifiList(){
  const list=document.getElementById('wifimgr-list');if(!list)return;
  const en=currentLang==='en';
  if(!wifiNets.length){
    list.innerHTML=`<div style="font-size:.7rem;color:var(--text-muted);text-align:center;padding:10px 0">${en?'No networks saved yet.':'Ainda sem redes guardadas.'}</div>`;
    return;
  }
  list.innerHTML=wifiNets.map(n=>`<div class="wifi-row">
    <span style="font-size:1.1rem">📶</span>
    <div class="wifi-row-name">
      <div class="wifi-row-title">${esc(n.name||n.ssid)}</div>
      <div class="wifi-row-ssid">${esc(n.ssid)}${n.sec==='nopass'?' · '+(en?'open':'aberta'):''}</div>
    </div>
    <button class="card-btn" data-act="openWifiNetQR" data-arg="${esc(n.id)}" title="QR">📷</button>
    <button class="card-btn" data-act="editWifiNet" data-arg="${esc(n.id)}" title="${en?'Edit':'Editar'}">✏️</button>
    <button class="card-btn danger" data-act="deleteWifiNet" data-arg="${esc(n.id)}" title="${en?'Delete':'Apagar'}">🗑️</button>
  </div>`).join('');
}
function resetWifiForm(){
  editingWifiId=null;
  const en=currentLang==='en';
  ['wf-name','wf-ssid','wf-pw'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  const op=document.getElementById('wf-open');if(op)op.checked=false;
  const pw=document.getElementById('wf-pw');if(pw)pw.disabled=false;
  const ft=document.getElementById('wifimgr-form-title');if(ft)ft.textContent=en?'Add network':'Adicionar rede';
  const sb=document.getElementById('wf-save-btn');if(sb)sb.textContent=en?'Save network':'Guardar rede';
}
function editWifiNet(id){
  const n=wifiNets.find(x=>x.id===id);if(!n)return;
  editingWifiId=id;
  const en=currentLang==='en';
  document.getElementById('wf-name').value=n.name||'';
  document.getElementById('wf-ssid').value=n.ssid||'';
  document.getElementById('wf-pw').value=n.pw||'';
  const op=document.getElementById('wf-open');
  op.checked=n.sec==='nopass';
  document.getElementById('wf-pw').disabled=op.checked;
  document.getElementById('wifimgr-form-title').textContent=en?'Edit network':'Editar rede';
  document.getElementById('wf-save-btn').textContent=en?'Save changes':'Guardar alterações';
  document.getElementById('wf-ssid').focus();
}
function saveWifiNet(){
  const en=currentLang==='en';
  const name=document.getElementById('wf-name').value.trim();
  const ssid=document.getElementById('wf-ssid').value.trim();
  const isOpen=document.getElementById('wf-open').checked;
  const pw=isOpen?'':document.getElementById('wf-pw').value;
  if(!ssid){toast(en?'Network name (SSID) is required!':'Nome da rede (SSID) obrigatório!');return;}
  if(!isOpen&&!pw){toast(en?'Enter the password or tick "open network".':'Escreve a password ou marca "rede aberta".');return;}
  if(editingWifiId){
    const n=wifiNets.find(x=>x.id===editingWifiId);
    if(n){n.name=name;n.ssid=ssid;n.pw=pw;n.sec=isOpen?'nopass':'WPA';}
    logActivity('edit',name||ssid,'📶');
  }else{
    wifiNets.push({id:'w'+Date.now().toString(36),name,ssid,pw,sec:isOpen?'nopass':'WPA'});
    logActivity('add',name||ssid,'📶');
  }
  resetWifiForm();renderWifiList();renderWifiBar();
  toast(en?'Network saved ✓':'Rede guardada ✓');
  markUnsaved();
}
function deleteWifiNet(id){
  const n=wifiNets.find(x=>x.id===id);if(!n)return;
  const en=currentLang==='en';
  if(!confirm(en?`Delete "${n.name||n.ssid}"?`:`Apagar "${n.name||n.ssid}"?`))return;
  wifiNets=wifiNets.filter(x=>x.id!==id);
  logActivity('delete',n.name||n.ssid,'📶');
  if(editingWifiId===id)resetWifiForm();
  renderWifiList();renderWifiBar();
  toast(en?'Network deleted.':'Rede apagada.');
  markUnsaved();
}

// ══ WIFI QR ══
function escWifiField(s){return String(s).replace(/([\\;,:"])/g,'\\$1');}
function isWifiEntry(e){if(e.isWifi===true)return true;if(e.isWifi===false)return false;return /wi-?fi|wlan|router|hotspot|\bssid\b|\bmodem\b|\brede\b|\bnetwork\b/i.test(e.name||'')||/wi-?fi|rede/i.test((e.tags||[]).join(' '));}
function openWifiQR(id){
  const e=vault.find(v=>v.id===id);if(!e)return;
  showWifiQR((e.user&&e.user.trim())?e.user.trim():e.name,e.pw||'');
}
function openWifiNetQR(netId){
  const n=wifiNets.find(x=>x.id===netId);if(!n)return;
  showWifiQR(n.ssid,n.sec==='nopass'?'':(n.pw||''),n.name);
}
function showWifiQR(ssid,pass,label){
  const payload=pass
    ?`WIFI:T:WPA;S:${escWifiField(ssid)};P:${escWifiField(pass)};;`
    :`WIFI:T:nopass;S:${escWifiField(ssid)};;`;
  const m=CVQR.matrix(payload);
  if(!m){toast(currentLang==='en'?'Data too long for QR!':'Dados demasiado longos para QR!');return;}
  const canvas=document.getElementById('qr-canvas');
  const scale=6,quiet=4;
  const size=(m.length+quiet*2)*scale;
  canvas.width=size;canvas.height=size;
  canvas.style.width=Math.min(size,240)+'px';
  canvas.style.height=Math.min(size,240)+'px';
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000';
  for(let r=0;r<m.length;r++)for(let cc=0;cc<m.length;cc++)
    if(m[r][cc])ctx.fillRect((cc+quiet)*scale,(r+quiet)*scale,scale,scale);
  document.getElementById('qr-title').innerHTML=avWifiIcon(20)+'&nbsp;'+(currentLang==='en'?'WiFi QR Code':'QR Code do WiFi');
  document.getElementById('qr-ssid').textContent=`📡 ${ssid}`+(label&&label!==ssid?`  ·  ${label}`:'');
  document.getElementById('qr-hint').textContent=currentLang==='en'
    ?'Point the phone camera at the code to connect automatically'
    :'Aponta a câmara do telemóvel para ligar automaticamente';
  document.getElementById('qr-close-btn').textContent=currentLang==='en'?'Close':'Fechar';
  document.getElementById('qr-overlay').classList.add('open');
}
function closeQrModal(){const o=document.getElementById('qr-overlay');if(o)o.classList.remove('open');}

// ══ DOCUMENT VALIDITY FILTER ══
let currentDocValidityFilter='all';
function setDocValidityFilter(filter){
  currentDocValidityFilter=filter;
  document.querySelectorAll('#docs-validity-row .doc-filter-btn').forEach(b=>{
    b.classList.toggle('active',b.id===`vf-${filter}`);
  });
  renderDocs();
}

// ══ PRESENTATION MODE ══
let presentationMode=false;
let realVault=null,realNotes=null,realBankCards=null,realDocuments=null,realTrash=null,realTotp=null,realCustomCats=null,realDocFolders=null,realVaultFolders=null,realWifiNets=null;
const DEMO_DATA={
  vault:[
    {id:'d1',name:'Gmail',cat:'email',user:'exemplo@gmail.com',pw:'Demo#2026!',url:'https://gmail.com',icon:'📧',fav:true,tags:['pessoal'],createdAt:Date.now()-86400000*5,pwUpdated:Date.now()-86400000*5,archived:false,order:0},
    {id:'d2',name:'Netflix',cat:'jogo',user:'exemplo@gmail.com',pw:'Netflix$Pass1',url:'https://netflix.com',icon:'🎬',fav:false,tags:[],createdAt:Date.now()-86400000*30,pwUpdated:Date.now()-86400000*30,archived:false,order:1},
    {id:'d3',name:'Banco CGD',cat:'banco',user:'123456789',pw:'BancoPass#99',url:'https://cgd.pt',icon:'🏦',fav:true,tags:['banco'],createdAt:Date.now()-86400000*60,pwUpdated:Date.now()-86400000*60,archived:false,order:2},
    {id:'d4',name:'LinkedIn',cat:'trabalho',user:'carlos.silva@email.com',pw:'Work$2026Pass',url:'https://linkedin.com',icon:'💼',fav:false,tags:['trabalho'],createdAt:Date.now()-86400000*10,pwUpdated:Date.now()-86400000*10,archived:false,order:3},
    {id:'d5',name:'Instagram',cat:'social',user:'@carlos_silva',pw:'Insta!Pass22',url:'https://instagram.com',icon:'📸',fav:false,tags:[],createdAt:Date.now()-86400000*90,pwUpdated:Date.now()-86400000*90,archived:false,order:4},
  ],
  notes:[
    {id:'n1',title:'IBAN Pessoal',body:'PT50 0000 0000 0000 0000 0000 0\nTitular: Carlos Silva',createdAt:Date.now()-86400000*20},
    {id:'n2',title:'WiFi Casa',body:'Nome: CasaSilva_5G\nPassword: MinhaWifi2026!',createdAt:Date.now()-86400000*100},
  ],
  bankCards:[
    {id:'c1',bank:'Caixa Geral de Depósitos',holder:'CARLOS SILVA',number:'4532 1234 5678 9012',expiry:'12/28',type:'debito',pin:'1234',color:'#1b5e20',notes:'Cartão principal'},
    {id:'c2',bank:'Santander',holder:'CARLOS SILVA',number:'5412 9876 5432 1098',expiry:'06/26',type:'credito',pin:'5678',color:'#b71c1c',notes:'Limite 2000€'},
  ],
  documents:[
    {id:'doc1',title:'Cartão de Cidadão',cat:'pessoal',date:'2020-01-15',expiry:'2030-01-14',desc:'Número: 12345678 9ZZ4',file:null,createdAt:Date.now()-86400000*365},
    {id:'doc2',title:'CV 2026',cat:'trabalho',date:'2026-01-01',expiry:'',desc:'Versão atualizada Janeiro 2026',file:null,createdAt:Date.now()-86400000*60,folderId:'fd1'},
    {id:'doc3',title:'Fatura Cliente A',cat:'trabalho',date:'2026-06-15',expiry:'',desc:'Serviços de junho — pago',file:null,createdAt:Date.now()-86400000*20,folderId:'fd2'},
  ],
  vaultFolders:[
    {id:'vf1',name:'Trabalho',icon:'💼',parentId:null},
  ],
  wifiNets:[
    {id:'w1',name:'Casa',ssid:'CasaSilva_5G',pw:'ExemploDemo2026',sec:'WPA'},
  ],
  docFolders:[
    {id:'fd1',name:'Empresa',icon:'🏢',parentId:null},
    {id:'fd2',name:'Rendimentos',icon:'💶',parentId:'fd1'},
  ],
  totp:[
    {id:'t1',name:'Google',account:'exemplo@gmail.com',secret:'JBSWY3DPEHPK3PXP',createdAt:Date.now()-86400000*10},
    {id:'t2',name:'Discord',account:'carlos#1234',secret:'GEZDGNBVGY3TQOJQ',createdAt:Date.now()-86400000*5},
  ]
};
let demoFromLock=false;
function enterPresentationMode(){
  if(presentationMode)return;
  presentationMode=true;
  demoFromLock=!masterKey;
  realVault=[...vault];realNotes=[...notes];realBankCards=[...bankCards];realDocuments=[...documents];realTrash=[...trash];realTotp=[...totp];realCustomCats=[...customCats];realDocFolders=[...docFolders];realVaultFolders=[...vaultFolders];realWifiNets=[...wifiNets];
  vault=JSON.parse(JSON.stringify(DEMO_DATA.vault));notes=JSON.parse(JSON.stringify(DEMO_DATA.notes));bankCards=JSON.parse(JSON.stringify(DEMO_DATA.bankCards));documents=JSON.parse(JSON.stringify(DEMO_DATA.documents));trash=[];totp=JSON.parse(JSON.stringify(DEMO_DATA.totp));customCats=[];docFolders=JSON.parse(JSON.stringify(DEMO_DATA.docFolders||[]));currentFolderId=null;vaultFolders=JSON.parse(JSON.stringify(DEMO_DATA.vaultFolders||[]));currentVaultFolderId=null;wifiNets=JSON.parse(JSON.stringify(DEMO_DATA.wifiNets||[]));
  document.getElementById('presentation-banner').classList.add('show');
  document.getElementById('pres-label').textContent=currentLang==='en'?'DEMO MODE — sample data, nothing is saved':'MODO DEMONSTRAÇÃO — dados fictícios, nada é guardado';
  document.querySelector('.topbar').style.marginTop='44px';
  renderAll();
  switchTab('dashboard');
  if(demoFromLock){
    const lockScreen=document.getElementById('lock-screen');
    const app=document.getElementById('app');
    lockScreen.style.display='none';
    app.style.display='';
    app.classList.remove('visible');void app.offsetHeight;
    app.classList.add('visible');
    setTimeout(positionTabIndicator,120);
  }
  toast(currentLang==='en'?'Demo mode — explore freely!':'Modo demonstração — explora à vontade!');
}
function exitPresentationMode(){
  if(!presentationMode)return;
  presentationMode=false;
  vault=realVault;notes=realNotes;bankCards=realBankCards;documents=realDocuments;trash=realTrash;totp=realTotp;customCats=realCustomCats;docFolders=realDocFolders||[];currentFolderId=null;vaultFolders=realVaultFolders||[];currentVaultFolderId=null;wifiNets=realWifiNets||[];
  realVault=null;realNotes=null;realBankCards=null;realDocuments=null;realTrash=null;realTotp=null;realCustomCats=null;realDocFolders=null;realVaultFolders=null;realWifiNets=null;
  document.getElementById('presentation-banner').classList.remove('show');
  document.querySelector('.topbar').style.marginTop='';
  if(demoFromLock){
    demoFromLock=false;
    hasUnsaved=false;
    try{closeGlobalSearch();}catch(e){}
    const app=document.getElementById('app');
    app.classList.remove('visible');
    app.style.display='none';
    const lockScreen=document.getElementById('lock-screen');
    lockScreen.style.display='flex';
    lockScreen.style.opacity='1';
    backToInitial();
    return;
  }
  renderAll();switchTab('dashboard');
  toast(currentLang==='en'?'Back to your real data ✓':'De volta aos teus dados reais ✓');
}
let _toastT=0;
function toast(msg){const t2=document.getElementById('toast');t2.textContent=msg;t2.classList.add('show');clearTimeout(_toastT);_toastT=setTimeout(()=>t2.classList.remove('show'),2500);}

// ══ KEYBOARD ══
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeChangePwModal();closePwGen();closeImport();closeSettings();closeCardModal();closeReadMode();closeDocModal();closeQrModal();closeTotpModal();closeQrScanner();closeShareModal();closeShareImport();closeFolderModal();closeMoveModal();closeWifiManager();closePinSetup();closeTopMenu();closeLegacyModal();close2faSetup();close2faManager();closeSnapshotModal();closeDedupeModal();closeSelectiveExport();closeDocPreview();closeInfoModal();closeSubModal();closeSubsScreen();closeStoreModal();closeBarcode();}
  if(!masterKey)return;
  const anyOpen=document.querySelector('.modal-overlay.open');
  if(anyOpen)return;
  if(e.ctrlKey||e.metaKey){
    if(e.key==='n'){e.preventDefault();openModal();}
    if(e.key==='s'){e.preventDefault();saveFile();}
    if(e.key==='f'){e.preventDefault();const si=document.getElementById('search-input');if(si){si.focus();si.select();}}
    if(e.key==='l'){e.preventDefault();lockApp();}
  }
});

// ══ PARTICLES ══
function launchParticles(){
  const canvas=document.getElementById('particles-canvas');
  canvas.style.display='block';
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const ctx=canvas.getContext('2d');
  const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#c9a84c';
  const particles=[];
  const cx=canvas.width/2,cy=canvas.height/2;
  for(let i=0;i<80;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=(Math.random()*4+2);
    particles.push({
      x:cx,y:cy,
      vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-2,
      size:Math.random()*5+2,
      alpha:1,life:Math.random()*40+40,
      color:Math.random()>0.5?accent:'#ffffff',
      shape:Math.random()>0.5?'circle':'star'
    });
  }
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=false;
    particles.forEach(p=>{
      if(p.life<=0)return;
      alive=true;
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;
      p.life--;p.alpha=p.life/80;
      ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;
      if(p.shape==='star'){
        ctx.beginPath();
        for(let s=0;s<5;s++){
          const a=((s*72)-90)*(Math.PI/180);
          const a2=((s*72+36)-90)*(Math.PI/180);
          if(s===0)ctx.moveTo(p.x+p.size*Math.cos(a),p.y+p.size*Math.sin(a));
          else ctx.lineTo(p.x+p.size*Math.cos(a),p.y+p.size*Math.sin(a));
          ctx.lineTo(p.x+(p.size/2)*Math.cos(a2),p.y+(p.size/2)*Math.sin(a2));
        }
        ctx.closePath();ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    });
    frame++;
    if(alive&&frame<120)requestAnimationFrame(draw);
    else{ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.display='none';}
  }
  draw();
}

