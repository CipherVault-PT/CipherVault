// ══ CSV IMPORT ══
let pendingImportData=[];
// CSV (RFC 4180): aspas escapadas ("") e campos com vírgulas ou quebras de linha.
// O parser antigo partia por linhas e trocava o estado a cada aspa: «pa""ss» ficava «pass» (password corrompida).
function parseCSV(text){
  const rows=[];let row=[],cur='',inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){if(text[i+1]==='"'){cur+='"';i++;}else inQ=false;}
      else cur+=c;
    }else if(c==='"')inQ=true;
    else if(c===','){row.push(cur);cur='';}
    else if(c==='\n'||c==='\r'){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(cur);cur='';
      if(row.some(v=>v.trim()))rows.push(row);
      row=[];
    }else cur+=c;
  }
  row.push(cur);if(row.some(v=>v.trim()))rows.push(row);
  return rows;
}
// Colunas pelo nome do cabeçalho (Chrome, Edge, Firefox, Bitwarden, 1Password…); sem cabeçalho: ordem do Chrome
function csvColumns(first){
  const H=first.map(h=>h.trim().toLowerCase().replace(/^\uFEFF/,''));
  const find=(...ks)=>H.findIndex(h=>ks.includes(h));
  const c={name:find('name','title','nome','account'),url:find('url','login_uri','website','web site','uri','origin'),
    user:find('username','login_username','user','user name','email','login','utilizador'),
    pw:find('password','login_password','pass','palavra-passe'),note:find('note','notes','extra','comments','nota','notas')};
  if(c.pw>=0&&(c.user>=0||c.url>=0||c.name>=0))return{c,header:true};
  return{c:{name:0,url:1,user:2,pw:3,note:4},header:false};
}
function avUid(){const b=crypto.getRandomValues(new Uint8Array(6));return Date.now().toString(36)+'_'+Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('csv-input-app').addEventListener('change',importCSV);});
function importCSV(e){
  const file=(e.target||document.getElementById('csv-input-app')).files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const rows=parseCSV(String(ev.target.result||''));
    if(!rows.length){toast(currentLang==='en'?'Empty CSV!':'CSV vazio!');return;}
    pendingImportData=[];
    const {c,header}=csvColumns(rows[0]);
    const cell=(r,i)=>i>=0&&i<r.length?r[i]:'';
    rows.slice(header?1:0).forEach(r=>{
      const pw=cell(r,c.pw);   // a password não é aparada: espaços podem fazer parte dela
      if(!pw)return;
      const url=cell(r,c.url).trim(),user=cell(r,c.user).trim();
      pendingImportData.push({name:cell(r,c.name).trim()||url||'Importado',url,user,pw,notes:cell(r,c.note).trim()});
    });
    document.getElementById('csv-input-app').value='';
    if(!pendingImportData.length){toast(currentLang==='en'?'No valid entries found!':'Nenhuma entrada válida!');return;}
    const count=pendingImportData.length;
    document.getElementById('import-preview').innerHTML=`
      <div style="font-size:.62rem;color:var(--text-muted);margin-bottom:14px;line-height:1.8">
        ${currentLang==='en'?`Found <strong style="color:var(--accent-ink)">${count}</strong> entries.<br>⚠️ <strong style="color:var(--red)">Delete the CSV file</strong> after importing!`:`Encontradas <strong style="color:var(--accent-ink)">${count}</strong> entradas.<br>⚠️ <strong style="color:var(--red)">Apaga o ficheiro CSV</strong> após importar!`}
      </div>
      <div style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:5px">
        ${pendingImportData.slice(0,8).map(e=>`<div style="background:var(--bg);border:1px solid var(--border);border-radius:2px;padding:7px 11px;font-size:.62rem"><span style="color:var(--accent-ink)">${esc(e.name)}</span> <span style="color:var(--text-muted)">${esc(e.user)}</span></div>`).join('')}
        ${pendingImportData.length>8?`<div style="font-size:.58rem;color:var(--text-muted);text-align:center;padding:5px">...+${pendingImportData.length-8}</div>`:''}
      </div>`;
    document.getElementById('import-overlay').classList.add('open');
  };
  reader.readAsText(file);
}
function confirmImport(){
  // ids com parte aleatória a sério: no mesmo milissegundo, 3 caracteres aleatórios repetiam-se em importações grandes
  // (ids iguais → apagar/editar uma entrada afetava a outra e a sincronização descartava uma delas)
  const now=Date.now();
  pendingImportData.forEach(e=>{vault.push({id:avUid(),name:e.name,cat:'outro',user:e.user,pw:e.pw,url:e.url,notes:e.notes||'',tags:[],fav:false,archived:false,createdAt:now,order:vault.length,pwUpdated:now});});
  const count=pendingImportData.length;pendingImportData=[];closeImport();
  if(count)logActivity('add',(currentLang==='en'?`CSV import (${count})`:`Importação CSV (${count})`),'📥');
  renderAll();
  if(count)markUnsaved();   // antes não marcava: a importação podia perder-se ao fechar a app (sem aviso nem gravação automática)
  toast(currentLang==='en'?`${count} entries imported! ✓`:`${count} entradas importadas! ✓`);
}
function closeImport(){document.getElementById('import-overlay').classList.remove('open');pendingImportData=[];}

// ══ EXPORT PDF ══
async function exportPDF(){
  if(!await avPlainExportOk('PDF'))return;
  // Ask for user name
  const userName=prompt(currentLang==='en'?'Your name (for the document):':'O teu nome (para o documento):','') || 'Aurora Vault';
  const active=vault.filter(e=>!e.archived);
  const now=new Date();
  const dateStr=now.toLocaleDateString(currentLang==='pt'?'pt-PT':'en-GB',{year:'numeric',month:'long',day:'numeric'});
  const timeStr=now.toLocaleTimeString(currentLang==='pt'?'pt-PT':'en-GB',{hour:'2-digit',minute:'2-digit'});

  // Group by category (built-ins + customs)
  const groups=allEntryCats().map(ci=>({...ci,entries:[]}));
  const gOutro=groups.find(g=>g.key==='outro');
  active.forEach(e=>{(groups.find(g=>g.key===e.cat)||gOutro).entries.push(e);});

  let sectionsHtml='';
  groups.forEach(g=>{
    const entries=g.entries;
    if(!entries.length)return;
    const rows=entries.map((e,i)=>`
      <tr class="${i%2===0?'even':'odd'}">
        <td><strong>${esc(e.name)}</strong></td>
        <td>${esc(e.user||'—')}</td>
        <td style="font-family:'Courier New',monospace;font-size:11px">${esc(e.pw||'—')}</td>
        <td style="font-size:11px;color:#666">${esc(e.url||'—')}</td>
        <td style="font-size:11px;color:#666">${e.pwUpdated?Math.floor((Date.now()-e.pwUpdated)/86400000)+' '+(currentLang==='en'?'days':'dias'):'—'}</td>
      </tr>`).join('');
    sectionsHtml+=`
      <div class="section">
        <h2 style="color:${g.color};border-bottom:2px solid ${g.color};padding-bottom:6px;margin-bottom:12px">
          ${g.icon} ${esc(g.label)} <span style="font-size:13px;color:#999;font-weight:400">(${entries.length})</span>
        </h2>
        <table>
          <thead><tr>
            <th>${currentLang==='en'?'Name':'Nome'}</th>
            <th>${currentLang==='en'?'Username':'Utilizador'}</th>
            <th>Password</th>
            <th>URL</th>
            <th>${currentLang==='en'?'Age':'Idade'}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  });

  const html=`<!DOCTYPE html>
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<title>Aurora Vault — ${esc(userName)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#fff;color:#222;padding:0;}
  .page{max-width:900px;margin:0 auto;padding:40px;}
  .header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #c9a84c;}
  .header-left h1{font-family:'Playfair Display',serif;font-size:32px;color:#8a6520;letter-spacing:3px;margin-bottom:4px;}
  .header-left p{color:#999;font-size:12px;letter-spacing:2px;text-transform:uppercase;}
  .header-right{text-align:right;font-size:12px;color:#999;}
  .header-right strong{color:#222;display:block;font-size:15px;margin-bottom:2px;}
  .warn{background:#fffbf0;border-left:4px solid #c9a84c;padding:12px 16px;margin-bottom:28px;font-size:12px;color:#7a5a10;border-radius:0 4px 4px 0;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
  .stat{background:#f8f5f0;border-radius:6px;padding:14px;text-align:center;}
  .stat-num{font-family:'Playfair Display',serif;font-size:28px;color:#c9a84c;}
  .stat-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-top:3px;}
  .section{margin-bottom:28px;page-break-inside:avoid;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:#f5f0e8;padding:9px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:2px solid #e8e0d0;}
  td{padding:8px 10px;border-bottom:1px solid #f0ece6;}
  tr.even td{background:#fdfcfa;}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e0dcd6;display:flex;justify-content:space-between;font-size:11px;color:#aaa;}
  @media print{.warn{-webkit-print-color-adjust:exact;print-color-adjust:exact;}th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>⬡ AURORA VAULT</h1>
      <p>${currentLang==='en'?'Encrypted Credential Export':'Exportação de Credenciais Encriptadas'}</p>
    </div>
    <div class="header-right">
      <strong>${esc(userName)}</strong>
      ${dateStr} • ${timeStr}
    </div>
  </div>
  <div class="warn">⚠️ ${currentLang==='en'?'This document contains sensitive information. Store it securely, do not share it, and delete it after use.':'Este documento contém informação sensível. Guarda-o em segurança, não o partilhes e apaga-o após uso.'}</div>
  <div class="stats">
    <div class="stat"><div class="stat-num">${active.length}</div><div class="stat-label">${currentLang==='en'?'Total':'Total'}</div></div>
    <div class="stat"><div class="stat-num">${active.filter(e=>e.fav).length}</div><div class="stat-label">${currentLang==='en'?'Favourites':'Favoritos'}</div></div>
    <div class="stat"><div class="stat-num">${groups.filter(g=>g.entries.length>0).length}</div><div class="stat-label">${currentLang==='en'?'Categories':'Categorias'}</div></div>
    <div class="stat"><div class="stat-num">${notes.length}</div><div class="stat-label">${currentLang==='en'?'Notes':'Notas'}</div></div>
  </div>
  ${sectionsHtml}
  <div class="footer">
    <span>Aurora Vault © 2026 — ${currentLang==='en'?'Generated by':'Gerado por'} ${esc(userName)}</span>
    <span>${currentLang==='en'?'All data is encrypted with AES-256-GCM':'Todos os dados encriptados com AES-256-GCM'}</span>
  </div>
</div>
</body></html>`;

  downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),`ciphervault_${userName.replace(/[\s\\/:*?"<>|]+/g,'_')}_${now.toISOString().slice(0,10)}.html`);
  toast(currentLang==='en'?'PDF ready! Open in browser → Print → Save as PDF':'PDF pronto! Abre no browser → Imprimir → Guardar como PDF');
}

// ══ DOCUMENTS ══
let documents=[];let editingDocId=null;let pendingDocFile=null;
let personalInfo=[];let editingInfoId=null;
let subscriptions=[];let editingSubId=null;
let storeCards=[];let editingStoreId=null;
let assets=[];let editingAssetId=null;let currentAssetKind='warranty';
let vaultName='';

const DOC_CATS={
  pessoal:{icon:'👤',label:{pt:'Pessoal',en:'Personal'}},
  trabalho:{icon:'💼',label:{pt:'Trabalho',en:'Work'}},
  banco:{icon:'🏦',label:{pt:'Banco',en:'Bank'}},
  saude:{icon:'🏥',label:{pt:'Saúde',en:'Health'}},
  juridico:{icon:'⚖️',label:{pt:'Jurídico',en:'Legal'}},
  educacao:{icon:'🎓',label:{pt:'Educação',en:'Education'}},
  outro:{icon:'📋',label:{pt:'Outro',en:'Other'}},
};
const FILE_ICONS={
  pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',
  png:'🖼️',jpg:'🖼️',jpeg:'🖼️',gif:'🖼️',webp:'🖼️',
  txt:'📃',csv:'📊',zip:'🗜️',default:'📎'
};
function getFileIcon(name){
  if(!name)return FILE_ICONS.default;
  const ext=name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext]||FILE_ICONS.default;
}
function formatFileSize(bytes){
  if(bytes<1024)return bytes+'B';
  if(bytes<1024*1024)return (bytes/1024).toFixed(1)+'KB';
  return (bytes/(1024*1024)).toFixed(1)+'MB';
}
function populateDocCatSelect(){
  const sel=document.getElementById('doc-cat');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=Object.entries(DOC_CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label[currentLang]||v.label.pt}</option>`).join('');
  if(cur&&[...sel.options].some(o=>o.value===cur))sel.value=cur;
}
function getDocCatLabel(cat){
  return (DOC_CATS[cat]?.label[currentLang]||cat);
}

let currentDocFilter='all';

function openDocModal(id=null){
  editingDocId=id;pendingDocFile=null;
  const isEdit=!!id;
  document.getElementById('doc-modal-title').textContent=isEdit?
    (currentLang==='en'?'📁 Edit Document':'📁 Editar Documento'):
    (currentLang==='en'?'📁 New Document':'📁 Novo Documento');
  if(isEdit){
    const d=documents.find(d=>d.id===id);
    document.getElementById('doc-title-input').value=d.title||'';
    document.getElementById('doc-cat').value=d.cat||'outro';
    document.getElementById('doc-date').value=d.date||'';
    document.getElementById('doc-expiry').value=d.expiry||'';
    document.getElementById('doc-desc').value=d.desc||'';
    populateDocCatSelect();
    document.getElementById('doc-cat').value=d.cat||'outro';
    populateFolderSelect(d.folderId||'');
    if(d.file){pendingDocFile=d.file;showDocFilePreview(d.file.name,d.file.size,d.file.type);}
    else{clearDocFile();}
  }else{
    ['doc-title-input','doc-date','doc-expiry','doc-desc'].forEach(i=>document.getElementById(i).value='');
    populateDocCatSelect();
    document.getElementById('doc-cat').value='pessoal';
    populateFolderSelect(currentFolderId||'');
    clearDocFile();
  }
  document.getElementById('doc-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('doc-title-input').focus(),100);
}
function closeDocModal(){document.getElementById('doc-overlay').classList.remove('open');editingDocId=null;pendingDocFile=null;}

function handleDocFileSelect(e){
  const file=e.target.files[0];if(!file)return;
  readDocFile(file);
  e.target.value='';
}
function handleDocFileDrop(e){
  e.preventDefault();
  document.getElementById('doc-drop-zone').style.borderColor='var(--border)';
  const file=e.dataTransfer?.files[0];if(!file)return;
  readDocFile(file);
}
function readDocFile(file){
  const reader=new FileReader();
  reader.onload=ev=>{
    pendingDocFile={name:file.name,size:file.size,type:file.type,data:ev.target.result};
    showDocFilePreview(file.name,file.size,file.type);
  };
  reader.readAsDataURL(file);
}
function showDocFilePreview(name,size,type){
  document.getElementById('doc-drop-zone').style.display='none';
  const preview=document.getElementById('doc-file-preview');
  preview.style.display='block';
  document.getElementById('doc-file-icon').textContent=getFileIcon(name);
  document.getElementById('doc-file-name').textContent=name;
  document.getElementById('doc-file-size').textContent=formatFileSize(size)+(type?` • ${type}`:'');
}
function clearDocFile(){
  pendingDocFile=null;
  document.getElementById('doc-drop-zone').style.display='block';
  document.getElementById('doc-file-preview').style.display='none';
}

function saveDoc(){
  const title=document.getElementById('doc-title-input').value.trim();
  if(!title){toast(currentLang==='en'?'Title is required!':'Título obrigatório!');return;}
  const prev=editingDocId?documents.find(d=>d.id===editingDocId):null;
  const doc={
    ...(prev||{}),
    id:editingDocId||Date.now().toString(36),
    title,cat:document.getElementById('doc-cat').value,
    date:document.getElementById('doc-date').value,
    expiry:document.getElementById('doc-expiry').value,
    desc:document.getElementById('doc-desc').value.trim(),
    folderId:(document.getElementById('doc-folder')?.value||'')||null,
    file:pendingDocFile?{...pendingDocFile}:null,
    createdAt:prev&&prev.createdAt||Date.now(),
  };
  const wasEditing=!!prev;
  const idx=prev?documents.indexOf(prev):-1;
  if(idx>=0)documents[idx]=doc;else documents.push(doc);
  logActivity(wasEditing?'edit':'add',title,'📁');
  closeDocModal();
  setTimeout(()=>{
    renderDocs();
    toast(wasEditing?(currentLang==='en'?'Document updated!':'Documento atualizado!'):(currentLang==='en'?'Document added!':'Documento adicionado!'));
    markUnsaved();
  },50);
}
function deleteDoc(id){
  if(!confirm(currentLang==='en'?'Move this document to the recycle bin?':'Mover este documento para a reciclagem?'))return;
  const d=documents.find(doc=>doc.id===id);
  if(d){logActivity('delete',d.title,'🗑️');trash.unshift({type:'doc',data:d,deletedAt:Date.now()});}
  documents=documents.filter(doc=>doc.id!==id);
  renderDocs();toast(currentLang==='en'?'Moved to recycle bin 🗑️':'Movido para a reciclagem 🗑️');markUnsaved();
}
let docPreviewId=null;
function previewDoc(id){
  const d=documents.find(doc=>doc.id===id);
  if(!d?.file?.data){toast(currentLang==='en'?'No file attached!':'Sem ficheiro anexado!');return;}
  const en=currentLang==='en';
  docPreviewId=id;
  const name=d.file.name||'';
  const ext=(name.split('.').pop()||'').toLowerCase();
  const type=d.file.type||'';
  document.getElementById('docview-title').textContent=d.title||name;
  document.getElementById('docview-sub').textContent=`${name} · ${formatFileSize(d.file.size)}`;
  document.getElementById('docview-dl-txt').textContent=en?'Download':'Transferir';
  const body=document.getElementById('docview-body');
  const isImg=type.startsWith('image/')||['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext);
  const isPdf=type==='application/pdf'||ext==='pdf';
  const isText=type.startsWith('text/')||['txt','csv','md','json','log'].includes(ext);
  if(isImg){
    body.innerHTML=`<img src="${esc(d.file.data)}" alt="${esc(name)}">`;
  }else if(isPdf){
    body.innerHTML=`<iframe src="${esc(d.file.data)}" title="${esc(name)}"></iframe>`;
  }else if(isText){
    try{
      const b64=d.file.data.split(',')[1]||'';
      const txt=decodeURIComponent(escape(atob(b64)));
      body.innerHTML=`<pre></pre>`;
      body.querySelector('pre').textContent=txt;
    }catch(e){
      body.innerHTML=docNoPreview(ext,en);
    }
  }else{
    body.innerHTML=docNoPreview(ext,en);
  }
  document.getElementById('docview-overlay').classList.add('open');
}
function docNoPreview(ext,en){
  const icon=getFileIcon('x.'+ext);
  return `<div class="docview-noprev">
    <div class="dnp-icon">${icon}</div>
    <div class="dnp-title">${en?'Preview not available':'Pré-visualização indisponível'}</div>
    <div class="dnp-text">${en
      ?`Files of type <b>.${esc(ext)}</b> can't be shown in the browser. Download it to open with the right app.`
      :`Ficheiros do tipo <b>.${esc(ext)}</b> não podem ser mostrados no browser. Transfere-o para abrir na app certa.`}</div>
    <button class="btn btn-gold" data-act="downloadDocFromPreview" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      ${en?'Download':'Transferir'}
    </button>
  </div>`;
}
function closeDocPreview(){
  document.getElementById('docview-overlay').classList.remove('open');
  // Libertar o iframe/imagem para não consumir memória
  setTimeout(()=>{const b=document.getElementById('docview-body');if(b&&!document.getElementById('docview-overlay').classList.contains('open'))b.innerHTML='';},250);
  docPreviewId=null;
}
function downloadDocFromPreview(){if(docPreviewId)downloadDoc(docPreviewId);}
function downloadDoc(id){
  const d=documents.find(doc=>doc.id===id);
  if(!d?.file?.data){toast(currentLang==='en'?'No file attached!':'Sem ficheiro anexado!');return;}
  try{
    const a=document.createElement('a');
    a.href=d.file.data;
    a.download=d.file.name;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>document.body.removeChild(a),200);
    toast(currentLang==='en'?'Downloading...':'A transferir...');
  }catch(err){
    toast(currentLang==='en'?'Download failed. Try again.':'Erro no download. Tenta novamente.');
    console.error('Download error:',err);
  }
}

function cardExpiryToDate(mmYY){
  if(!mmYY||!/^\d{2}\/\d{2}$/.test(mmYY))return null;
  const [mm,yy]=mmYY.split('/').map(Number);
  if(mm<1||mm>12)return null;
  // Cartões expiram no último dia do mês indicado
  return new Date(2000+yy,mm,0);
}
let renewalWindow=90;
function setRenewalWindow(days){renewalWindow=days;renderRenewals();}
function renderRenewals(){
  const wrap=document.getElementById('dash-renewals-wrap');
  if(!wrap)return;
  const en=currentLang==='en';
  const title=document.getElementById('dash-renewals-title');
  if(title)title.textContent=en?'📅 Renewals':'📅 Renovações';
  const items=[];
  documents.forEach(d=>{
    if(!d.expiry)return;
    const st=getExpiryStatus(d.expiry);
    if(!st)return;
    items.push({name:d.title||(en?'Document':'Documento'),icon:d.icon||'📄',
      kind:en?'Document':'Documento',date:new Date(d.expiry),iso:d.expiry,status:st,
      go:()=>{switchTab('docs');}});
  });
  bankCards.forEach(cd=>{
    const dt=cardExpiryToDate(cd.expiry);
    if(!dt)return;
    const iso=dt.toISOString().slice(0,10);
    const st=getExpiryStatus(iso);
    if(!st)return;
    items.push({name:cd.name||(en?'Card':'Cartão'),icon:'💳',
      kind:en?'Bank card':'Cartão bancário',date:dt,iso,status:st,
      go:()=>{switchTab('cards');}});
  });
  // Nada com validade em lado nenhum → esconde a secção por completo
  if(!items.length){wrap.style.display='none';return;}
  wrap.style.display='block';
  // Botões de janela temporal
  const windows=[[90,en?'90 days':'90 dias'],[180,en?'6 months':'6 meses'],[365,en?'1 year':'1 ano'],[0,en?'All':'Tudo']];
  const fb=document.getElementById('renewal-filter');
  if(fb)fb.innerHTML=windows.map(([d,lbl])=>`<button class="renewal-filter-btn ${renewalWindow===d?'active':''}" data-act="setRenewalWindow" data-args='[${d}]'>${lbl}</button>`).join('');
  // Filtra pela janela escolhida (0 = tudo)
  const soon=items.filter(i=>renewalWindow===0||i.status.days<=renewalWindow).sort((a,b)=>a.date-b.date);
  if(!soon.length){
    document.getElementById('dash-renewals').innerHTML=`<div class="renewal-empty">${en?`Nothing expiring within this period. Everything is valid further out.`:`Nada a expirar neste período. Está tudo válido para lá disso.`}</div>`;
    return;
  }
  const fmt=dt=>dt.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short',year:'numeric'});
  const humanDur=n=>{
    // Prazos curtos: dias soltos são mais claros que "1 mês 15 dias"
    if(n<60){const dLbl=en?(n===1?'day':'days'):(n===1?'dia':'dias');return `${n} ${dLbl}`;}
    // n em dias → "2 anos 3 meses", "5 meses"
    const years=Math.floor(n/365);
    const rem=n-years*365;
    const months=Math.floor(rem/30);
    const days=rem-months*30;
    const yLbl=en?(years===1?'year':'years'):(years===1?'ano':'anos');
    const mLbl=en?(months===1?'month':'months'):(months===1?'mês':'meses');
    const dLbl=en?(days===1?'day':'days'):(days===1?'dia':'dias');
    if(years>0)return months>0?`${years} ${yLbl} ${months} ${mLbl}`:`${years} ${yLbl}`;
    if(months>0)return days>0?`${months} ${mLbl} ${days} ${dLbl}`:`${months} ${mLbl}`;
    return `${n} ${dLbl}`;
  };
  const whenLabel=st=>{
    const a=Math.abs(st.days);
    if(st.days===0)return en?'today':'hoje';
    if(st.days<0)return en?`${humanDur(a)} ago`:`há ${humanDur(a)}`;
    return en?`in ${humanDur(a)}`:`em ${humanDur(a)}`;
  };
  document.getElementById('dash-renewals').innerHTML=soon.map((i,idx)=>`
    <div class="renewal-row ${i.status.cls}" data-act="_renewalGo" data-args='[${idx}]'>
      <span class="renewal-icon">${i.icon}</span>
      <div class="renewal-body">
        <div class="renewal-name">${esc(i.name)}</div>
        <div class="renewal-meta">${i.kind}</div>
      </div>
      <div class="renewal-when">
        <div class="${i.status.cls}">${whenLabel(i.status)}</div>
        <div class="renewal-date">${fmt(i.date)}</div>
      </div>
    </div>`).join('');
  window._renewalItems=soon;
}
function _renewalGo(idx){
  const it=(window._renewalItems||[])[idx];
  if(it&&it.go)it.go();
}
function getExpiryStatus(expiry){
  if(!expiry)return null;
  const exp=new Date(expiry);const now=new Date();
  const days=Math.floor((exp-now)/86400000);
  if(days<0)return{cls:'expired',label:currentLang==='en'?'Expired':'Expirado',days};
  if(days<=60)return{cls:'soon',label:currentLang==='en'?`Expires in ${days}d`:`Expira em ${days}d`,days};
  return{cls:'ok',label:currentLang==='en'?`Valid ${days}d`:`Válido ${days}d`,days};
}

function renderDocs(){
  // Filter buttons
  const filterRow=document.getElementById('docs-filter-row');
  const allCats=['all',...Object.keys(DOC_CATS)];
  const scope=documents.filter(d=>!d.archived&&(d.folderId||null)===(currentFolderId||null));
  const catCount={};scope.forEach(d=>{catCount[d.cat]=(catCount[d.cat]||0)+1;});
  filterRow.innerHTML=allCats.map(cat=>{
    const count=cat==='all'?scope.length:(catCount[cat]||0);
    if(cat!=='all'&&count===0)return '';
    const label=cat==='all'?(currentLang==='en'?'All':'Todas'):getDocCatLabel(cat);
    return `<button class="doc-filter-btn${currentDocFilter===cat?' active':''}" data-act="setDocFilter" data-arg="${esc(cat)}">${cat==='all'?'📁 ':''}${label} (${count})</button>`;
  }).join('');

  // Breadcrumb
  const en=currentLang==='en';
  const bc=document.getElementById('docs-breadcrumb');
  if(bc){
    const path=folderPath(currentFolderId);
    let html=`<button class="crumb${currentFolderId?'':' current'}" ${currentFolderId?'data-act="goToFolder" data-null':''}>🏠 ${en?'Documents':'Documentos'}</button>`;
    path.forEach((f,i)=>{
      const isLast=i===path.length-1;
      html+=`<span class="crumb-sep">/</span><button class="crumb${isLast?' current':''}" ${isLast?'':`data-act="goToFolder" data-arg="${esc(f.id)}"`}>${f.icon||'📁'} ${esc(f.name)}</button>`;
    });
    if(currentFolderId){
      const cf=folderById(currentFolderId);
      html+=`<span style="margin-left:auto;display:flex;gap:5px">
        <button class="card-btn" data-act="openFolderModal" data-arg="${esc(currentFolderId)}" title="${en?'Rename':'Renomear'}">✏️</button>
        <button class="card-btn danger" data-act="deleteFolder" data-arg="${esc(currentFolderId)}" title="${en?'Delete folder':'Apagar pasta'}">🗑️</button>
      </span>`;
    }
    bc.innerHTML=html;
  }
  const nfTxt=document.getElementById('docs-newfolder-txt');
  if(nfTxt)nfTxt.textContent=en?'New folder':'Nova pasta';

  const grid=document.getElementById('docs-grid');
  const inFolder=documents.filter(d=>!d.archived&&(d.folderId||null)===(currentFolderId||null));
  const filtered2=currentDocFilter==='all'?inFolder:inFolder.filter(d=>d.cat===currentDocFilter);
  const filtered=filtered2.filter(d=>{
    if(currentDocValidityFilter==='all')return true;
    const status=getExpiryStatus(d.expiry);
    if(currentDocValidityFilter==='expired')return status?.cls==='expired';
    if(currentDocValidityFilter==='expiring')return status?.cls==='soon';
    if(currentDocValidityFilter==='ok')return status?.cls==='ok';
    if(currentDocValidityFilter==='noexpiry')return !d.expiry;
    return true;
  });
  const sortSel=document.getElementById('doc-sort');
  if(sortSel){
    const opts=[
      ['added',currentLang==='en'?'📅 Recent':'📅 Recentes'],
      ['name',currentLang==='en'?'🔤 Name A-Z':'🔤 Nome A-Z'],
      ['date',currentLang==='en'?'📆 Doc date':'📆 Data doc'],
      ['expiry',currentLang==='en'?'⏰ Expiry first':'⏰ Validade']
    ];
    sortSel.innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    sortSel.value=currentDocSort;
  }
  filtered.sort((a,b)=>{
    if(currentDocSort==='name')return (a.title||'').localeCompare(b.title||'');
    if(currentDocSort==='date')return (b.date||'').localeCompare(a.date||'');
    if(currentDocSort==='expiry'){
      if(!a.expiry&&!b.expiry)return 0;
      if(!a.expiry)return 1;
      if(!b.expiry)return -1;
      return a.expiry.localeCompare(b.expiry);
    }
    return (b.createdAt||0)-(a.createdAt||0);
  });

  // Subpastas da pasta atual
  const subFolders=docFolders.filter(f=>(f.parentId||null)===(currentFolderId||null))
    .sort((a,b)=>a.name.localeCompare(b.name));
  const foldersHtml=subFolders.map(f=>{
    const cnt=folderDirectCounts(f.id,docFolders,documents);
    const parts=[];
    if(cnt.folders)parts.push(`${cnt.folders} ${en?(cnt.folders===1?'folder':'folders'):(cnt.folders===1?'pasta':'pastas')}`);
    parts.push(`${cnt.docs} ${en?(cnt.docs===1?'doc':'docs'):(cnt.docs===1?'doc':'docs')}`);
    return `<div class="folder-card" data-act="openFolder" data-arg="${esc(f.id)}" title="${esc(f.name)}">
      <div class="folder-icon">${f.icon||'📁'}</div>
      <div class="folder-info">
        <div class="folder-name">${esc(f.name)}</div>
        <div class="folder-count">${parts.join(' · ')}</div>
      </div>
      <div class="folder-menu">
        <button class="card-btn" data-act="openFolderModal" data-arg="${esc(f.id)}" data-stop title="${en?'Rename':'Renomear'}">✏️</button>
        <button class="card-btn danger" data-act="deleteFolder" data-arg="${esc(f.id)}" data-stop title="${en?'Delete':'Apagar'}">🗑️</button>
      </div>
    </div>`;
  }).join('');

  if(!filtered.length&&!subFolders.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>${currentFolderId
        ?(en?'This folder is empty. Add documents or create a subfolder.':'Esta pasta está vazia. Adiciona documentos ou cria uma subpasta.')
        :(en?'No documents yet.':'Ainda não tens documentos.')}</p>
    </div>`;
    return;
  }

  grid.innerHTML=foldersHtml+filtered.map(doc=>{
    const expStatus=getExpiryStatus(doc.expiry);
    const catInfo=DOC_CATS[doc.cat]||{icon:'📋'};
    const fileIcon=getDocAutoIcon(doc);
    return `<div class="doc-card">
      <div class="doc-card-top">
        <div class="doc-file-icon">${fileIcon}</div>
        <div class="doc-card-info">
          <div class="doc-card-title">${esc(doc.title)}</div>
          <div class="doc-card-cat">${catInfo.icon} ${getDocCatLabel(doc.cat)}</div>
          ${doc.desc?`<div class="doc-card-desc">${esc(doc.desc)}</div>`:''}
        </div>
      </div>
      <div class="doc-card-meta">
        ${doc.date?`<span>📅 ${esc(doc.date)}</span>`:''}
        ${doc.file?`<span>📎 ${esc(doc.file.name)} (${formatFileSize(doc.file.size)})</span>`:`<span style="color:var(--text-muted);font-style:italic">${currentLang==='en'?'No file':'Sem ficheiro'}</span>`}
        ${expStatus?`<span class="doc-expiry-badge ${expStatus.cls}">⏰ ${expStatus.label}</span>`:''}
      </div>
      <div class="card-actions">
        ${doc.file?`<button class="card-btn" data-act="previewDoc" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${currentLang==='en'?'View':'Ver'}
        </button>
        <button class="card-btn" data-act="downloadDoc" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          ${currentLang==='en'?'Download':'Transferir'}
        </button>`:''}
        <button class="card-btn" data-act="openMoveModal" data-arg="${esc(doc.id)}" data-stop>
          📂 ${currentLang==='en'?'Move':'Mover'}
        </button>
        <button class="card-btn" data-act="openDocModal" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          ${t('btnEdit')}
        </button>
        <button class="card-btn" data-act="archiveDoc" data-arg="${esc(doc.id)}" data-stop><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg> ${t('btnArchive')}</button>
        <button class="card-btn danger" data-act="deleteDoc" data-arg="${esc(doc.id)}" data-stop>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          ${t('btnDel')}
        </button>
      </div>
    </div>`;
  }).join('');
}
function setDocFilter(cat){currentDocFilter=cat;renderDocs();}

// ══ CARTÕES DE LOJA ══
const STORE_PRESETS=['Continente','Pingo Doce','Recheio','Auchan','Lidl','Intermarché','Worten','FNAC','Farmácia','El Corte Inglés','IKEA','Decathlon'];
// Code128B — tabela de padrões (cada valor = larguras de barras/espaços)
const C128B_PAT=['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
function code128B(text){
  // Devolve string de larguras. Start B=104, checksum, stop=106.
  let sum=104,codes=[104];
  for(let i=0;i<text.length;i++){
    const v=text.charCodeAt(i)-32;
    if(v<0||v>94)continue;
    codes.push(v);sum+=v*(i+1);
  }
  codes.push(sum%103);
  codes.push(106);
  return codes.map(cd=>C128B_PAT[cd]).join('');
}
function barcodeSVG(text){
  const clean=String(text).replace(/[^\x20-\x7E]/g,'');
  if(!clean)return '';
  const widths=code128B(clean);
  let x=0,rects='',bar=true;
  for(const w of widths){
    const width=parseInt(w,10);
    if(bar)rects+=`<rect x="${x}" y="0" width="${width}" height="100" fill="#000"/>`;
    x+=width;bar=!bar;
  }
  return `<svg viewBox="0 0 ${x} 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${rects}</svg>`;
}
function renderStoreCards(){
  const en=currentLang==='en';
  const box=document.getElementById('store-content');
  if(!box)return;
  // Cabeçalho da aba
  const tt=document.getElementById('store-tab-title');if(tt)tt.textContent=en?'Store Cards':'Cartões de Loja';
  const ta=document.getElementById('store-tab-add-txt');if(ta)ta.textContent=en?'Add card':'Adicionar cartão';
  const ti=document.getElementById('store-tab-intro');if(ti)ti.textContent=en?'Your loyalty cards — show the barcode at checkout without carrying the plastic.':'Os teus cartões de fidelização — mostra o código de barras na caixa sem andar com o plástico.';
  let html='';
  if(!storeCards.length){
    html+=`<div class="av-empty" style="text-align:center;padding:26px 16px;color:var(--text-muted);font-size:.74rem;line-height:1.7">${en?'No store cards yet. Add your Continente, Pingo Doce… and show the barcode at checkout.':'Sem cartões de loja. Adiciona o Continente, Pingo Doce… e mostra o código de barras na caixa.'}</div>`;
    box.innerHTML=html;return;
  }
  html+=`<div class="store-list">`+storeCards.map(sc=>{
    return `<div class="store-card" style="border-color:${sc.color||'var(--accent-dim)'}">
      <div class="store-card-head">
        <span class="store-card-name" style="color:${sc.color||'var(--accent)'}">${esc(sc.name||'')}</span>
        <div class="store-card-actions">
          <button class="card-btn" data-act="showBarcode" data-arg="${esc(sc.id)}" title="${en?'Show barcode':'Mostrar código'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14"/></svg></button>
          <button class="card-btn" data-act="editStoreCard" data-arg="${esc(sc.id)}" title="${en?'Edit':'Editar'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="card-btn danger" data-act="deleteStoreCard" data-arg="${esc(sc.id)}" title="${en?'Delete':'Apagar'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
        </div>
      </div>
      <div class="store-card-num" data-act="showBarcode" data-arg="${esc(sc.id)}">${esc(sc.number||'')}</div>
      <button class="store-show-btn" data-act="showBarcode" data-arg="${esc(sc.id)}">📷 ${en?'Show at checkout':'Mostrar na caixa'}</button>
    </div>`;
  }).join('')+`</div>`;
  box.innerHTML=html;
}
function openStoreModal(){
  editingStoreId=null;
  const en=currentLang==='en';
  document.getElementById('store-modal-title').textContent=en?'Add store card':'Adicionar cartão';
  document.getElementById('sc-name').value='';
  document.getElementById('sc-number').value='';
  selectedStoreColor='#c9a84c';
  renderStorePresets();renderStoreColors();
  document.getElementById('store-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('sc-name').focus(),50);
}
function editStoreCard(id){
  const sc=storeCards.find(x=>x.id===id);if(!sc)return;
  editingStoreId=id;
  const en=currentLang==='en';
  document.getElementById('store-modal-title').textContent=en?'Edit store card':'Editar cartão';
  document.getElementById('sc-name').value=sc.name||'';
  document.getElementById('sc-number').value=sc.number||'';
  selectedStoreColor=sc.color||'#c9a84c';
  renderStorePresets();renderStoreColors();
  document.getElementById('store-overlay').classList.add('open');
}
function renderStorePresets(){
  const box=document.getElementById('sc-presets');
  if(box)box.innerHTML=STORE_PRESETS.map(p=>`<button type="button" class="im-preset" data-act="fillField" data-arg="sc-name" data-arg2="${esc(p)}">${p}</button>`).join('');
}
let selectedStoreColor='#c9a84c';
function renderStoreColors(){
  const cols=['#c9a84c','#e05252','#4caf82','#5b8def','#a970d0','#e0982a','#e0609f','#54c0c0'];
  const box=document.getElementById('sc-colors');
  if(box)box.innerHTML=cols.map(col=>`<button type="button" class="sub-color-pick${col===selectedStoreColor?' on':''}" style="background:${col}" data-act="pickStoreColor" data-arg="${esc(col)}"></button>`).join('');
}
function saveStoreCard(){
  const en=currentLang==='en';
  const name=document.getElementById('sc-name').value.trim();
  const number=document.getElementById('sc-number').value.trim();
  if(!name){toast(en?'Name it!':'Dá-lhe um nome!');return;}
  if(!number){toast(en?'Enter the card number!':'Introduz o número do cartão!');return;}
  const obj={id:editingStoreId||Date.now().toString(36),name,number,color:selectedStoreColor};
  if(editingStoreId){const i=storeCards.findIndex(x=>x.id===editingStoreId);if(i>=0)storeCards[i]=obj;logActivity('edit',name,'🎟️');}
  else{storeCards.push(obj);logActivity('add',name,'🎟️');}
  closeStoreModal();renderStoreCards();updateWalletTiles();markUnsaved();
  toast(en?'Saved!':'Guardado!');
}
function closeStoreModal(){document.getElementById('store-overlay').classList.remove('open');}
function deleteStoreCard(id){
  const en=currentLang==='en';
  const sc=storeCards.find(x=>x.id===id);if(!sc)return;
  if(!confirm(en?`Delete "${sc.name}"?`:`Apagar "${sc.name}"?`))return;
  storeCards=storeCards.filter(x=>x.id!==id);
  logActivity('delete',sc.name,'🗑️');
  renderStoreCards();updateWalletTiles();markUnsaved();
  toast(en?'Deleted':'Apagado');
}
function showBarcode(id){
  const sc=storeCards.find(x=>x.id===id);if(!sc)return;
  const en=currentLang==='en';
  document.getElementById('barcode-name').textContent=sc.name||'';
  document.getElementById('barcode-svg').innerHTML=barcodeSVG(sc.number||'');
  document.getElementById('barcode-number').textContent=sc.number||'';
  document.getElementById('barcode-hint').textContent=en?'Show this to the cashier':'Mostra isto ao operador de caixa';
  document.getElementById('barcode-overlay').classList.add('open');
}
function closeBarcode(){document.getElementById('barcode-overlay').classList.remove('open');}

// ══ ECRÃS CARTEIRA (abrir/fechar) ══
function renderGreeting(){
  const box=document.getElementById('dash-greeting');
  if(!box)return;
  const en=currentLang==='en';
  const h=new Date().getHours();
  let period,ico;
  if(h<6){period=en?'Good night':'Boa noite';ico='🌙';}
  else if(h<12){period=en?'Good morning':'Bom dia';ico='☀️';}
  else if(h<20){period=en?'Good afternoon':'Boa tarde';ico='🌤️';}
  else{period=en?'Good evening':'Boa noite';ico='🌙';}
  const name=(vaultName||'').trim();
  const greet=name?`${period}, ${esc(name)}`:period;
  const active=vault.filter(e=>!e.archived).length;
  const itemsTxt=en?`${active} ${active===1?'entry':'entries'} protected`:`${active} ${active===1?'entrada protegida':'entradas protegidas'}`;
  const now=new Date();
  const dateStr=now.toLocaleDateString(en?'en-GB':'pt-PT',{weekday:'long',day:'numeric',month:'long'});
  const spark='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/></svg>';
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  box.innerHTML=`
    <div class="dash-greet-left">
      <div class="dash-greeting-main">
        <span class="dash-greeting-ico">${ico}</span>
        <span class="dash-greeting-text">${greet}</span>
      </div>
      <div class="dash-greeting-sub">${dateStr.charAt(0).toUpperCase()+dateStr.slice(1)} · ${itemsTxt}</div>
    </div>
    <div class="aur-launch aur-ring" role="button" tabindex="0" title="Aurora AI" data-act="auroraOpen" data-keydown="aurLaunchKey" data-ev>
      <div class="aur-launch-in">
        <span class="aur-launch-ico">${spark}</span>
        <span class="aur-launch-txt"><b>Aurora AI</b> · <span id="aur-launch-ph">${en?'How can I help?':'Em que posso ajudar?'}</span><span class="aur-caret"></span></span>
        <span class="aur-launch-go">${arrow}</span>
      </div>
    </div>`;
}
function renderSubsSection(){
  const en=currentLang==='en';
  const box=document.getElementById('dash-subs-section');
  if(!box)return;
  const totalM=subscriptions.reduce((a,s)=>a+subMonthly(s),0);
  const totalY=totalM*12;
  if(!subscriptions.length){
    box.innerHTML=`
      <div class="subs-sec-head">
        <div class="subs-sec-titlewrap"><span class="subs-sec-ico">💸</span><span class="subs-sec-title">${en?'Subscriptions':'Subscrições'}</span></div>
        <button class="subs-sec-add" data-act="openSubsScreen">＋ ${en?'Add':'Adicionar'}</button>
      </div>
      <div class="subs-sec-empty">${en?'Track what you spend each month on Netflix, gym, insurance…':'Controla o que gastas por mês na Netflix, ginásio, seguros…'}</div>`;
    return;
  }
  // Ordenar por próxima cobrança
  const withNext=subscriptions.map(s=>({s,next:subNextCharge(s)})).sort((a,b)=>{
    if(!a.next)return 1;if(!b.next)return -1;return a.next-b.next;
  });
  const chips=withNext.map(({s,next})=>{
    const m=subMonthly(s);
    const nextTxt=next?next.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short'}):'—';
    const daysLeft=next?Math.ceil((next-new Date().setHours(0,0,0,0))/86400000):null;
    const soon=daysLeft!==null&&daysLeft<=7;
    return `<button class="sub-chip" data-act="openSubsScreen" title="${esc(s.name)} · ${fmtMoney(m)}${en?'/mo':'/mês'}">
      <span class="sub-chip-dot" style="background:${s.color||'var(--accent)'}"></span>
      <span class="sub-chip-name">${esc(s.name||'')}</span>
      <span class="sub-chip-price">${fmtMoney(m)}<span>${en?'/mo':'/mês'}</span></span>
      <span class="sub-chip-next ${soon?'soon':''}">${en?'renews':'renova'} ${nextTxt}</span>
    </button>`;
  }).join('');
  const open=subsSectionOpen();
  const nxt=withNext.find(x=>x.next);
  const nxtDays=nxt?Math.ceil((nxt.next-new Date().setHours(0,0,0,0))/86400000):null;
  const nxtSoon=nxtDays!==null&&nxtDays<=7;
  const nxtRel=nxt?(nxtDays<=0?(en?'today':'hoje'):nxtDays===1?(en?'tomorrow':'amanhã'):(en?'in '+nxtDays+' days':'em '+nxtDays+' dias')):'';
  box.innerHTML=`
    <div class="subs-sec-head">
      <div class="subs-sec-titlewrap"><span class="subs-sec-ico">💸</span><span class="subs-sec-title">${en?'Subscriptions':'Subscrições'}</span></div>
      <button class="subs-sec-add" data-act="openSubsScreen">${en?'Manage':'Gerir'} →</button>
    </div>
    <div class="subs-sec-totals">
      <div class="subs-sec-total"><span class="subs-sec-total-num">${fmtMoney(totalM)}</span><span class="subs-sec-total-lbl">${en?'per month':'por mês'}</span></div>
      <div class="subs-sec-total dim"><span class="subs-sec-total-num">${fmtMoney(totalY)}</span><span class="subs-sec-total-lbl">${en?'per year':'por ano'}</span></div>
      <div class="subs-sec-count">${subscriptions.length} ${en?(subscriptions.length===1?'service':'services'):(subscriptions.length===1?'serviço':'serviços')}</div>
    </div>
    <button class="subs-sec-toggle ${open?'open':''}" data-act="toggleSubsSection" aria-expanded="${open}">
      <span class="subs-sec-toggle-lbl">${en?(open?'Hide subscriptions':'Show subscriptions'):(open?'Esconder subscrições':'Ver subscrições')}</span>
      <span class="subs-sec-next">${nxt?`${en?'Next':'Próxima'}: <b>${esc(nxt.s.name||'')}</b> · <span class="${nxtSoon?'soon':''}">${nxtRel}</span>`:''}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="subs-sec-collapse ${open?'open':''}"><div><div class="subs-sec-chips">${chips}</div></div></div>`;
}

// ══ BARRA COMPACTA NO TELEMÓVEL (v9.62) ══
function tbToggleSearch(){
  const tb=document.querySelector('.topbar');if(!tb)return;
  const on=!tb.classList.contains('m-search');
  if(!on&&typeof closeGlobalSearch==='function')closeGlobalSearch();
  tb.classList.toggle('m-search',on);const b=document.getElementById('tb-search-btn');if(b)b.classList.toggle('on',on);
  if(on){tbCloseMore();setTimeout(()=>{const i=document.getElementById('search-input');if(i)i.focus();},60);}
}
// Opção do menu «⋯»: fecha o menu e só depois faz a ação; o clique não segue (senão outro menu que a ação abra fechava logo)
function tbMenuAttrs(call){
  const m=/^(\w+)\((.*)\)$/.exec(call),args=m[2]?[m[2].replace(/^'|'$/g,'')]:[];
  return 'data-act="tbMenuRun" data-stop data-args=\''+esc(JSON.stringify([m[1],...args]))+'\'';
}
function tbMenuRun(name,...args){tbCloseMore();const fn=avFn(name);if(fn)fn(...args);}
function tbCloseMore(){const m=document.getElementById('tb-more-menu'),b=document.getElementById('tb-more-btn');if(m)m.classList.remove('open');if(b){b.classList.remove('on');b.setAttribute('aria-expanded','false');}}
function tbToggleMore(ev){
  if(ev)ev.stopPropagation();
  const m=document.getElementById('tb-more-menu'),b=document.getElementById('tb-more-btn');if(!m)return;
  if(m.classList.contains('open'))return tbCloseMore();
  const en=currentLang==='en';
  const I=(p)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
  const item=(fn,ico,lbl,sub)=>'<button class="tbm-item" role="menuitem" '+tbMenuAttrs(fn)+'>'+ico+'<span>'+lbl+(sub?'<small>'+sub+'</small>':'')+'</span></button>';
  let driveOnNow=false;try{driveOnNow=typeof driveOn==='function'&&driveOn();}catch(e){}
  const chip=document.getElementById('drive-chip');const chipTxt=chip&&chip.textContent?chip.textContent.trim():'';
  let h=avMoreTop(item,I,en)+item('openCalendar()',I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),en?'Calendar':'Calendário','');
  if(driveOnNow)h+=item('driveSyncNow()',I('<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>'),en?'Sync now':'Sincronizar agora',chipTxt||'Google Drive');
  h+=avMoreMid(item,I,en);
  h+=item('openSettings()',I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),en?'Settings':'Definições','');
  if(typeof auroraOpen==='function')h+=item('auroraOpen()',I('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>'),'Aurora AI',en?'Your offline assistant':'A tua assistente offline');
  h+='<div class="tbm-sep"></div><div class="tbm-lang"><span>'+(en?'Language':'Idioma')+'</span><div class="tbm-seg"><button class="'+(en?'':'on')+'" '+tbMenuAttrs("setLang('pt')")+'>PT</button><button class="'+(en?'on':'')+'" '+tbMenuAttrs("setLang('en')")+'>ENG</button></div></div>';
  m.innerHTML=h;m.classList.add('open');if(b){b.classList.add('on');b.setAttribute('aria-expanded','true');}
}
// fecha ao clicar fora do menu (ou numa das opções); cliques no espaço vazio do menu não o fecham
document.addEventListener('click',e=>{const m=document.getElementById('tb-more-menu');if(m&&m.contains(e.target)&&!(e.target.closest&&e.target.closest('button')))return;tbCloseMore();});
(function(){const m=document.getElementById('tb-more-menu'),tb=document.querySelector('.topbar');if(m&&tb&&m.parentElement!==tb)tb.appendChild(m);})();
document.addEventListener('keydown',e=>{if(e.key==='Escape')tbCloseMore();});
(function(){const si=document.getElementById('search-input');if(!si)return;si.addEventListener('blur',()=>setTimeout(()=>{const tb=document.querySelector('.topbar');if(tb&&tb.classList.contains('m-search')&&!si.value.trim()){tb.classList.remove('m-search');const b=document.getElementById('tb-search-btn');if(b)b.classList.remove('on');}},180));})();
// ══ SUBSCRIÇÕES RECOLHÍVEIS (v9.62) ══
function subsSectionOpen(){try{return localStorage.getItem('av_subs_open')==='1';}catch(e){return false;}}
function toggleSubsSection(){
  const o=!subsSectionOpen();try{localStorage.setItem('av_subs_open',o?'1':'0');}catch(e){}
  const box=document.getElementById('dash-subs-section');if(!box)return;
  const c=box.querySelector('.subs-sec-collapse'),t=box.querySelector('.subs-sec-toggle');
  if(c)c.classList.toggle('open',o);
  if(t){t.classList.toggle('open',o);t.setAttribute('aria-expanded',o?'true':'false');const l=t.querySelector('.subs-sec-toggle-lbl');if(l)l.textContent=currentLang==='en'?(o?'Hide subscriptions':'Show subscriptions'):(o?'Esconder subscrições':'Ver subscrições');}
}
function openSubsScreen(){
  const en=currentLang==='en';
  document.getElementById('subsscreen-title').textContent=en?'💸 Subscriptions':'💸 Subscrições';
  renderSubs();
  document.getElementById('subsscreen-overlay').classList.add('open');
}
function closeSubsScreen(){document.getElementById('subsscreen-overlay').classList.remove('open');}

// ══ SUBSCRIÇÕES ══
const SUB_PRESETS=['Netflix','Spotify','Disney+','HBO Max','Amazon Prime','YouTube Premium','iCloud','Google One','Ginásio','Seguro Auto','Seguro Saúde','PlayStation Plus','Xbox Game Pass'];
function subMonthly(s){
  // Devolve o custo mensal equivalente (anuais divididos por 12)
  const v=parseFloat(s.amount)||0;
  return s.cycle==='yearly'?v/12:v;
}
function fmtMoney(v){
  return '€'+(Math.round(v*100)/100).toFixed(2).replace('.',',');
}
function subNextCharge(s){
  // Calcula a próxima data de cobrança a partir do dia (mensal) ou data (anual)
  const now=new Date();now.setHours(0,0,0,0);
  if(s.cycle==='yearly'){
    if(!s.renewDate)return null;
    let d=new Date(s.renewDate);
    while(d<now)d.setFullYear(d.getFullYear()+1);
    return d;
  }else{
    const day=parseInt(s.renewDay,10);
    if(!day||day<1||day>31)return null;
    let d=new Date(now.getFullYear(),now.getMonth(),Math.min(day,new Date(now.getFullYear(),now.getMonth()+1,0).getDate()));
    if(d<now)d=new Date(now.getFullYear(),now.getMonth()+1,Math.min(day,new Date(now.getFullYear(),now.getMonth()+2,0).getDate()));
    return d;
  }
}
function renderSubs(){
  const en=currentLang==='en';
  const box=document.getElementById('subs-content');
  const badge=document.getElementById('subs-badge');
  if(!box)return;
  const totalM=subscriptions.reduce((a,s)=>a+subMonthly(s),0);
  const totalY=totalM*12;
  if(badge){badge.textContent=subscriptions.length?fmtMoney(totalM)+(en?'/mo':'/mês'):'';badge.className='dcard-badge'+(subscriptions.length?'':' ');}
  let html=`<div class="subs-head">
    <button class="btn btn-gold" data-act="openSubModal" style="display:inline-flex;align-items:center;gap:5px;padding:8px 15px;font-size:.56rem;letter-spacing:2px">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ${en?'Add subscription':'Adicionar subscrição'}
    </button>
  </div>`;
  if(!subscriptions.length){
    html+=`<div style="text-align:center;padding:26px 16px;color:var(--text-muted);font-size:.74rem;line-height:1.7">${en?'No subscriptions yet. Add Netflix, gym, insurance… and see how much you spend per month.':'Sem subscrições. Adiciona a Netflix, ginásio, seguro… e vê quanto gastas por mês.'}</div>`;
    box.innerHTML=html;return;
  }
  html+=`<div class="subs-totals">
    <div class="subs-total-box"><div class="subs-total-num">${fmtMoney(totalM)}</div><div class="subs-total-lbl">${en?'per month':'por mês'}</div></div>
    <div class="subs-total-box"><div class="subs-total-num">${fmtMoney(totalY)}</div><div class="subs-total-lbl">${en?'per year':'por ano'}</div></div>
  </div>`;
  // Ordenar por próxima cobrança
  const withNext=subscriptions.map(s=>({s,next:subNextCharge(s)})).sort((a,b)=>{
    if(!a.next)return 1;if(!b.next)return -1;return a.next-b.next;
  });
  html+=`<div class="subs-list">`+withNext.map(({s,next})=>{
    const m=subMonthly(s);
    const nextTxt=next?next.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short'}):'—';
    const cycleTxt=s.cycle==='yearly'?(en?'yearly':'anual'):(en?'monthly':'mensal');
    const daysLeft=next?Math.ceil((next-new Date().setHours(0,0,0,0))/86400000):null;
    const soon=daysLeft!==null&&daysLeft<=7;
    return `<div class="sub-row">
      <div class="sub-color" style="background:${s.color||'var(--accent)'}"></div>
      <div style="flex:1;min-width:0">
        <div class="sub-name">${esc(s.name||'')}</div>
        <div class="sub-meta">${fmtMoney(parseFloat(s.amount)||0)} · ${cycleTxt} · <span class="${soon?'sub-soon':''}">${en?'next':'próx.'} ${nextTxt}</span></div>
      </div>
      <div class="sub-monthly">${fmtMoney(m)}<span>${en?'/mo':'/mês'}</span></div>
      <div class="sub-actions">
        <button class="card-btn" data-act="editSub" data-arg="${esc(s.id)}" title="${en?'Edit':'Editar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="card-btn danger" data-act="deleteSub" data-arg="${esc(s.id)}" title="${en?'Delete':'Apagar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
      </div>
    </div>`;
  }).join('')+`</div>`;
  box.innerHTML=html;
}
function openSubModal(){
  editingSubId=null;
  const en=currentLang==='en';
  document.getElementById('sub-modal-title').textContent=en?'Add subscription':'Adicionar subscrição';
  document.getElementById('sub-name').value='';
  document.getElementById('sub-amount').value='';
  document.getElementById('sub-cycle').value='monthly';
  document.getElementById('sub-renew-day').value='1';
  document.getElementById('sub-renew-date').value='';
  selectedSubColor='#c9a84c';
  renderSubPresets();renderSubColors();updateSubCycleUI();
  document.getElementById('sub-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('sub-name').focus(),50);
}
function editSub(id){
  const s=subscriptions.find(x=>x.id===id);if(!s)return;
  editingSubId=id;
  const en=currentLang==='en';
  document.getElementById('sub-modal-title').textContent=en?'Edit subscription':'Editar subscrição';
  document.getElementById('sub-name').value=s.name||'';
  document.getElementById('sub-amount').value=s.amount||'';
  document.getElementById('sub-cycle').value=s.cycle||'monthly';
  document.getElementById('sub-renew-day').value=s.renewDay||'1';
  document.getElementById('sub-renew-date').value=s.renewDate||'';
  selectedSubColor=s.color||'#c9a84c';
  renderSubPresets();renderSubColors();updateSubCycleUI();
  document.getElementById('sub-overlay').classList.add('open');
}
function updateSubCycleUI(){
  const cycle=document.getElementById('sub-cycle').value;
  document.getElementById('sub-day-row').style.display=cycle==='monthly'?'block':'none';
  document.getElementById('sub-date-row').style.display=cycle==='yearly'?'block':'none';
}
function renderSubPresets(){
  const box=document.getElementById('sub-presets');
  if(box)box.innerHTML=SUB_PRESETS.map(p=>`<button type="button" class="im-preset" data-act="fillField" data-arg="sub-name" data-arg2="${esc(p)}">${p}</button>`).join('');
}
let selectedSubColor='#c9a84c';
function renderSubColors(){
  const cols=['#c9a84c','#e05252','#4caf82','#5b8def','#a970d0','#e0982a','#e0609f','#54c0c0'];
  const box=document.getElementById('sub-colors');
  if(box)box.innerHTML=cols.map(col=>`<button type="button" class="sub-color-pick${col===selectedSubColor?' on':''}" style="background:${col}" data-act="pickSubColor" data-arg="${esc(col)}"></button>`).join('');
}
function saveSub(){
  const en=currentLang==='en';
  const name=document.getElementById('sub-name').value.trim();
  const amount=parseFloat(document.getElementById('sub-amount').value);
  if(!name){toast(en?'Name it!':'Dá-lhe um nome!');return;}
  if(isNaN(amount)||amount<0){toast(en?'Enter a valid amount!':'Valor inválido!');return;}
  const cycle=document.getElementById('sub-cycle').value;
  const obj={
    id:editingSubId||Date.now().toString(36),
    name,amount,cycle,color:selectedSubColor,
    renewDay:cycle==='monthly'?document.getElementById('sub-renew-day').value:null,
    renewDate:cycle==='yearly'?document.getElementById('sub-renew-date').value:null,
  };
  if(editingSubId){const i=subscriptions.findIndex(x=>x.id===editingSubId);if(i>=0)subscriptions[i]=obj;logActivity('edit',name,'💸');}
  else{subscriptions.push(obj);logActivity('add',name,'💸');}
  closeSubModal();renderSubs();renderSubsSection();renderRenewals();markUnsaved();
  toast(en?'Saved!':'Guardado!');
}
function closeSubModal(){document.getElementById('sub-overlay').classList.remove('open');}
function deleteSub(id){
  const en=currentLang==='en';
  const s=subscriptions.find(x=>x.id===id);if(!s)return;
  if(!confirm(en?`Delete "${s.name}"?`:`Apagar "${s.name}"?`))return;
  subscriptions=subscriptions.filter(x=>x.id!==id);
  logActivity('delete',s.name,'🗑️');
  renderSubs();renderSubsSection();renderRenewals();markUnsaved();
  toast(en?'Deleted':'Apagado');
}

// ══ INFORMAÇÃO PESSOAL RÁPIDA ══
const INFO_PRESETS_PT=['NIF','Cartão de Cidadão','IBAN','NIB','Matrícula','Nº de Utente (SNS)','Nº Segurança Social','Nº de Sócio','Passaporte','Carta de Condução','Validade do CC'];
const INFO_PRESETS_EN=['Tax ID','ID Card','IBAN','Bank Nº','Car Plate','Health Number','Social Security','Member Nº','Passport','Driving Licence'];

// personalInfo agora é uma lista de PESSOAS: {id, name, fields:[{id,label,value,sensitive}]}
// Compatibilidade: se vier do formato antigo (lista de campos soltos), migra para uma pessoa "Geral".
function migrateInfoIfNeeded(){
  if(!Array.isArray(personalInfo))personalInfo=[];
  if(personalInfo.length && personalInfo[0] && personalInfo[0].value!==undefined && personalInfo[0].fields===undefined){
    // formato antigo → agrupar tudo numa pessoa
    const old=personalInfo.slice();
    personalInfo=[{id:Date.now().toString(36),name:currentLang==='en'?'General':'Geral',fields:old.map(f=>({id:f.id,label:f.label,value:f.value,sensitive:f.sensitive}))}];
  }
}

let editingPersonId=null;      // pessoa a que se adiciona/edita campo
let editingInfoFieldId=null;   // campo em edição

function renderInfo(){
  migrateInfoIfNeeded();
  const en=currentLang==='en';
  const intro=document.getElementById('info-intro');
  if(intro)intro.textContent=en
    ?'Everyday details for you and your family, one tap away. Group them by person — each with their own tax ID, ID card, IBAN… Stored encrypted, like everything else.'
    :'Os dados do dia-a-dia teus e da família, a um toque. Organizados por pessoa — cada uma com o seu NIF, cartão de cidadão, IBAN… Guardado encriptado, como tudo o resto.';
  document.getElementById('info-title').textContent=en?'Personal Info':'Informação Pessoal';
  document.getElementById('info-add-txt').textContent=en?'New person':'Nova pessoa';
  const grid=document.getElementById('info-grid');
  if(!personalInfo.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <p>${en?'No one added yet. Tap "New person" to create a profile (you, your family…) and store their details.':'Ninguém ainda. Toca em "Nova pessoa" para criar um perfil (tu, a família…) e guardar os dados.'}</p>
    </div>`;
    return;
  }
  grid.innerHTML=personalInfo.map(person=>{
    const fields=(person.fields||[]).map(f=>{
      const val=esc(f.value||'');
      const masked=f.sensitive?`<span class="info-val masked" id="infoval-${f.id}" data-real="${val}">••••••••</span>`:`<span class="info-val" id="infoval-${f.id}">${val}</span>`;
      return `<div class="info-field">
        <div class="info-field-head">
          <span class="info-label">${esc(f.label||'')}</span>
          <div class="info-field-actions">
            ${f.sensitive?`<button class="card-btn" data-act="toggleInfoMask" data-arg="${esc(f.id)}" title="${en?'Show/Hide':'Mostrar/Ocultar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>`:''}
            <button class="card-btn" data-act="copyInfoField" data-arg="${esc(person.id)}" data-arg2="${esc(f.id)}" title="${en?'Copy':'Copiar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
            <button class="card-btn" data-act="editInfoField" data-arg="${esc(person.id)}" data-arg2="${esc(f.id)}" title="${en?'Edit':'Editar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="card-btn danger" data-act="deleteInfoField" data-arg="${esc(person.id)}" data-arg2="${esc(f.id)}" title="${en?'Delete':'Apagar'}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
          </div>
        </div>
        ${masked}
      </div>`;
    }).join('');
    return `<div class="info-person">
      <div class="info-person-head">
        <div class="info-person-name">👤 ${esc(person.name||'')}</div>
        <div class="info-person-actions">
          <button class="card-btn" data-act="renamePerson" data-arg="${esc(person.id)}" title="${en?'Rename':'Renomear'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="card-btn danger" data-act="deletePerson" data-arg="${esc(person.id)}" title="${en?'Delete person':'Apagar pessoa'}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
        </div>
      </div>
      <div class="info-fields">${fields||`<div style="font-size:.68rem;color:var(--text-muted);padding:6px 0">${en?'No details yet.':'Sem dados ainda.'}</div>`}</div>
      <button class="info-add-field" data-act="openInfoModal" data-arg="${esc(person.id)}">＋ ${en?'Add detail':'Adicionar dado'}</button>
    </div>`;
  }).join('');
}
function toggleInfoMask(id){
  const el=document.getElementById('infoval-'+id);
  if(!el)return;
  if(el.classList.contains('masked')){el.textContent=el.dataset.real;el.classList.remove('masked');}
  else{el.textContent='••••••••';el.classList.add('masked');}
}
function copyInfoField(personId,fieldId){
  const p=personalInfo.find(x=>x.id===personId);if(!p)return;
  const f=(p.fields||[]).find(x=>x.id===fieldId);if(!f)return;
  copyText(f.value,currentLang==='en'?'Copied!':'Copiado!');
}
// ── Pessoas ──
function addPerson(){
  const en=currentLang==='en';
  const name=prompt(en?'Person\'s name (e.g. Carlos, Aurora):':'Nome da pessoa (ex: Carlos, Aurora):');
  if(name===null)return;
  const nm=name.trim();if(!nm)return;
  personalInfo.push({id:Date.now().toString(36),name:nm,fields:[]});
  logActivity('add',nm,'🆔');
  renderInfo();markUnsaved();
}
function renamePerson(id){
  const en=currentLang==='en';
  const p=personalInfo.find(x=>x.id===id);if(!p)return;
  const name=prompt(en?'New name:':'Novo nome:',p.name||'');
  if(name===null)return;
  const nm=name.trim();if(!nm)return;
  p.name=nm;renderInfo();markUnsaved();
}
function deletePerson(id){
  const en=currentLang==='en';
  const p=personalInfo.find(x=>x.id===id);if(!p)return;
  const n=(p.fields||[]).length;
  const msg=en?`Delete "${p.name}" and its ${n} detail(s)?`:`Apagar "${p.name}" e os seus ${n} dado(s)?`;
  if(!confirm(msg))return;
  personalInfo=personalInfo.filter(x=>x.id!==id);
  logActivity('delete',p.name,'🗑️');
  renderInfo();markUnsaved();
  toast(en?'Deleted':'Apagado');
}
// ── Campos de uma pessoa ──
function openInfoModal(personId){
  editingPersonId=personId;editingInfoFieldId=null;
  const en=currentLang==='en';
  document.getElementById('info-modal-title').textContent=en?'Add detail':'Adicionar dado';
  document.getElementById('im-label').value='';
  document.getElementById('im-value').value='';
  document.getElementById('im-sensitive').checked=false;
  renderInfoPresets();
  document.getElementById('info-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('im-label').focus(),50);
}
function editInfoField(personId,fieldId){
  const p=personalInfo.find(x=>x.id===personId);if(!p)return;
  const f=(p.fields||[]).find(x=>x.id===fieldId);if(!f)return;
  editingPersonId=personId;editingInfoFieldId=fieldId;
  const en=currentLang==='en';
  document.getElementById('info-modal-title').textContent=en?'Edit detail':'Editar dado';
  document.getElementById('im-label').value=f.label||'';
  document.getElementById('im-value').value=f.value||'';
  document.getElementById('im-sensitive').checked=!!f.sensitive;
  renderInfoPresets();
  document.getElementById('info-overlay').classList.add('open');
}
function renderInfoPresets(){
  const en=currentLang==='en';
  const presets=en?INFO_PRESETS_EN:INFO_PRESETS_PT;
  const box=document.getElementById('im-presets');
  if(box)box.innerHTML=presets.map(p=>`<button type="button" class="im-preset" data-act="fillField" data-arg="im-label" data-arg2="${esc(p)}">${p}</button>`).join('');
}
function closeInfoModal(){document.getElementById('info-overlay').classList.remove('open');}
function saveInfo(){
  const en=currentLang==='en';
  const label=document.getElementById('im-label').value.trim();
  const value=document.getElementById('im-value').value.trim();
  if(!label){toast(en?'Give it a name!':'Dá-lhe um nome!');return;}
  if(!value){toast(en?'Fill in the value!':'Preenche o valor!');return;}
  const sensitive=document.getElementById('im-sensitive').checked;
  const p=personalInfo.find(x=>x.id===editingPersonId);
  if(!p){closeInfoModal();return;}
  if(!Array.isArray(p.fields))p.fields=[];
  if(editingInfoFieldId){
    const idx=p.fields.findIndex(f=>f.id===editingInfoFieldId);
    if(idx>=0)p.fields[idx]={...p.fields[idx],label,value,sensitive};
    logActivity('edit',label,'🆔');
  }else{
    p.fields.push({id:Date.now().toString(36),label,value,sensitive});
    logActivity('add',label,'🆔');
  }
  closeInfoModal();renderInfo();markUnsaved();
  toast(en?'Saved!':'Guardado!');
}
function deleteInfoField(personId,fieldId){
  const en=currentLang==='en';
  const p=personalInfo.find(x=>x.id===personId);if(!p)return;
  const f=(p.fields||[]).find(x=>x.id===fieldId);if(!f)return;
  if(!confirm(en?`Delete "${f.label}"?`:`Apagar "${f.label}"?`))return;
  p.fields=p.fields.filter(x=>x.id!==fieldId);
  logActivity('delete',f.label,'🗑️');
  renderInfo();markUnsaved();
  toast(en?'Deleted':'Apagado');
}

