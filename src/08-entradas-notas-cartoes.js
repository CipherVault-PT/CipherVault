// ══ ARCHIVE ══
function renderArchive(){
  const grid=document.getElementById('archive-grid');
  const en=currentLang==='en';
  const aVault=vault.filter(e=>e.archived);
  const aDocs=documents.filter(d=>d.archived);
  const aCards=bankCards.filter(cd=>cd.archived);
  const aNotes=notes.filter(n=>n.archived);
  const total=aVault.length+aDocs.length+aCards.length+aNotes.length;
  if(!total){grid.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg><p>${t('emptyArchive')}</p></div>`;return;}
  const restoreSvg='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>';
  const delSvg='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>';
  let html='';
  const section=(icon,label,count,cardsHtml)=>`
    <div class="archive-section">
      <div class="archive-section-head"><span>${icon} ${label}</span><span class="archive-count">${count}</span></div>
      <div class="archive-section-grid">${cardsHtml}</div>
    </div>`;
  // Contas / passwords
  if(aVault.length){
    const cards=aVault.map(e=>`
      <div class="entry-card" style="opacity:.85" id="arc-${e.id}">
        <div class="card-top"><span class="card-cat-badge" style="background:${vaultCatInfo(e.cat).color}26;color:${vaultCatInfo(e.cat).color}">${vaultCatInfo(e.cat).icon} ${esc(vaultCatInfo(e.cat).label)}</span></div>
        <div class="card-name">${esc(e.name)}</div>
        ${e.user?`<div class="card-field"><span class="card-field-label">${t('cardUser')}</span><div class="card-field-inner"><span class="card-field-value">${esc(e.user)}</span></div></div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreEntry" data-arg="${esc(e.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteEntry" data-arg="${esc(e.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('🔐',en?'Accounts / passwords':'Contas / palavras-passe',aVault.length,cards);
  }
  // Documentos
  if(aDocs.length){
    const cards=aDocs.map(d=>`
      <div class="entry-card" style="opacity:.85">
        <div class="card-name">${d.icon||'📄'} ${esc(d.title||'')}</div>
        ${d.expiry?`<div class="card-field"><span class="card-field-label">${en?'Expiry':'Validade'}</span><div class="card-field-inner"><span class="card-field-value">${esc(d.expiry)}</span></div></div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreDoc" data-arg="${esc(d.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteDoc" data-arg="${esc(d.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('📁',en?'Documents':'Documentos',aDocs.length,cards);
  }
  // Cartões
  if(aCards.length){
    const cards=aCards.map(cd=>`
      <div class="entry-card" style="opacity:.85">
        <div class="card-name">💳 ${esc(cd.name||cd.bank||'')}</div>
        ${cd.expiry?`<div class="card-field"><span class="card-field-label">${en?'Valid thru':'Validade'}</span><div class="card-field-inner"><span class="card-field-value">${esc(cd.expiry)}</span></div></div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreCard" data-arg="${esc(cd.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteCard" data-arg="${esc(cd.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('💳',en?'Bank cards':'Cartões bancários',aCards.length,cards);
  }
  // Notas
  if(aNotes.length){
    const cards=aNotes.map(n=>`
      <div class="entry-card" style="opacity:.85">
        <div class="card-name">📝 ${esc(n.title||(en?'Untitled note':'Nota sem título'))}</div>
        ${n.body?`<div style="font-size:.62rem;color:var(--text-muted);padding:6px 2px;line-height:1.5">${esc(n.body.slice(0,60))}${n.body.length>60?'…':''}</div>`:''}
        <div class="card-actions">
          <button class="card-btn" data-act="restoreNote" data-arg="${esc(n.id)}">${restoreSvg} ${t('btnRestore')}</button>
          <button class="card-btn danger" data-act="deleteNoteById" data-arg="${esc(n.id)}">${delSvg} ${t('btnDel')}</button>
        </div>
      </div>`).join('');
    html+=section('📝',en?'Notes':'Notas',aNotes.length,cards);
  }
  grid.innerHTML=html;
}
function deleteNoteById(id){
  const en=currentLang==='en';
  if(!confirm(en?'Move this note to the recycle bin?':'Mover esta nota para a reciclagem?'))return;
  const n=notes.find(x=>x.id===id);
  if(n){logActivity('delete',n.title||'Nota','🗑️');trash.unshift({type:'note',data:n,deletedAt:Date.now()});}
  notes=notes.filter(x=>x.id!==id);
  renderAll();toast(en?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}
function restoreEntry(id){const e=vault.find(v=>v.id===id);if(e){logActivity('restore',e.name,'♻️');delete e.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}
function archiveDoc(id){const d=documents.find(x=>x.id===id);if(d){logActivity('archive',d.title,'📦');d.archived=true;renderAll();toast(t('toastArchived'));markUnsaved();}}
function restoreDoc(id){const d=documents.find(x=>x.id===id);if(d){logActivity('restore',d.title,'♻️');delete d.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}
function archiveCard(id){const cd=bankCards.find(x=>x.id===id);if(cd){logActivity('archive',cd.name,'📦');cd.archived=true;renderAll();toast(t('toastArchived'));markUnsaved();}}
function restoreCard(id){const cd=bankCards.find(x=>x.id===id);if(cd){logActivity('restore',cd.name,'♻️');delete cd.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}
function archiveNote(id){const n=notes.find(x=>x.id===id);if(n){logActivity('archive',n.title||'Nota','📦');n.archived=true;if(editingNoteId===id){editingNoteId=null;hideNoteEditor();}renderAll();toast(t('toastArchived'));markUnsaved();}}
function archiveCurrentNote(){if(editingNoteId)archiveNote(editingNoteId);}
function restoreNote(id){const n=notes.find(x=>x.id===id);if(n){logActivity('restore',n.title||'Nota','♻️');delete n.archived;renderAll();toast(t('toastRestored'));markUnsaved();}}

// ══ ENTRY MODAL ══
function openModal(id=null){
  editingId=id;entryTags=[];entryAttachment=null;entryAttachments=[];entryEmoji='⭐';
  document.getElementById('modal-title').textContent=id?t('modalEdit'):t('modalNew');
  populateCatSelect();
  if(id){
    const e=vault.find(v=>v.id===id);
    document.getElementById('f-name').value=e.name||'';document.getElementById('f-cat').value=e.cat||'outro';
    document.getElementById('f-user').value=e.user||'';document.getElementById('f-pw').value=e.pw||'';
    document.getElementById('f-url').value=e.url||'';document.getElementById('f-notes').value=e.notes||'';
    entryTags=[...(e.tags||[])];entryAttachment=e.attachment||null;entryAttachments=normalizeAttachments(e);
    entryFields=(e.fields||[]).map(f=>({k:f.k||'',v:f.v||''}));
    populateEntryFolderSelect(e.folderId||'');
    const wf=document.getElementById('f-wifi');if(wf)wf.checked=isWifiEntry(e);
    entryEmoji=e.icon||'⭐';
    selectedFlag=e.flag||'';
  }else{
    ['f-name','f-user','f-pw','f-url','f-notes'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('f-cat').value='email';
    selectedFlag='';
    populateEntryFolderSelect(currentVaultFolderId||'');
    const wf2=document.getElementById('f-wifi');if(wf2)wf2.checked=false;
    entryFields=[];
  }
  document.getElementById('f-icon-preview').textContent=entryEmoji;
  document.getElementById('emoji-picker-wrap').style.display='none';
  renderTagPills();renderFieldRows();renderAttachList('entry');renderFlagPicker();
  checkPwStrength();checkDuplicate();
  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('f-name').focus(),100);
}
function editEntry(id){openModal(id);}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');editingId=null;entryTags=[];entryAttachments=[];entryAttachment=null;entryFields=[];}
function saveEntry(){
  const name=document.getElementById('f-name').value.trim();
  if(!name){alert(t('nameRequired'));return;}
  const pw=document.getElementById('f-pw').value;
  const existing=editingId?vault.find(v=>v.id===editingId):null;
  const wasEditing=!!existing;
  const pwChanged=!existing||existing.pw!==pw;
  const entry={
    ...(existing||{}),attachment:undefined,
    id:editingId||Date.now().toString(36),name,cat:document.getElementById('f-cat').value,
    user:document.getElementById('f-user').value.trim(),pw,url:document.getElementById('f-url').value.trim(),
    notes:document.getElementById('f-notes').value.trim(),tags:[...entryTags],flag:selectedFlag||'',
    fields:entryFields.map(f=>({k:f.k.trim(),v:f.v.trim()})).filter(f=>f.k||f.v),
    folderId:(document.getElementById('entry-folder')?.value||'')||null,
    isWifi:!!document.getElementById('f-wifi')?.checked,
    attachments:entryAttachments,fav:existing?existing.fav:false,archived:false,icon:entryEmoji,
    createdAt:existing?existing.createdAt:Date.now(),order:existing?existing.order:vault.length,
    pwUpdated:pwChanged?Date.now():(existing?existing.pwUpdated:Date.now()),
    pwHistory:pwChanged&&existing?([existing.pw,...(existing.pwHistory||[])].filter(Boolean).slice(0,3)):(existing?existing.pwHistory||[]:null),
    reviewedAt:existing?existing.reviewedAt||null:null,
  };
  const idx=wasEditing?vault.indexOf(existing):-1;
  if(idx>=0)vault[idx]=entry;else vault.push(entry);
  logActivity(wasEditing?'edit':'add', name, entryEmoji||'📝');
  closeModal();renderAll();toast(wasEditing?t('toastUpdated'):t('toastAdded'));markUnsaved();
}
function deleteEntry(id){
  if(!confirm(currentLang==='en'?'Move this entry to the recycle bin?':'Mover esta entrada para a reciclagem?'))return;
  const e=vault.find(v=>v.id===id);
  if(e){logActivity('delete',e.name,'🗑️');trash.unshift({type:'vault',data:e,deletedAt:Date.now()});}
  vault=vault.filter(v=>v.id!==id);renderAll();
  toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}

// ══ TAGS ══
function renderTagPills(){
  const pillsEl=document.getElementById('tag-pills');
  if(!pillsEl)return;
  pillsEl.innerHTML=entryTags.map(tag=>
    `<span class="tag-pill">${esc(tag)}<button type="button" data-act="removeTag" data-arg="${esc(tag)}">✕</button></span>`
  ).join('');
}
function handleTagKey(e){
  if(e.key==='Enter'||e.key===','){
    e.preventDefault();
    const val=e.target.value.trim().replace(/,/g,'');
    if(val&&!entryTags.includes(val)){entryTags.push(val);renderTagPills();}
    e.target.value='';
  }
}
function removeTag(tag){entryTags=entryTags.filter(t2=>t2!==tag);renderTagPills();}

// ══ ATTACHMENT ══
// ══ ANEXOS (múltiplos, imagens + PDF) ══
// Cada anexo: {id,name,type,size,data}
function fmtSize(b){
  if(!b&&b!==0)return '';
  if(b<1024)return b+' B';
  if(b<1048576)return (b/1024).toFixed(0)+' KB';
  return (b/1048576).toFixed(1)+' MB';
}
function attachListOf(ctx){return ctx==='asset'?assetAttachments:entryAttachments;}
function setAttachList(ctx,arr){if(ctx==='asset')assetAttachments=arr;else entryAttachments=arr;}
// Converte formato antigo (1 imagem em .attachment) para o novo
function normalizeAttachments(o){
  if(o&&Array.isArray(o.attachments))return o.attachments.slice();
  if(o&&o.attachment)return [{id:'old',name:'anexo.jpg',type:'image/jpeg',size:0,data:o.attachment}];
  return [];
}
function compressImage(file,cb){
  const rd=new FileReader();
  rd.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const MAX=1600;let w=img.width,h=img.height;
        if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r);}
        const cv=document.createElement('canvas');cv.width=w;cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        cb(cv.toDataURL('image/jpeg',0.82));
      }catch(err){cb(e.target.result);}
    };
    img.onerror=()=>cb(e.target.result);
    img.src=e.target.result;
  };
  rd.readAsDataURL(file);
}
function handleAttachment(ev,ctx){
  ctx=ctx||'entry';
  const en=currentLang==='en';
  const files=Array.from(ev.target.files||[]);
  if(!files.length)return;
  const MAXF=8*1024*1024;
  let pend=files.length;
  files.forEach(file=>{
    if(file.size>MAXF){
      toast(en?('Too big (max 8 MB): '+file.name):('Demasiado grande (máx 8 MB): '+file.name));
      if(--pend===0)renderAttachList(ctx);
      return;
    }
    const done=data=>{
      const list=attachListOf(ctx);
      list.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),
                 name:file.name,type:file.type||'application/octet-stream',
                 size:Math.round((data.length||0)*0.75),data});
      if(--pend===0)renderAttachList(ctx);
    };
    if(file.type&&file.type.startsWith('image/'))compressImage(file,done);
    else{const rd=new FileReader();rd.onload=e=>done(e.target.result);rd.onerror=()=>{if(--pend===0)renderAttachList(ctx);};rd.readAsDataURL(file);}
  });
  ev.target.value='';
}
function attachIcon(t){
  if(!t)return '📎';
  if(t.startsWith('image/'))return '🖼️';
  if(t==='application/pdf')return '📕';
  return '📎';
}
function renderAttachList(ctx){
  ctx=ctx||'entry';
  const box=document.getElementById(ctx==='asset'?'asset-attach-list':'attach-list');
  if(!box)return;
  const en=currentLang==='en';
  const list=attachListOf(ctx);
  if(!list.length){box.innerHTML='';return;}
  const total=list.reduce((s,a)=>s+(a.size||0),0);
  box.innerHTML=list.map((a,i)=>
    '<div class="att-row">'+
      '<span class="att-ic">'+attachIcon(a.type)+'</span>'+
      '<span class="att-name" title="'+esc(a.name)+'">'+esc(a.name)+'</span>'+
      '<span class="att-size">'+fmtSize(a.size)+'</span>'+
      '<button type="button" class="att-btn" data-act="openAttachment" data-args="['+esc(JSON.stringify(ctx))+','+(i)+']">'+(en?'Open':'Abrir')+'</button>'+
      '<button type="button" class="att-btn danger" data-act="removeAttachment" data-args="['+esc(JSON.stringify(ctx))+','+(i)+']">✕</button>'+
    '</div>').join('')+
    '<div class="att-total">'+list.length+' '+(en?'file(s)':'ficheiro(s)')+' · '+fmtSize(total)+
    (total>3*1024*1024?' <span style="color:var(--accent-ink)">'+(en?'— heavy, the vault file grows':'— pesado, o ficheiro do cofre cresce')+'</span>':'')+'</div>';
}
// Só tipos inofensivos abrem no browser; o resto (HTML, SVG…) é descarregado. Um blob abre com a origem da app:
// um anexo HTML/SVG (ex.: vindo de um ficheiro partilhado) corria código com acesso ao cofre aberto.
const ATT_VIEW_OK=/^(image\/(png|jpe?g|gif|webp|bmp|avif)|application\/pdf|text\/plain)$/i;
function openAttachData(a){
  if(!a||typeof a.data!=='string')return;
  try{
    const parts=a.data.split(',');
    const bin=atob(parts[1]);
    const arr=new Uint8Array(bin.length);
    for(let k=0;k<bin.length;k++)arr[k]=bin.charCodeAt(k);
    const viewable=ATT_VIEW_OK.test(a.type||'');
    const blob=new Blob([arr],{type:viewable?a.type:'application/octet-stream'});
    if(!viewable){downloadBlob(blob,a.name||'anexo');return;}
    const url=URL.createObjectURL(blob);
    const w=window.open(url,'_blank');if(w)try{w.opener=null;}catch(e){}
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){
    if(!/^data:image\//i.test(a.data))return;
    const w=window.open();if(w){try{w.opener=null;}catch(_){}w.document.write('<img src="'+esc(a.data)+'" style="max-width:100%">');}
  }
}
function openAttachment(ctx,i){openAttachData(attachListOf(ctx)[i]);}
function openAttachmentBy(kind,id,i){
  const o=kind==='asset'?(assets||[]).find(x=>x.id===id):(vault||[]).find(x=>x.id===id);
  if(!o)return;
  openAttachData(normalizeAttachments(o)[i]);
}
function attachChips(o,kind){
  const list=normalizeAttachments(o);
  if(!list.length)return '';
  return '<div class="att-chips">'+list.map((a,i)=>
    '<button class="att-chip" data-act="openAttachmentBy" data-arg="'+esc(kind)+'" data-arg2="'+esc(o.id)+'" data-arg3="'+i+'" title="'+esc(a.name||'')+'">'+
    attachIcon(a.type)+' <span>'+esc(a.name||'')+'</span></button>').join('')+'</div>';
}
function removeAttachment(ctx,i){
  ctx=ctx||'entry';
  const list=attachListOf(ctx);
  if(typeof i!=='number'){setAttachList(ctx,[]);renderAttachList(ctx);return;}
  list.splice(i,1);renderAttachList(ctx);
}


// ══ PW STRENGTH ══
function checkPwStrength(){
  const pw=document.getElementById('f-pw').value,score=getPwScore(pw);
  const bar=document.getElementById('pw-strength-bar'),lbl=document.getElementById('pw-strength-label');
  if(!pw){bar.style.width='0';lbl.textContent='';return;}
  if(isCommonPassword(pw)){
    bar.style.width='10%';bar.style.background='#e05252';
    lbl.textContent=currentLang==='en'?'🚨 Very common password!':'🚨 Password muito comum!';
    lbl.style.color='#e05252';return;
  }
  const lvls=[{w:'15%',c:'#e05252',k:'pwVeryWeak'},{w:'30%',c:'#e08852',k:'pwWeak'},{w:'55%',c:'#e0c852',k:'pwMedium'},{w:'80%',c:'#82c852',k:'pwGood'},{w:'100%',c:'#4caf82',k:'pwStrong'}];
  const lvl=lvls[Math.min(score,4)];bar.style.width=lvl.w;bar.style.background=lvl.c;lbl.textContent=t(lvl.k);lbl.style.color=lvl.c;
}
function goToEntry(id){
  const e=vault.find(v=>v.id===id);
  if(!e)return;
  if(e.archived){delete e.archived;markUnsaved();}
  currentVaultFolderId=e.folderId||null;
  switchTab('vault');
  setTimeout(()=>{
    avFlushChunks();
    const card=document.getElementById('card-'+id);
    if(card){
      card.scrollIntoView({behavior:'smooth',block:'center'});
      card.classList.add('entry-flash');
      setTimeout(()=>card.classList.remove('entry-flash'),1600);
    }
  },200);
}
let exportSelection=new Set();
function openSelectiveExport(){
  const en=currentLang==='en';
  exportSelection=new Set();
  document.getElementById('export-title').textContent=en?'📤 Share selected entries':'📤 Partilhar entradas selecionadas';
  document.getElementById('export-intro').textContent=en
    ?'Pick the entries to include. They are exported as their own encrypted .vault file with a password you choose — perfect for handing a few accounts to family without sharing everything.'
    :'Escolhe as entradas a incluir. Serão exportadas como um ficheiro .vault encriptado próprio, com uma palavra-passe à tua escolha — ideal para dar algumas contas à família sem partilhar tudo.';
  document.getElementById('export-all-btn').textContent=en?'Select all':'Selecionar todas';
  document.getElementById('export-none-btn').textContent=en?'Clear':'Limpar';
  document.getElementById('export-pw-lbl').textContent=en?'Password for the exported file':'Palavra-passe para o ficheiro exportado';
  document.getElementById('export-pw-hint').textContent=en?'Whoever receives the file needs this password to open it. Choose a strong one and share it separately.':'Quem receber o ficheiro precisa desta palavra-passe para o abrir. Escolhe uma forte e partilha-a à parte.';
  document.getElementById('export-close-btn').textContent=en?'Close':'Fechar';
  document.getElementById('export-pw').value='';
  document.getElementById('export-err').textContent='';
  renderExportList();
  updateExportCount();
  document.getElementById('export-overlay').classList.add('open');
}
function closeSelectiveExport(){document.getElementById('export-overlay').classList.remove('open');}
function renderExportList(){
  const en=currentLang==='en';
  const items=vault.filter(e=>!e.archived).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const el=document.getElementById('export-list');
  if(!items.length){el.innerHTML=`<div style="font-size:.72rem;color:var(--text-muted);text-align:center;padding:16px">${en?'No entries to export.':'Sem entradas para exportar.'}</div>`;return;}
  el.innerHTML=items.map(e=>{
    const ci=vaultCatInfo(e.cat);
    const on=exportSelection.has(e.id);
    return `<label class="export-row ${on?'on':''}">
      <input type="checkbox" ${on?'checked':''} data-change="toggleExportEntry" data-arg="${esc(e.id)}" style="accent-color:var(--accent);width:16px;height:16px;flex-shrink:0">
      <span style="flex-shrink:0">${ci.icon}</span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name||'')}</span>
      <span style="font-size:.6rem;color:var(--text-muted);white-space:nowrap">${esc(e.user||'')}</span>
    </label>`;
  }).join('');
}
function toggleExportEntry(id){
  if(exportSelection.has(id))exportSelection.delete(id);else exportSelection.add(id);
  const items=vault.filter(e=>!e.archived);
  renderExportList();updateExportCount();
}
function exportSelectAll(all){
  exportSelection=new Set(all?vault.filter(e=>!e.archived).map(e=>e.id):[]);
  renderExportList();updateExportCount();
}
function updateExportCount(){
  const el=document.getElementById('export-count');
  if(el)el.textContent=exportSelection.size;
}
async function doSelectiveExport(){
  const en=currentLang==='en';
  const err=document.getElementById('export-err');
  const pw=document.getElementById('export-pw').value;
  if(!exportSelection.size){err.textContent=en?'Select at least one entry.':'Seleciona pelo menos uma entrada.';return;}
  if(pw.length<4){err.textContent=en?'Choose a password (4+ characters).':'Escolhe uma palavra-passe (4+ caracteres).';return;}
  err.textContent='';
  const chosen=vault.filter(e=>exportSelection.has(e.id)).map(e=>{
    const{id,name,cat,user,pw,url,notes,tags,fields,icon}=e;
    return{id,name,cat,user,pw,url,notes,tags,fields,icon,fav:false,archived:false,createdAt:Date.now(),order:0};
  });
  try{
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const key=await deriveKey(pw,salt,KDF_ITER);
    // Mini-cofre: só entradas escolhidas, mesmo formato do .vault normal
    const payloadObj={fmt:VAULT_FMT,vault:chosen,notes:[],bankCards:[],activityLog:[],documents:[],trash:[],customCats:[],docFolders:[],vaultFolders:[],wifiNets:[],legacyNote:'',legacyOwner:'',totp:[]};
    const payload=await encrypt(key,payloadObj);
    const container=mkContainer({salt,iter:KDF_ITER},payload);
    const d=new Date();const pad=n=>String(n).padStart(2,'0');
    const stamp=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    downloadVault(container,`ciphervault_partilha_${stamp}.vault`);
    toast(en?`Exported ${chosen.length} entries ✓`:`Exportadas ${chosen.length} entradas ✓`);
    closeSelectiveExport();
  }catch(e){
    err.textContent=en?'Export failed. Try again.':'A exportação falhou. Tenta de novo.';
  }
}
function findDuplicateEntries(){
  // Agrupa entradas ativas por (nome+utilizador) normalizado; devolve grupos com 2+
  const groups={};
  vault.filter(e=>!e.archived).forEach(e=>{
    const key=((e.name||'').trim().toLowerCase())+'|'+((e.user||'').trim().toLowerCase());
    if(!key.trim()||key==='|')return;
    (groups[key]=groups[key]||[]).push(e);
  });
  return Object.values(groups).filter(g=>g.length>1).map(g=>({name:g[0].name||'(sem nome)',user:g[0].user||'',entries:g}));
}
function openDedupeModal(){
  const en=currentLang==='en';
  const groups=findDuplicateEntries();
  if(!groups.length){toast(en?'No duplicates found.':'Sem duplicados.');return;}
  document.getElementById('dedupe-title').textContent=en?'👥 Duplicate entries':'👥 Entradas duplicadas';
  document.getElementById('dedupe-intro').textContent=en
    ?'These entries share the same name and username. Keep one of each and remove the extras (they go to the recycle bin).'
    :'Estas entradas têm o mesmo nome e utilizador. Mantém uma de cada e remove as repetidas (vão para a reciclagem).';
  document.getElementById('dedupe-close').textContent=en?'Close':'Fechar';
  renderDedupeList();
  document.getElementById('dedupe-overlay').classList.add('open');
}
function closeDedupeModal(){document.getElementById('dedupe-overlay').classList.remove('open');}
function renderDedupeList(){
  const en=currentLang==='en';
  const groups=findDuplicateEntries();
  const el=document.getElementById('dedupe-list');
  if(!groups.length){el.innerHTML=`<div style="font-size:.74rem;color:var(--text-muted);text-align:center;padding:16px">${en?'No duplicates left ✓':'Sem duplicados ✓'}</div>`;return;}
  el.innerHTML=groups.map(g=>{
    const rows=g.entries.map((e,i)=>{
      const cat=vaultCatInfo(e.cat);
      const when=e.pwUpdated?new Date(e.pwUpdated).toLocaleDateString(en?'en-GB':'pt-PT'):'—';
      return `<div class="dedupe-entry">
        <div style="flex:1;min-width:0">
          <div style="font-size:.78rem;color:var(--text)">${cat.icon} ${esc(e.name||'')} ${i===0?`<span style="color:var(--green);font-size:.6rem">· ${en?'keep':'manter'}</span>`:''}</div>
          <div style="font-size:.62rem;color:var(--text-muted);margin-top:2px">${esc(e.user||'—')} · ${en?'updated':'atualizada'} ${when}</div>
        </div>
        ${i>0?`<button class="snap-restore" style="border-color:var(--red);color:var(--red)" data-act="removeDuplicate" data-arg="${esc(e.id)}">${en?'Remove':'Remover'}</button>`:''}
      </div>`;
    }).join('');
    return `<div class="dedupe-group"><div class="dedupe-group-head">${esc(g.name)} — ${g.entries.length}×</div>${rows}</div>`;
  }).join('');
}
function removeDuplicate(id){
  const e=vault.find(v=>v.id===id);
  if(e){logActivity('delete',e.name,'🗑️');trash.unshift({type:'vault',data:e,deletedAt:Date.now()});vault=vault.filter(v=>v.id!==id);}
  markUnsaved();renderDedupeList();renderAll();
  toast(currentLang==='en'?'Duplicate removed':'Duplicado removido');
}
function checkDuplicate(){
  const pw=document.getElementById('f-pw').value,warn=document.getElementById('dup-warn');
  if(!pw){warn.classList.remove('show');return;}
  warn.classList.toggle('show',vault.filter(e=>!e.archived).some(e=>e.pw===pw&&e.id!==editingId));
}
// Índice aleatório uniforme em [0,n): rejeita os valores que dariam viés («byte % 70» favorecia os 46 primeiros caracteres)
function randIndex(n){const lim=Math.floor(0x100000000/n)*n,b=new Uint32Array(1);do{crypto.getRandomValues(b);}while(b[0]>=lim);return b[0]%n;}
function randomString(chars,len){let s='';for(let i=0;i<len;i++)s+=chars[randIndex(chars.length)];return s;}
function generatePw(){
  const pw=randomString('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',20);
  document.getElementById('f-pw').value=pw;checkPwStrength();checkDuplicate();
}

// ══ ADVANCED PW GEN ══
function openPwGen(){updatePwGen();document.getElementById('pwgen-overlay').classList.add('open');}
function closePwGen(){document.getElementById('pwgen-overlay').classList.remove('open');}
const PASSPHRASE_WORDS=['casa','gato','livro','porta','mesa','janela','flor','rio','ponte','monte','estrela','peixe','pao','vento','chuva','sol','lua','fogo','terra','mar','arvore','folha','pedra','ouro','prata','ferro','vidro','papel','tinta','musica','danca','festa','tempo','noite','manha','tarde','verde','azul','preto','branco','forte','rapido','lento','alto','baixo','grande','pequeno','doce','amargo','quente','frio','novo','velho','claro','escuro','leve','pesado','limpo','sujo','cheio','vazio','aberto','calmo','feliz','bravo','tigre','leao','aguia','lobo','urso','cavalo','coelho','raposa','coruja','falcao','golfinho','baleia','tubarao','abelha','formiga','aranha','borboleta','montanha','floresta','deserto','oceano','ilha','vale','planicie','caverna','vulcao','trovao','relampago','nuvem','neve','gelo','orvalho','bruma','aurora','cometa','planeta','galaxia','foguete','castelo','torre','muralha','espada','escudo','coroa','anel','joia','tesouro','mapa','bussola','ancora','vela','remo','farol','sino','tambor','flauta','guitarra','violino','piano','pincel','moldura','estatua'];
const PGMODE={m:'random'};
function setPwGenMode(mode){
  PGMODE.m=mode;
  document.getElementById('pgm-random').classList.toggle('active',mode==='random');
  document.getElementById('pgm-memorable').classList.toggle('active',mode==='memorable');
  document.getElementById('pgmode-random').style.display=mode==='random'?'block':'none';
  document.getElementById('pgmode-memorable').style.display=mode==='memorable'?'block':'none';
  updatePwGen();
}
function updatePwGen(){
  let pw='';
  if(PGMODE.m==='memorable'){
    const nWords=parseInt(document.getElementById('pgm-words').value);
    {const e=document.getElementById('pgm-words-val');if(e)e.textContent=nWords;}
    const cap=document.getElementById('pgm-cap').checked;
    const num=document.getElementById('pgm-num').checked;
    const words=[];
    for(let i=0;i<nWords;i++){
      let w=PASSPHRASE_WORDS[randIndex(PASSPHRASE_WORDS.length)];
      if(cap)w=w.charAt(0).toUpperCase()+w.slice(1);
      words.push(w);
    }
    pw=words.join('-');
    if(num)pw+='-'+(randIndex(90)+10);
  }else{
    const len=parseInt(document.getElementById('pwgen-len').value);
    {const e=document.getElementById('pwgen-len-val');if(e)e.textContent=len;}
    let chars='';
    if(document.getElementById('pg-upper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if(document.getElementById('pg-lower').checked)chars+='abcdefghijklmnopqrstuvwxyz';
    if(document.getElementById('pg-numbers').checked)chars+='0123456789';
    if(document.getElementById('pg-symbols').checked)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
    if(!chars)chars='abcdefghijklmnopqrstuvwxyz';
    pw=randomString(chars,len);
  }
  document.getElementById('pwgen-result').value=pw;
  // Força: para frases longas, o comprimento garante força
  let score=getPwScore(pw);
  if(PGMODE.m==='memorable'&&pw.length>=18)score=Math.max(score,4);
  const lvls=[{w:'15%',c:'#e05252',k:'pwVeryWeak'},{w:'30%',c:'#e08852',k:'pwWeak'},{w:'55%',c:'#e0c852',k:'pwMedium'},{w:'80%',c:'#82c852',k:'pwGood'},{w:'100%',c:'#4caf82',k:'pwStrong'}];
  const lvl=lvls[Math.min(score,4)];
  const bar=document.getElementById('pwgen-bar'),lbl=document.getElementById('pwgen-label');
  bar.style.width=lvl.w;bar.style.background=lvl.c;lbl.textContent=t(lvl.k);lbl.style.color=lvl.c;
}
function usePwGen(){document.getElementById('f-pw').value=document.getElementById('pwgen-result').value;checkPwStrength();checkDuplicate();closePwGen();}

// ══ NOTES ══
function renderNotesList(){
  const el=document.getElementById('notes-list-items');el.innerHTML='';
  const titleEl=document.getElementById('notes-title');if(titleEl)titleEl.textContent=t('notesTitle');
  if(!notes.filter(n=>!n.archived).length){
    el.innerHTML=`<div style="padding:14px;font-size:.62rem;color:var(--text-muted);text-align:center">${currentLang==='en'?'No notes yet':'Sem notas'}</div>`;
    hideNoteEditor();return;
  }
  notes.filter(n=>!n.archived).forEach(note=>{
    const div=document.createElement('div');
    div.className=`note-item${editingNoteId===note.id?' active':''}`;
    div.innerHTML=`<div class="note-item-title">${esc(note.title||'...')}</div><div class="note-item-preview">${esc((note.body||'').slice(0,40))}</div>`;
    div.onclick=()=>selectNote(note.id);
    el.appendChild(div);
  });
}
function hideNoteEditor(){
  document.getElementById('notes-empty').style.display='flex';
  document.getElementById('ne-title').style.display='none';
  document.getElementById('ne-body').style.display='none';
  document.getElementById('ne-actions').style.display='none';
}
function showNoteEditor(note){
  document.getElementById('notes-empty').style.display='none';
  const titleEl=document.getElementById('ne-title');
  const bodyEl=document.getElementById('ne-body');
  const actionsEl=document.getElementById('ne-actions');
  titleEl.style.display='block';titleEl.value=note.title||'';titleEl.placeholder=t('noteTitlePh');
  bodyEl.style.display='flex';bodyEl.value=note.body||'';bodyEl.placeholder=t('noteBodyPh');
  actionsEl.style.display='flex';
  const counter=document.getElementById('note-char-count');
  if(counter){counter.style.display='block';counter.textContent=`${(note.body||'').length} ${currentLang==='en'?'characters':'caracteres'}`;}
  document.getElementById('ne-save-btn').textContent=t('btnSaveNote');
  document.getElementById('ne-del-btn').textContent=t('btnDelNote');
  const arcBtn=document.getElementById('ne-archive-btn');
  if(arcBtn)arcBtn.textContent='📦 '+t('btnArchive');
}
function newNote(){
  const note={id:Date.now().toString(36),title:'',body:'',createdAt:Date.now()};
  notes.push(note);editingNoteId=note.id;renderNotesList();showNoteEditor(note);
  document.getElementById('ne-title').focus();
}
function selectNote(id){
  editingNoteId=id;
  const note=notes.find(n=>n.id===id);
  if(note){renderNotesList();showNoteEditor(note);}
}
function saveNote(){
  const note=notes.find(n=>n.id===editingNoteId);if(!note)return;
  note.title=document.getElementById('ne-title').value;
  note.body=document.getElementById('ne-body').value;
  renderNotesList();toast(t('toastNoteSaved'));markUnsaved();
}
function deleteCurrentNote(){
  if(!editingNoteId)return;
  if(!confirm(currentLang==='en'?'Move this note to the recycle bin?':'Mover esta nota para a reciclagem?'))return;
  const n=notes.find(nn=>nn.id===editingNoteId);
  if(n){logActivity('delete',n.title||'...','🗑️');trash.unshift({type:'note',data:n,deletedAt:Date.now()});}
  notes=notes.filter(nn=>nn.id!==editingNoteId);
  editingNoteId=null;renderNotesList();hideNoteEditor();
  toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movida para a reciclagem 🗑️');markUnsaved();
}

// ══ BANK CARDS ══
let bankCards=[];let editingCardId=null;let selectedCardColor='#1a237e';

function openCardModal(id=null){
  editingCardId=id;selectedCardColor='#1a237e';
  document.getElementById('card-modal-title').textContent=id?t('cardModalEdit'):t('cardModalNew');
  if(id){
    const c=bankCards.find(c=>c.id===id);
    document.getElementById('card-bank').value=c.bank||'';
    document.getElementById('card-holder').value=c.holder||'';
    document.getElementById('card-number').value=c.number||'';
    document.getElementById('card-expiry').value=c.expiry||'';
    document.getElementById('card-type').value=c.type||'debito';
    document.getElementById('card-pin').value=c.pin||'';
    {const cv=document.getElementById('card-cvv');if(cv)cv.value=c.cvv||'';}
    document.getElementById('card-notes').value=c.notes||'';
    selectedCardColor=c.color||'#1a237e';
  }else{
    ['card-bank','card-holder','card-number','card-expiry','card-pin','card-cvv','card-notes'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    document.getElementById('card-type').value='debito';
  }
  document.querySelectorAll('.card-color-swatch').forEach(s=>{s.classList.toggle('active',s.dataset.color===selectedCardColor);});
  document.getElementById('card-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('card-bank').focus(),100);
}
function closeCardModal(){document.getElementById('card-overlay').classList.remove('open');editingCardId=null;}
function selectCardColor(color){
  selectedCardColor=color;
  document.querySelectorAll('.card-color-swatch').forEach(s=>s.classList.toggle('active',s.dataset.color===color));
}
function formatCardNumber(el){
  let v=el.value.replace(/\D/g,'').slice(0,16);
  el.value=v.replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(el){
  let v=el.value.replace(/\D/g,'').slice(0,4);
  if(v.length>=2)v=v.slice(0,2)+'/'+v.slice(2);
  el.value=v;
}
function saveCard(){
  const bank=document.getElementById('card-bank').value.trim();
  if(!bank){alert(t('cardRequired'));return;}
  const existing=editingCardId?bankCards.find(c=>c.id===editingCardId):null;
  const card={
    ...(existing||{}),
    id:editingCardId||Date.now().toString(36),
    bank,holder:document.getElementById('card-holder').value.trim(),
    number:document.getElementById('card-number').value.trim(),
    expiry:document.getElementById('card-expiry').value.trim(),
    type:document.getElementById('card-type').value,
    pin:document.getElementById('card-pin').value,
    cvv:(document.getElementById('card-cvv')||{}).value||'',
    notes:document.getElementById('card-notes').value.trim(),
    color:selectedCardColor,createdAt:existing&&existing.createdAt||Date.now(),
  };
  const idx=existing?bankCards.indexOf(existing):-1;
  if(idx>=0)bankCards[idx]=card;else bankCards.push(card);
  closeCardModal();renderBankCards();
  toast(existing?t('cardUpdated'):t('cardAdded'));markUnsaved();
}
function deleteCard(id){
  if(!confirm(currentLang==='en'?'Move this card to the recycle bin?':'Mover este cartão para a reciclagem?'))return;
  const cd=bankCards.find(cc=>cc.id===id);
  if(cd){logActivity('delete',cd.bank,'🗑️');trash.unshift({type:'card',data:cd,deletedAt:Date.now()});}
  bankCards=bankCards.filter(cc=>cc.id!==id);renderBankCards();
  toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}
function renderBankCards(){
  const grid=document.getElementById('cards-grid-area');
  const activeCards=bankCards.filter(cd=>!cd.archived);
  if(!activeCards.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><p>${t('cardEmpty')}</p></div>`;
    return;
  }
  grid.innerHTML=activeCards.map(card=>{
    const typeLabels=t('cardTypeLabels');
    const maskedNum=card.number?card.number.replace(/\d(?=\d{4})/g,'•'):'•••• •••• •••• ••••';
    return `<div class="bank-card-wrap">
      <div class="bank-card" style="background:linear-gradient(135deg,${card.color},${card.color}dd)">
        <div class="bank-card-top">
          <span class="bank-card-bank">${esc(card.bank)}</span>
          <span class="bank-card-type-badge">${typeLabels[card.type]||card.type}</span>
        </div>
        <div class="bank-card-chip"></div>
        <div class="bank-card-number">${esc(maskedNum)}</div>
        <div class="bank-card-bottom">
          <span class="bank-card-holder">${esc(card.holder||'—')}</span>
          <div class="bank-card-expiry-wrap">
            <span class="bank-card-expiry-label">VALID THRU</span>
            <span class="bank-card-expiry">${esc(card.expiry||'—/—')}</span>
          </div>
        </div>
      </div>
      <div class="bank-card-actions">
        ${card.pin?`<div style="display:flex;align-items:center;gap:6px;background:var(--panel);border:1px solid var(--border);border-radius:2px;padding:5px 10px;flex:1">
          <span style="font-size:.52rem;letter-spacing:2px;color:var(--text-muted)">PIN</span>
          <span class="pin-reveal" id="pin-${card.id}">${esc(card.pin)}</span>
          <span style="font-size:.52rem;letter-spacing:2px;color:var(--text-muted)" id="pin-masked-${card.id}">••••</span>
          <button class="card-btn" id="pin-btn-${card.id}" data-act="togglePin" data-arg="${esc(card.id)}" style="margin-left:auto">👁️</button>
        </div>`:''}
        <button class="card-btn" data-act="openCardModal" data-arg="${esc(card.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${t('btnEdit')}</button>
        <button class="card-btn" data-act="archiveCard" data-arg="${esc(card.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg> ${t('btnArchive')}</button>
        <button class="card-btn danger" data-act="deleteCard" data-arg="${esc(card.id)}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg> ${t('btnDel')}</button>
      </div>
      ${card.notes?`<div style="font-size:.62rem;color:var(--text-muted);padding:8px 2px;line-height:1.5">${esc(card.notes)}</div>`:''}
    </div>`;
  }).join('');
}
function togglePin(id){
  const pinEl=document.getElementById('pin-'+id);
  const maskedEl=document.getElementById('pin-masked-'+id);
  const btn=document.getElementById('pin-btn-'+id);
  if(pinEl.style.display==='inline'){pinEl.style.display='none';maskedEl.style.display='inline';btn.textContent='👁️';}
  else{pinEl.style.display='inline';maskedEl.style.display='none';btn.textContent='🙈';}
}

// ══ CHANGE MASTER PW ══
function openChangePwModal(){
  if(presentationMode){toast(currentLang==='en'?'Not available in demo mode.':'Indisponível no modo demonstração.');return;}
  ['cp-current','cp-new','cp-confirm'].forEach(id=>document.getElementById(id).value='');document.getElementById('cp-error').textContent='';document.getElementById('changepw-overlay').classList.add('open');setTimeout(()=>document.getElementById('cp-current').focus(),100);}
function closeChangePwModal(){document.getElementById('changepw-overlay').classList.remove('open');}
async function changeMasterPw(){
  const cur=document.getElementById('cp-current').value,np=document.getElementById('cp-new').value,cf=document.getElementById('cp-confirm').value,err=document.getElementById('cp-error');
  if(cur!==masterPwRaw){err.textContent=t('cpErrWrong');return;}if(np.length<4){err.textContent=t('cpErrShort');return;}if(np!==cf){err.textContent=t('cpErrMatch');return;}if(np===cur){err.textContent=t('cpErrSame');return;}
  const salt=crypto.getRandomValues(new Uint8Array(16)),key=await deriveKey(np,salt,KDF_ITER);
  if(totpUnlocked)totpEnc=await encryptTotpArray();
  const payload=await encrypt(key,vaultPayload());downloadVault(mkContainer({salt,iter:KDF_ITER},payload));
  masterKey=key;masterPwRaw=np;window._salt=salt;window._iter=KDF_ITER;clearQuickUnlock();closeChangePwModal();toast(t('toastPwChanged'));
  // O ficheiro do cofre, a cópia interna e o Drive ainda estão com a palavra-passe antiga: regravar já com a nova
  // (antes ficavam assim até à próxima alteração — e ao reabrir, a palavra-passe nova «não funcionava»)
  markUnsaved();
  try{await saveFile({auto:true});}catch(e){}
}

