// ══ SAVE FILE ══
// ══ BENS: garantias, licenças, veículos, datas ══
const ASSET_SCHEMA={
  warranty:{icon:'🧾',title:['Garantia','Warranty'],fields:[
    {k:'name',l:['Produto','Product'],t:'text',req:1,ph:['Ex: Máquina de lavar Bosch','e.g. Bosch washing machine']},
    {k:'store',l:['Loja','Store'],t:'text',ph:['Ex: Worten','e.g. Currys']},
    {k:'buyDate',l:['Data de compra','Purchase date'],t:'date',req:1},
    {k:'years',l:['Anos de garantia','Warranty years'],t:'number',req:1,ph:['2','2']},
    {k:'price',l:['Valor pago (€)','Price paid (€)'],t:'number'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]},
  license:{icon:'🔑',title:['Licença','License'],fields:[
    {k:'name',l:['Software','Software'],t:'text',req:1,ph:['Ex: Windows 11 Pro','e.g. Windows 11 Pro']},
    {k:'key',l:['Chave / Serial','Key / Serial'],t:'text',req:1},
    {k:'email',l:['Conta associada','Linked account'],t:'text'},
    {k:'buyDate',l:['Data de compra','Purchase date'],t:'date'},
    {k:'expiry',l:['Validade (se tiver)','Expiry (if any)'],t:'date'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]},
  vehicle:{icon:'🚗',title:['Veículo','Vehicle'],fields:[
    {k:'name',l:['Veículo','Vehicle'],t:'text',req:1,ph:['Ex: Golf 1.6 TDI','e.g. Golf 1.6 TDI']},
    {k:'plate',l:['Matrícula','Plate'],t:'text'},
    {k:'insurance',l:['Seguro até','Insurance until'],t:'date'},
    {k:'inspection',l:['Inspeção até','Inspection until'],t:'date'},
    {k:'service',l:['Próxima revisão','Next service'],t:'date'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]},
  dates:{icon:'🎂',title:['Data','Date'],fields:[
    {k:'name',l:['O que é','What is it'],t:'text',req:1,ph:['Ex: Aniversário da Aurora','e.g. Anna birthday']},
    {k:'date',l:['Data','Date'],t:'date',req:1},
    {k:'yearly',l:['Repete todos os anos','Repeats every year'],t:'check'},
    {k:'notes',l:['Notas','Notes'],t:'textarea'}
  ]}
};

// datas que cada bem gera (para calendário e avisos)
function assetDates(a){
  const en=currentLang==='en';
  const out=[];
  const mk=(v,sub)=>{if(!v)return;const d=new Date(v);if(!isNaN(d))out.push({date:d,sub});};
  if(a.kind==='warranty'&&a.buyDate&&a.years){
    const d=new Date(a.buyDate);
    if(!isNaN(d)){d.setFullYear(d.getFullYear()+(parseInt(a.years)||0));out.push({date:d,sub:en?'warranty ends':'fim da garantia'});}
  }
  if(a.kind==='license')mk(a.expiry,en?'license expires':'licença expira');
  if(a.kind==='vehicle'){
    mk(a.insurance,en?'insurance':'seguro');
    mk(a.inspection,en?'inspection':'inspeção');
    mk(a.service,en?'service':'revisão');
  }
  if(a.kind==='dates'&&a.date){
    const d=new Date(a.date);
    if(!isNaN(d)){
      if(a.yearly){
        const t=new Date();t.setHours(0,0,0,0);
        const n=new Date(t.getFullYear(),d.getMonth(),d.getDate());
        if(n<t)n.setFullYear(n.getFullYear()+1);
        out.push({date:n,sub:''});
      }else out.push({date:d,sub:''});
    }
  }
  return out;
}

function assetNextDate(a){
  const ds=assetDates(a);if(!ds.length)return null;
  const t=new Date();t.setHours(0,0,0,0);
  const fut=ds.filter(x=>x.date>=t).sort((x,y)=>x.date-y.date);
  return fut.length?fut[0]:ds.sort((x,y)=>y.date-x.date)[0];
}

function renderAssets(kind){
  const box=document.getElementById(kind+'-content');if(!box)return;
  const en=currentLang==='en';
  const list=(assets||[]).filter(a=>a.kind===kind);
  if(!list.length){
    box.innerHTML='<div class="av-empty" style="text-align:center;padding:50px 20px;color:var(--text-muted)"><div style="font-size:2.4rem;margin-bottom:12px;opacity:.5">'+ASSET_SCHEMA[kind].icon+'</div><div style="font-size:.78rem">'+(en?'Nothing here yet.':'Ainda não há nada aqui.')+'</div></div>';
    return;
  }
  const sorted=list.slice().sort((a,b)=>{
    const x=assetNextDate(a),y=assetNextDate(b);
    if(!x&&!y)return (a.name||'').localeCompare(b.name||'');
    if(!x)return 1;if(!y)return -1;return x.date-y.date;
  });
  box.innerHTML='<div class="asset-grid">'+sorted.map(a=>{
    const nx=assetNextDate(a);
    let badge='';
    if(nx){
      const n=calDaysUntil(nx.date);
      const col=n<0?'var(--red)':n<=30?'var(--accent)':'var(--text-muted)';
      const txt=(nx.sub?esc(nx.sub)+' · ':'')+calWhenLabel(n);
      badge='<div class="asset-when" style="color:'+col+'">'+txt+'</div>';
    }
    let meta=[];
    if(a.kind==='warranty'){if(a.store)meta.push(esc(a.store));if(a.price)meta.push(fmtMoney(parseFloat(a.price)||0));}
    if(a.kind==='license'){if(a.email)meta.push(esc(a.email));}
    if(a.kind==='vehicle'){if(a.plate)meta.push(esc(a.plate));}

    let keyRow='';
    if(a.kind==='license'&&a.key){
      keyRow='<div class="asset-key"><span class="asset-key-val" id="ak-'+a.id+'">••••••••••••</span>'+
        '<button class="asset-mini" data-act="toggleAssetKey" data-arg="'+esc(a.id)+'" id="akb-'+a.id+'">'+(en?'Show':'Ver')+'</button>'+
        '<button class="asset-mini" data-act="copyAssetKey" data-arg="'+esc(a.id)+'">'+(en?'Copy':'Copiar')+'</button></div>';
    }
    return '<div class="asset-card">'+
      '<div class="asset-head"><span class="asset-ic">'+ASSET_SCHEMA[kind].icon+'</span>'+
        '<span class="asset-name">'+esc(a.name||'')+'</span>'+
        '<span class="asset-acts"><button class="asset-mini" data-act="openAssetModal" data-arg="'+esc(kind)+'" data-arg2="'+esc(a.id)+'">'+(en?'Edit':'Editar')+'</button>'+
        '<button class="asset-mini danger" data-act="deleteAsset" data-arg="'+esc(a.id)+'">'+(en?'Delete':'Apagar')+'</button></span></div>'+
      (meta.length?'<div class="asset-meta">'+meta.join(' · ')+'</div>':'')+
      keyRow+badge+
      (a.kind==='vehicle'?'<button class="asset-mini" style="margin-top:8px" data-act="openFuelModal" data-arg="'+esc(a.id)+'">⛽ '+(en?'Refuelling':'Abastecimentos')+((a.fuel&&a.fuel.length)?' ('+a.fuel.length+')':'')+'</button>':'')+
      attachChips(a,'asset')+
      (a.notes?'<div class="asset-notes">'+esc(a.notes)+'</div>':'')+
    '</div>';
  }).join('')+'</div>';
}

function toggleAssetKey(id){
  const a=assets.find(x=>x.id===id);if(!a)return;
  const el=document.getElementById('ak-'+id),btn=document.getElementById('akb-'+id);
  const en=currentLang==='en';
  if(!el)return;
  if(el.dataset.shown==='1'){el.textContent='••••••••••••';el.dataset.shown='0';if(btn)btn.textContent=en?'Show':'Ver';}
  else{el.textContent=a.key||'';el.dataset.shown='1';if(btn)btn.textContent=en?'Hide':'Ocultar';}
}
function copyAssetKey(id){
  const a=assets.find(x=>x.id===id);if(!a||!a.key)return;
  copyText(a.key,currentLang==='en'?'Key copied!':'Chave copiada!');
}

function openAssetModal(kind,id){
  const en=currentLang==='en';
  currentAssetKind=kind;editingAssetId=id||null;
  const sch=ASSET_SCHEMA[kind];
  const a=id?assets.find(x=>x.id===id):null;
  assetAttachments=a?normalizeAttachments(a):[];
  document.getElementById('asset-modal-title').textContent=sch.icon+' '+(id?(en?'Edit ':'Editar '):(en?'New ':'Nova '))+sch.title[en?1:0];
  const box=document.getElementById('asset-fields');
  box.innerHTML=sch.fields.map(f=>{
    const v=a?(a[f.k]||''):'';
    const lbl=f.l[en?1:0]+(f.req?' *':'');
    if(f.t==='check'){
      return '<div class="form-group"><label style="display:flex;align-items:center;gap:9px;cursor:pointer"><input type="checkbox" id="as-'+f.k+'"'+(a&&a[f.k]?' checked':'')+' style="width:auto;margin:0"> <span>'+lbl+'</span></label></div>';
    }
    if(f.t==='textarea'){
      return '<div class="form-group"><label>'+lbl+'</label><textarea id="as-'+f.k+'" rows="2">'+esc(v)+'</textarea></div>';
    }
    const ph=f.ph?' placeholder="'+esc(f.ph[en?1:0])+'"':'';
    const step=f.t==='number'?' step="any"':'';
    return '<div class="form-group"><label>'+lbl+'</label><input type="'+f.t+'" id="as-'+f.k+'" value="'+esc(v)+'"'+ph+step+'></div>';
  }).join('')+
    '<div class="form-group"><label>'+(en?'Attachments (images or PDF)':'Anexos (imagens ou PDF)')+'</label>'+
    '<input type="file" id="asset-attach-input" accept="image/*,application/pdf" multiple data-change="handleAttachment" data-ev data-arg="asset" style="font-size:.7rem">'+
    '<div id="asset-attach-list" class="att-list"></div></div>';
  renderAttachList('asset');
  document.getElementById('asset-cancel-btn').textContent=en?'Cancel':'Cancelar';
  document.getElementById('asset-save-btn').textContent=en?'Save':'Guardar';
  document.getElementById('asset-overlay').classList.add('open');
}
function closeAssetModal(){document.getElementById('asset-overlay').classList.remove('open');editingAssetId=null;assetAttachments=[];}

function saveAsset(){
  const en=currentLang==='en';
  const kind=currentAssetKind,sch=ASSET_SCHEMA[kind];
  // Ao editar, parte do bem existente: antes os campos fora do formulário (ex.: abastecimentos do veículo) perdiam-se
  const prev=editingAssetId?assets.find(x=>x.id===editingAssetId):null;
  const obj={...(prev||{}),id:editingAssetId||Date.now().toString(36),kind};
  for(const f of sch.fields){
    const el=document.getElementById('as-'+f.k);if(!el)continue;
    const val=f.t==='check'?el.checked:el.value.trim();
    if(f.req&&!val){toast(en?('Fill in: '+f.l[1]):('Preenche: '+f.l[0]));el.focus();return;}
    obj[f.k]=val;
  }
  obj.attachments=assetAttachments;
  if(editingAssetId){const i=assets.findIndex(x=>x.id===editingAssetId);if(i>=0)assets[i]=obj;logActivity('edit',obj.name,sch.icon);}
  else{assets.push(obj);logActivity('add',obj.name,sch.icon);}
  closeAssetModal();renderAssets(kind);markUnsaved();
  toast(en?'Saved!':'Guardado!');
}

function deleteAsset(id){
  const en=currentLang==='en';
  const a=assets.find(x=>x.id===id);if(!a)return;
  if(!confirm(en?('Delete "'+a.name+'"?'):('Apagar "'+a.name+'"?')))return;
  const kind=a.kind;
  assets=assets.filter(x=>x.id!==id);
  logActivity('delete',a.name,'🗑️');
  renderAssets(kind);markUnsaved();
  toast(en?'Deleted.':'Apagado.');
}

// ══ ABASTECIMENTOS (por veículo) ══
let fuelVehicleId=null;
function openFuelModal(vid){
  fuelVehicleId=vid;
  const v=(assets||[]).find(x=>x.id===vid);if(!v)return;
  const en=currentLang==='en';
  document.getElementById('fuel-modal-title').textContent='⛽ '+(en?'Refuelling — ':'Abastecimentos — ')+(v.name||'');
  document.getElementById('fuel-date').value=new Date().toISOString().slice(0,10);
  ['fuel-liters','fuel-euros','fuel-km'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('fuel-lbl-date').textContent=en?'Date':'Data';
  document.getElementById('fuel-lbl-liters').textContent=en?'Litres':'Litros';
  document.getElementById('fuel-lbl-euros').textContent=en?'Amount (€)':'Valor (€)';
  document.getElementById('fuel-lbl-km').textContent=en?'Odometer (km)':'Quilómetros (conta-km)';
  document.getElementById('fuel-add-btn').textContent=en?'Add':'Adicionar';
  document.getElementById('fuel-close-btn').textContent=en?'Close':'Fechar';
  renderFuel();
  document.getElementById('fuel-overlay').classList.add('open');
}
function closeFuelModal(){document.getElementById('fuel-overlay').classList.remove('open');fuelVehicleId=null;}

function fuelStats(list){
  // método do depósito cheio: consumo entre abastecimentos consecutivos
  const s=list.slice().filter(f=>f.km).sort((a,b)=>a.km-b.km);
  const out={rows:[],avg:null,kmTotal:0,litTotal:0,eurTotal:0,eurPer100:null,perMonth:null};
  list.forEach(f=>{out.eurTotal+=parseFloat(f.euros)||0;});
  for(let i=1;i<s.length;i++){
    const dk=s[i].km-s[i-1].km;
    const li=parseFloat(s[i].liters)||0;
    if(dk>0&&li>0){
      out.rows.push({id:s[i].id,cons:li/dk*100});
      out.kmTotal+=dk;out.litTotal+=li;
    }
  }
  if(out.kmTotal>0&&out.litTotal>0){
    out.avg=out.litTotal/out.kmTotal*100;
    const eurNoFirst=s.slice(1).reduce((a,f)=>a+(parseFloat(f.euros)||0),0);
    if(eurNoFirst>0)out.eurPer100=eurNoFirst/out.kmTotal*100;
  }
  // custo médio por mês
  const ds=list.map(f=>new Date(f.date)).filter(d=>!isNaN(d)).sort((a,b)=>a-b);
  if(ds.length>=2){
    const meses=Math.max(1,(ds[ds.length-1]-ds[0])/(30.44*86400000));
    out.perMonth=out.eurTotal/meses;
  }
  return out;
}

function renderFuel(){
  const v=(assets||[]).find(x=>x.id===fuelVehicleId);if(!v)return;
  const en=currentLang==='en';
  const list=(v.fuel||[]).slice();
  const box=document.getElementById('fuel-list');
  const st=fuelStats(list);
  const sBox=document.getElementById('fuel-stats');
  if(list.length<2){
    sBox.innerHTML='<div class="fuel-hint">'+(en?'Add at least two refuels (with odometer) to see real consumption.':'Regista pelo menos dois abastecimentos (com os quilómetros) para veres o consumo real.')+'</div>';
  }else{
    sBox.innerHTML='<div class="fuel-stats">'+
      '<div class="fuel-stat"><span class="fuel-v">'+(st.avg?st.avg.toFixed(1):'—')+'</span><span class="fuel-l">'+(en?'L/100km':'L/100km')+'</span></div>'+
      '<div class="fuel-stat"><span class="fuel-v">'+(st.eurPer100?fmtMoney(st.eurPer100):'—')+'</span><span class="fuel-l">'+(en?'per 100km':'por 100km')+'</span></div>'+
      '<div class="fuel-stat"><span class="fuel-v">'+(st.perMonth?fmtMoney(st.perMonth):'—')+'</span><span class="fuel-l">'+(en?'per month':'por mês')+'</span></div>'+
      '<div class="fuel-stat"><span class="fuel-v">'+fmtMoney(st.eurTotal)+'</span><span class="fuel-l">'+(en?'total':'total')+'</span></div>'+
      '</div>';
  }
  if(!list.length){box.innerHTML='<div class="fuel-hint">'+(en?'No refuels yet.':'Ainda não há abastecimentos.')+'</div>';return;}
  const consOf={};st.rows.forEach(r=>consOf[r.id]=r.cons);
  const sorted=list.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  box.innerHTML=sorted.map(f=>{
    const d=new Date(f.date);
    const ds=isNaN(d)?'':d.toLocaleDateString(en?'en-GB':'pt-PT',{day:'2-digit',month:'2-digit',year:'2-digit'});
    const c=consOf[f.id];
    return '<div class="fuel-row">'+
      '<span class="fuel-date">'+ds+'</span>'+
      '<span class="fuel-main">'+(parseFloat(f.liters)||0).toFixed(1)+' L · '+fmtMoney(parseFloat(f.euros)||0)+(f.km?' · '+f.km+' km':'')+'</span>'+
      (c?'<span class="fuel-cons">'+c.toFixed(1)+'</span>':'')+
      '<button class="att-btn danger" data-act="deleteFuel" data-arg="'+esc(f.id)+'">✕</button>'+
    '</div>';
  }).join('');
}

function addFuel(){
  const en=currentLang==='en';
  const v=(assets||[]).find(x=>x.id===fuelVehicleId);if(!v)return;
  const date=document.getElementById('fuel-date').value;
  const liters=document.getElementById('fuel-liters').value.trim();
  const euros=document.getElementById('fuel-euros').value.trim();
  const km=document.getElementById('fuel-km').value.trim();
  if(!date||!liters||!euros){toast(en?'Date, litres and amount are required.':'Data, litros e valor são obrigatórios.');return;}
  if(!v.fuel)v.fuel=[];
  v.fuel.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),date,liters,euros,km:km?parseInt(km):null});
  ['fuel-liters','fuel-euros','fuel-km'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  renderFuel();renderAssets('vehicle');markUnsaved();
  toast(en?'Added.':'Adicionado.');
}
function deleteFuel(fid){
  const v=(assets||[]).find(x=>x.id===fuelVehicleId);if(!v||!v.fuel)return;
  v.fuel=v.fuel.filter(f=>f.id!==fid);
  renderFuel();renderAssets('vehicle');markUnsaved();
}

// ══ SINCRONIZAÇÃO COM A GOOGLE DRIVE ══
// Config não sensível em localStorage; token só em memória.
const DRIVE_NAME='ciphervault.vault';
let driveToken=null,driveTokenExp=0,driveBusy=false;
function dCfg(k,v){
  if(v===undefined)return localStorage.getItem('av_drive_'+k)||'';
  if(v===null)localStorage.removeItem('av_drive_'+k);else localStorage.setItem('av_drive_'+k,v);
}
function driveOn(){return dCfg('on')==='1'&&!!dCfg('cid');}

// ── cópia local (dentro da app, sempre atualizada) ──
async function localVaultSave(json,pending){
  try{await idbSet('av_local',{json,at:Date.now(),pending:!!pending});}catch(e){}
  try{await localVaultLink(json);}catch(e){}
}
// a cópia interna fica associada ao ficheiro do cofre (nome + sal): só assim pode substituí-lo ao desbloquear
function vaultSaltOf(json){try{const c=JSON.parse(json);return c&&c.salt?String(c.salt):'';}catch(e){return '';}}
// cofre aberto pelo ficheiro: se a cópia interna é do mesmo cofre, fica associada (nunca a substitui — pode ser mais recente)
async function vaultLinkOpenedFile(text){
  if(typeof vaultFileHandle==='undefined'||!vaultFileHandle)return;
  const loc=await localVaultGet();
  if(!loc||!loc.json){await localVaultSave(text,false);return;}
  if(vaultSaltOf(loc.json)===vaultSaltOf(text))await localVaultLink(loc.json);
}
async function localVaultLink(json){
  const salt=vaultSaltOf(json);
  if(typeof vaultFileHandle!=='undefined'&&vaultFileHandle&&salt)await idbSet('av_local_link',{name:vaultFileHandle.name,salt});
}
async function localVaultGet(){try{return await idbGet('av_local');}catch(e){return null;}}

// ── autorização (sem carregar scripts da Google) ──
function driveAuth(interactive){
  return new Promise((resolve,reject)=>{
    const cid=dCfg('cid');
    if(!cid)return reject(new Error('sem-id'));
    if(driveToken&&Date.now()<driveTokenExp-60000)return resolve(driveToken);
    if(!interactive)return reject(new Error('sem-token'));
    const redirect=location.origin+location.pathname;
    const state=Math.random().toString(36).slice(2);
    const url='https://accounts.google.com/o/oauth2/v2/auth'+
      '?client_id='+encodeURIComponent(cid)+
      '&redirect_uri='+encodeURIComponent(redirect)+
      '&response_type=token'+
      '&scope='+encodeURIComponent('https://www.googleapis.com/auth/drive.file')+
      (dCfg('hint')?'&login_hint='+encodeURIComponent(dCfg('hint')):'')+
      '&include_granted_scopes=true&state='+state;
    const w=window.open(url,'av_oauth','width=500,height=660');
    if(!w)return reject(new Error('popup-bloqueado'));
    let done=false;
    const onMsg=ev=>{
      if(ev.origin!==location.origin||!ev.data||!ev.data.avOAuth)return;
      const p=new URLSearchParams(String(ev.data.avOAuth).replace(/^#/,''));
      if(p.get('state')!==state)return;
      const tok=p.get('access_token');
      window.removeEventListener('message',onMsg);done=true;
      if(!tok)return reject(new Error(p.get('error')||'sem-token'));
      driveToken=tok;driveTokenExp=Date.now()+(parseInt(p.get('expires_in')||'3600')*1000);
      resolve(tok);
    };
    window.addEventListener('message',onMsg);
    const iv=setInterval(()=>{
      if(done||!w||w.closed){clearInterval(iv);if(!done){window.removeEventListener('message',onMsg);reject(new Error('cancelado'));}}
    },600);
  });
}

// ── chamadas à API ──
async function dApi(url,opts,interactive){
  const tok=await driveAuth(interactive!==false);
  opts=opts||{};opts.headers=Object.assign({},opts.headers,{Authorization:'Bearer '+tok});
  const r=await fetch(url,opts);
  if(r.status===401){driveToken=null;const t2=await driveAuth(true);opts.headers.Authorization='Bearer '+t2;return fetch(url,opts);}
  return r;
}
async function driveCaptureHint(){
  if(dCfg('hint'))return; // já sabemos a conta
  try{
    const r=await dApi('https://www.googleapis.com/drive/v3/about?fields=user',{},false);
    if(r&&r.ok){const j=await r.json();const em=j&&j.user&&j.user.emailAddress;if(em)dCfg('hint',em);}
  }catch(e){}
}
async function driveMeta(interactive){
  const fid=dCfg('fid');if(!fid)return null;
  const r=await dApi('https://www.googleapis.com/drive/v3/files/'+fid+'?fields=id,name,modifiedTime,size,version',{},interactive);
  if(!r.ok)return null;
  driveCaptureHint(); // guarda o email da conta (1x) para saltar o seletor de contas
  return r.json();
}
async function driveDownload(interactive){
  const fid=dCfg('fid');if(!fid)throw new Error('sem-ficheiro');
  const r=await dApi('https://www.googleapis.com/drive/v3/files/'+fid+'?alt=media',{},interactive);
  if(!r.ok)throw new Error('download '+r.status);
  return r.text();
}
async function driveUpload(json,interactive){
  const fid=dCfg('fid');
  const meta={name:DRIVE_NAME,mimeType:'application/octet-stream'};
  const bnd='avb'+Math.random().toString(36).slice(2);
  const body='--'+bnd+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+
             '\r\n--'+bnd+'\r\nContent-Type: application/octet-stream\r\n\r\n'+json+'\r\n--'+bnd+'--';
  const url=fid
    ? 'https://www.googleapis.com/upload/drive/v3/files/'+fid+'?uploadType=multipart&fields=id,modifiedTime,version'
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime,version';
  const r=await dApi(url,{method:fid?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+bnd},body},interactive);
  if(!r.ok)throw new Error('upload '+r.status);
  const j=await r.json();
  if(j.id)dCfg('fid',j.id);
  if(j.modifiedTime)dCfg('mtime',j.modifiedTime);
  if(j.version!=null)dCfg('ver',String(j.version));
  await syncBaseSave(json);
  return j;
}

// ── recarregar o cofre a partir de um container descarregado ──
async function applyContainerText(text){
  const container=JSON.parse(text);
  const salt=new Uint8Array(container.salt),iter=containerIter(container);
  const key=await deriveKey(masterPwRaw,salt,iter);
  const data=await decrypt(key,container.payload);
  const changed=key!==masterKey;
  window._salt=salt;window._iter=iter;masterKey=key;
  if(changed){refreshQuickSecrets();setTimeout(()=>{try{maybeUpgradeKdf();}catch(e){}},1500);}
  syncApplyData(data);
  pendingVaultText=text;
  await localVaultSave(text,false);
  renderAll();
  return data.savedAt||0;
}
function syncApplyData(data){
  vault=data.vault||[];notes=data.notes||[];bankCards=data.bankCards||[];activityLog=data.activityLog||[];documents=data.documents||[];trash=data.trash||[];customCats=data.customCats||[];docFolders=data.docFolders||[];currentFolderId=null;vaultFolders=data.vaultFolders||[];currentVaultFolderId=null;wifiNets=data.wifiNets||[];legacyNote=data.legacyNote||'';legacyOwner=data.legacyOwner||'';personalInfo=data.personalInfo||[];subscriptions=data.subscriptions||[];storeCards=data.storeCards||[];assets=data.assets||[];vaultName=data.vaultName||'';
  totpRecWrap=data.totpRecWrap||null;totpEnc=data.totpEnc||null;totpKey=null;totpUnlocked=false;
  totp=totpRecWrap?[]:(data.totp||[]);
  payloadExtras={};
  Object.keys(data).forEach(k=>{if(!KNOWN_KEYS.includes(k))payloadExtras[k]=data[k];});
}

// ── orquestração (sincronização blindada) ──
/* Regras: (1) nunca carregar do Drive por cima de alterações por gravar; (2) antes de enviar, confirmar se o
   Drive mudou desde a última sincronização — se mudou, juntar item a item (3 vias: base comum, este dispositivo,
   Drive) e só depois enviar; (3) antes de substituir, guardar cópia no histórico do Drive; (4) travão se uma
   gravação for eliminar mais de metade dos itens. */
function syncErrMsg(e){
  const en=currentLang==='en',m=e&&e.message;
  if(m==='remote-pw')return en?'The vault on Drive was changed with a different master password — nothing was merged or replaced.':'O cofre no Drive foi alterado com outra palavra-passe mestra — não juntei nem substituí nada.';
  if(m==='guard')return en?'Upload to Drive held back — confirm it by saving again.':'Envio para o Drive travado — confirma gravando outra vez.';
  return '';
}
async function driveAfterSave(json){
  if(!driveOn())return;
  try{
    driveBusy=true;renderDriveChip();
    await driveSafeUpload(json,false);
    driveBusy=false;renderDriveChip('ok');
  }catch(e){
    driveBusy=false;
    try{await localVaultSave(pendingVaultText||json,true);}catch(_){}
    renderDriveChip('pend');
    const msg=syncErrMsg(e);if(msg)toast(msg);
  }
}
async function driveSafeUpload(json,interactive){
  const m=await driveMeta(interactive);
  if(!m)throw new Error('meta');
  const known=dCfg('ver');let rep=null;
  if(known&&m.version!=null&&String(m.version)!==String(known)){
    const res=await driveMergeRemote(m,interactive);
    json=res.json;rep=res.rep;
  }
  if(!(await syncGuard()))throw new Error('guard');
  try{await driveSnapshot(m,interactive,!!(rep&&rep.conflicts.length));}catch(e){}
  const j=await driveUpload(json,interactive);
  await localVaultSave(json,false);
  dCfg('cnt',String(syncCount(vaultPayload())));
  if(rep)syncReport(rep);
  return j;
}
async function driveMergeRemote(m,interactive){
  const rtxt=await driveDownload(interactive);
  let R;try{R=await syncDecrypt(rtxt,masterPwRaw);}catch(e){throw new Error('remote-pw');}
  let B=null;try{const bt=await idbGet('av_base');if(bt)B=await syncDecrypt(bt,masterPwRaw);}catch(e){B=null;}
  if(totpUnlocked&&(!totpEnc||syncStable(totp)!==totpSig)){try{totpEnc=await encryptTotpArray();}catch(e){}}
  const L=vaultPayload();
  const {data,rep}=syncMerge(B,L,R);
  if(totpUnlocked&&totpKey&&L.totpRecWrap&&syncEq(L.totpRecWrap,R.totpRecWrap)&&R.totpEnc&&!syncEq(L.totpEnc,R.totpEnc)){
    try{
      const rt=await decryptTotpArray(totpKey,R.totpEnc);
      let bt=null;if(B&&B.totpEnc&&syncEq(B.totpRecWrap,L.totpRecWrap)){try{bt=await decryptTotpArray(totpKey,B.totpEnc);}catch(e){}}
      rep.conflicts=rep.conflicts.filter(c=>c.key!=='2fa');
      const lt=totp.slice();
      const mt=(syncIsIdArr(lt)||syncIsIdArr(rt))?syncMergeIdArr(bt,lt,rt,rep,'2fa'):syncMergeSetArr(bt,lt,rt);
      totp=mt;totpEnc=await encryptTotpArray();
      data.totpEnc=totpEnc;data.totpRecWrap=L.totpRecWrap;
      rep.totpMerged=true;
    }catch(e){}
  }
  try{if(pendingVaultText)await pushSnapshot(JSON.parse(pendingVaultText));}catch(e){}
  const totpChanged=!rep.totpMerged&&(!syncEq(data.totpEnc,L.totpEnc)||!syncEq(data.totp,L.totp));
  const keepTotp=rep.totpMerged?{t:totp,k:totpKey,u:totpUnlocked,s:totpSig}:null;
  syncApplyData(data);
  if(keepTotp){totp=keepTotp.t;totpKey=keepTotp.k;totpUnlocked=keepTotp.u;totpSig=keepTotp.s;}
  else if(totpChanged&&totpRecWrap){totpKey=null;totpUnlocked=false;totp=[];}
  const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
  const json=JSON.stringify(mkContainer(ks,p));
  pendingVaultText=json;
  await syncBaseSave(rtxt);if(m&&m.version!=null)dCfg('ver',String(m.version));
  await localVaultSave(json,true);
  try{await syncWriteLocalFile(json);}catch(e){}
  if(typeof renderAll==='function')renderAll();
  return {json,rep};
}
async function syncWriteLocalFile(json){
  if(!vaultFileHandle)return;
  const perm=await vaultFileHandle.queryPermission({mode:'readwrite'});
  if(perm!=='granted')return;
  const w=await vaultFileHandle.createWritable();await w.write(json);await w.close();
}
async function driveApplyRemote(m,interactive){
  const txt=await driveDownload(interactive);
  try{if(pendingVaultText)await pushSnapshot(JSON.parse(pendingVaultText));}catch(e){}
  await applyContainerText(txt);
  await syncBaseSave(txt);
  dCfg('mtime',m.modifiedTime);if(m.version!=null)dCfg('ver',String(m.version));
  dCfg('cnt',String(syncCount(vaultPayload())));
  try{await syncWriteLocalFile(txt);}catch(e){}
}
function driveRemoteNewer(m){
  const kv=dCfg('ver');
  if(kv&&m.version!=null)return String(m.version)!==String(kv);
  const remote=new Date(m.modifiedTime).getTime(),known=dCfg('mtime')?new Date(dCfg('mtime')).getTime():0;
  return remote>known+2000;
}
let _syncHeldToast=0;
function driveHoldForUnsaved(){
  renderDriveChip('old');
  if(Date.now()-_syncHeldToast>60000){_syncHeldToast=Date.now();toast(currentLang==='en'?'Newer version on Drive — it will be merged when you save.':'Há uma versão mais recente no Drive — junto-a quando gravares.');}
}
async function driveCheckOnOpen(){
  if(!driveOn()||!navigator.onLine)return false;
  const en=currentLang==='en';
  try{
    const loc=await localVaultGet();
    if(loc&&loc.pending){ // alterações locais por enviar → enviar em segurança (junta se o Drive mudou)
      try{
        driveBusy=true;renderDriveChip();
        await driveSafeUpload(loc.json,true);
        driveBusy=false;renderDriveChip('ok');
      }catch(e){driveBusy=false;renderDriveChip('pend');const msg=syncErrMsg(e);if(msg)toast(msg);}
      return false;
    }
    driveBusy=true;renderDriveChip();
    const m=await driveMeta(true); // interativo: garante o token do Drive logo ao entrar
    if(!m){driveBusy=false;renderDriveChip('off');return false;}
    if(driveRemoteNewer(m)){
      if(hasUnsaved){driveBusy=false;driveHoldForUnsaved();return false;}
      await driveApplyRemote(m,true);
      driveBusy=false;renderDriveChip('ok');
      toast(en?'Synced with Drive.':'Sincronizado com o Drive.');
      return true;
    }else{driveBusy=false;renderDriveChip('ok');if(m.version!=null&&!dCfg('ver'))dCfg('ver',String(m.version));return false;}
  }catch(e){driveBusy=false;renderDriveChip('off');}
  return false;
}
let _driveFocusBusy=false,_driveFocusT=0;
async function driveCheckOnFocus(){
  if(!driveOn()||!masterKey||presentationMode)return;
  if(_driveFocusBusy)return;
  if(document.querySelector('.modal-overlay.open'))return; // não interromper uma edição em curso
  const now=Date.now();
  if(now-_driveFocusT<4000)return; // debounce
  _driveFocusT=now;
  const en=currentLang==='en';
  try{
    _driveFocusBusy=true;
    const loc=await localVaultGet();
    if(loc&&loc.pending){renderDriveChip('pend');_driveFocusBusy=false;return;} // há alterações locais por enviar → não carregar
    const m=await driveMeta(false);
    if(!m){_driveFocusBusy=false;return;}
    if(driveRemoteNewer(m)){
      if(hasUnsaved){driveHoldForUnsaved();_driveFocusBusy=false;return;} // nunca por cima do que está por gravar
      driveBusy=true;renderDriveChip();
      await driveApplyRemote(m,true);
      driveBusy=false;renderDriveChip('ok');
      toast(en?'Updated from Drive.':'Atualizado do Drive.');
    }else{renderDriveChip('ok');}
  }catch(e){driveBusy=false;renderDriveChip('off');}
  _driveFocusBusy=false;
}
async function driveFlushPending(silent){
  if(!driveOn())return;
  const loc=await localVaultGet();
  if(!loc||!loc.pending)return;
  try{
    driveBusy=true;renderDriveChip();
    await driveSafeUpload(loc.json,false);
    driveBusy=false;renderDriveChip('ok');
    if(!silent)toast(currentLang==='en'?'Pending changes sent to Drive.':'Alterações pendentes enviadas para o Drive.');
  }catch(e){driveBusy=false;renderDriveChip('pend');const msg=syncErrMsg(e);if(msg&&!silent)toast(msg);}
}

/* ══ JUNÇÃO DE VERSÕES (3 vias: base comum da última sincronização · este dispositivo · Drive) ══ */
function syncStable(v){
  if(v===undefined)return 'u';
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(syncStable).join(',')+']';
  return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+syncStable(v[k])).join(',')+'}';
}
function syncEq(a,b){return syncStable(a)===syncStable(b);}
function syncIsIdArr(x){return Array.isArray(x)&&x.length>0&&x.every(o=>o&&typeof o==='object'&&!Array.isArray(o)&&o.id!=null);}
function syncItemName(o){return String((o&&(o.name||o.title||o.label||o.bank||o.store||o.ssid||o.issuer))||'').slice(0,60);}
function syncMergeIdArr(b,l,r,rep,key){
  const mapOf=a=>{const m=new Map();(a||[]).forEach(o=>{if(o&&o.id!=null)m.set(String(o.id),o);});return m;};
  const B=b?mapOf(b):null,L=mapOf(l),R=mapOf(r),out=[],seen=new Set();
  const decide=id=>{
    const lo=L.get(id),ro=R.get(id),bo=B?B.get(id):undefined;
    if(lo&&ro){
      if(syncEq(lo,ro))return lo;
      if(bo&&syncEq(lo,bo)){rep.updated++;return ro;}
      if(bo&&syncEq(ro,bo))return lo;
      rep.conflicts.push({key,name:syncItemName(lo)});return lo;
    }
    if(lo){if(bo){if(syncEq(lo,bo)){rep.removed++;return null;}return lo;}return lo;}
    if(ro){if(bo){if(syncEq(ro,bo))return null;rep.updated++;return ro;}rep.added++;return ro;}
    return null;
  };
  [l||[],r||[]].forEach(arr=>arr.forEach(o=>{if(!o||o.id==null)return;const id=String(o.id);if(seen.has(id))return;seen.add(id);const v=decide(id);if(v)out.push(v);}));
  return out;
}
function syncMergeSetArr(b,l,r){
  const k=syncStable,L=l||[],R=r||[],Bs=b?new Set(b.map(k)):null,Ls=new Set(L.map(k)),Rs=new Set(R.map(k)),out=[],seen=new Set();
  const keep=(x,inOther)=>{const s=k(x);if(seen.has(s))return;if(inOther||!Bs||!Bs.has(s)){seen.add(s);out.push(x);}};
  L.forEach(x=>keep(x,Rs.has(k(x))));R.forEach(x=>keep(x,Ls.has(k(x))));
  const tsOf=x=>x&&typeof x==='object'?(+x.ts||+x.deletedAt||+x.at||0):0;
  if(out.length&&out.every(x=>tsOf(x)>0))out.sort((a,c)=>tsOf(c)-tsOf(a));
  return out;
}
const SYNC_TOTP=['totpEnc','totpRecWrap','totp'];
function syncMerge(B,L,R){
  const rep={added:0,updated:0,removed:0,conflicts:[]},data={};
  const keys=new Set([...Object.keys(L||{}),...Object.keys(R||{})]);
  keys.forEach(k=>{
    if(SYNC_TOTP.includes(k))return;
    const l=L[k],r=R[k],b=B?B[k]:undefined;
    if(k==='savedAt'){data[k]=Date.now();return;}
    if(k==='fmt'){data[k]=Math.max(+l||0,+r||0)||l||r;return;}
    if(syncIsIdArr(l)||syncIsIdArr(r)||(Array.isArray(l)&&Array.isArray(r)&&syncIsIdArr(b))){data[k]=syncMergeIdArr(Array.isArray(b)?b:null,Array.isArray(l)?l:[],Array.isArray(r)?r:[],rep,k);return;}
    if(Array.isArray(l)&&Array.isArray(r)){let m=syncMergeSetArr(Array.isArray(b)?b:null,l,r);if(k==='activityLog')m=m.slice(0,Math.max(l.length,r.length,50));data[k]=m;return;}
    if(syncEq(l,r)){data[k]=l;return;}
    if(B&&syncEq(l,b)){data[k]=r===undefined?l:r;return;}
    if(B&&syncEq(r,b)){data[k]=l;return;}
    if(l===undefined){data[k]=r;return;}if(r===undefined){data[k]=l;return;}
    rep.conflicts.push({key:k,name:''});data[k]=l;
  });
  const g=o=>o?{e:o.totpEnc,w:o.totpRecWrap,t:o.totp}:{};
  const lg=g(L),rg=g(R),bg=g(B);let pick=lg;
  if(!syncEq(lg,rg)){
    if(B&&syncEq(lg,bg))pick=rg;else if(B&&syncEq(rg,bg))pick=lg;
    else if(lg.e===undefined&&lg.t===undefined)pick=rg;
    else if(!(rg.e===undefined&&rg.t===undefined))rep.conflicts.push({key:'2fa',name:''});
  }
  if(pick.e!==undefined)data.totpEnc=pick.e;if(pick.w!==undefined)data.totpRecWrap=pick.w;if(pick.t!==undefined&&pick.w===undefined)data.totp=pick.t;
  return {data,rep};
}
async function syncDecrypt(text,pw){const c=JSON.parse(text);const key=await deriveKey(pw,new Uint8Array(c.salt),containerIter(c));return await decrypt(key,c.payload);}
async function syncBaseSave(json){try{await idbSet('av_base',json);}catch(e){}}
function syncCount(d){if(!d)return 0;return ['vault','notes','documents','bankCards','storeCards','assets','subscriptions','wifiNets','personalInfo'].reduce((s,k)=>s+(Array.isArray(d[k])?d[k].length:0),0);}
async function syncGuard(){
  const prev=+dCfg('cnt')||0,now=syncCount(vaultPayload());
  if(prev<10||now>=prev*.5)return true;
  const en=currentLang==='en';
  const ok=confirm(en?`This save removes many items at once (${prev} → ${now}).\n\nSend it to Drive anyway? (If you cancel, Drive keeps the previous version.)`:`Esta gravação elimina muitos itens de uma vez (${prev} → ${now}).\n\nEnviar mesmo assim para o Drive? (Se cancelares, o Drive fica com a versão anterior.)`);
  if(ok)dCfg('cnt',String(now));
  return ok;
}
const SYNC_KEY_LBL={vault:['Passwords','Passwords'],notes:['Notas','Notes'],documents:['Documentos','Documents'],bankCards:['Cartões','Cards'],storeCards:['Cartões de loja','Store cards'],assets:['Bens','Assets'],subscriptions:['Subscrições','Subscriptions'],wifiNets:['Wi-Fi','Wi-Fi'],personalInfo:['Info','Info'],'2fa':['Códigos 2FA','2FA codes'],vaultName:['Nome do cofre','Vault name']};
function syncReport(rep){
  const en=currentLang==='en',parts=[];
  if(rep.added)parts.push('+'+rep.added+(en?' new':' novos'));
  if(rep.updated)parts.push(rep.updated+(en?' updated':' atualizados'));
  if(rep.removed)parts.push(rep.removed+(en?' removed':' removidos'));
  toast((en?'Merged changes from another device':'Juntei as alterações de outro dispositivo')+(parts.length?' ('+parts.join(' · ')+')':'')+'.');
  try{logActivity('edit',(en?'Drive sync: merged':'Sincronização: versões juntas')+(parts.length?' ('+parts.join(' · ')+')':''),'☁️');}catch(e){}
  if(!rep.conflicts.length)return;
  const lines=rep.conflicts.slice(0,12).map(c=>{const L=SYNC_KEY_LBL[c.key];return '• '+(L?(en?L[1]:L[0]):c.key)+(c.name?' — <b>'+esc(c.name)+'</b>':'');}).join('<br>');
  syncModal((en?'⚠️ Edited on both devices':'⚠️ Editado nos dois dispositivos'),
    (en?'These items were changed here and on another device at the same time. I kept <b>this device\'s version</b>; the other one is in the Drive history (Settings → Data → Version history).':'Estes itens foram alterados aqui e noutro dispositivo ao mesmo tempo. Ficou a <b>versão deste dispositivo</b>; a outra está no histórico do Drive (Definições → Dados → Histórico de versões).')+'<div style="margin-top:12px;line-height:1.9">'+lines+'</div>');
}
function syncModal(title,html,extra){
  let ov=document.getElementById('sync-modal');
  if(!ov){ov=document.createElement('div');ov.id='sync-modal';ov.className='modal-overlay';ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open');});document.body.appendChild(ov);}
  const en=currentLang==='en';
  ov.innerHTML='<div class="modal" style="max-width:520px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div style="font-family:\'Playfair Display\',serif;font-size:1.15rem;color:var(--text)">'+title+'</div><button class="btn btn-ghost" style="padding:6px 12px" data-act="closeSyncModal">'+(en?'Close':'Fechar')+'</button></div><div style="font-size:.74rem;color:var(--text-muted);line-height:1.7">'+html+'</div>'+(extra||'')+'</div>';
  ov.classList.add('open');
  return ov;
}

/* ══ HISTÓRICO NO DRIVE — cópias encriptadas antes de substituir ══
   No máximo 1 cópia a cada 6 h (sempre que há conflito). Mantém: todas das últimas 48 h, 1 por dia até 14 dias,
   1 por mês até 6 meses. As cópias vão para a reciclagem do Drive (recuperáveis 30 dias), nunca apagadas de vez. */
const DRIVE_HIST='Aurora Vault — Histórico';
async function driveHistFolder(interactive){
  const id=dCfg('hist');if(id)return id;
  const q=encodeURIComponent("name='"+DRIVE_HIST+"' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  let r=await dApi('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id)',{},interactive);
  if(r.ok){const j=await r.json();if(j.files&&j.files[0]){dCfg('hist',j.files[0].id);return j.files[0].id;}}
  r=await dApi('https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:DRIVE_HIST,mimeType:'application/vnd.google-apps.folder'})},interactive);
  if(!r.ok)throw new Error('folder '+r.status);
  const j=await r.json();dCfg('hist',j.id);return j.id;
}
async function driveSnapshot(m,interactive,force){
  const fid=dCfg('fid');if(!fid||!m)return false;
  const last=+dCfg('snapAt')||0;
  if(!force&&Date.now()-last<6*3600e3)return false;
  const folder=await driveHistFolder(interactive);
  const d=new Date(m.modifiedTime||Date.now()),z=n=>String(n).padStart(2,'0');
  const name='ciphervault '+d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+' '+z(d.getHours())+'h'+z(d.getMinutes())+'.vault';
  const r=await dApi('https://www.googleapis.com/drive/v3/files/'+fid+'/copy?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,parents:[folder],description:'Aurora Vault — cópia automática (encriptada)'})},interactive);
  if(!r.ok)throw new Error('copy '+r.status);
  dCfg('snapAt',String(Date.now()));
  driveHistPrune(interactive).catch(()=>{});
  return true;
}
async function driveHistList(interactive){
  const folder=await driveHistFolder(interactive);
  const q=encodeURIComponent("'"+folder+"' in parents and trashed=false");
  const r=await dApi('https://www.googleapis.com/drive/v3/files?q='+q+'&orderBy=createdTime%20desc&pageSize=200&fields=files(id,name,createdTime,size)',{},interactive);
  if(!r.ok)throw new Error('list '+r.status);
  const j=await r.json();
  return (j.files||[]).sort((a,b)=>new Date(b.createdTime)-new Date(a.createdTime));
}
function driveHistToPrune(files,now){
  now=now||Date.now();const keep=new Set(),seenDay=new Set(),seenMonth=new Set(),H=3600e3;
  files.slice().sort((a,b)=>new Date(b.createdTime)-new Date(a.createdTime)).forEach(f=>{
    const t=new Date(f.createdTime).getTime(),age=now-t,d=new Date(t),day=d.toISOString().slice(0,10),mon=day.slice(0,7);
    if(age<=48*H){keep.add(f.id);return;}
    if(age<=14*24*H){if(!seenDay.has(day)){seenDay.add(day);keep.add(f.id);}return;}
    if(age<=183*24*H){if(!seenMonth.has(mon)){seenMonth.add(mon);keep.add(f.id);}return;}
  });
  return files.filter(f=>!keep.has(f.id));
}
async function driveHistPrune(interactive){
  const files=await driveHistList(interactive);
  for(const f of driveHistToPrune(files)){
    try{await dApi('https://www.googleapis.com/drive/v3/files/'+f.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed:true})},interactive);}catch(e){}
  }
}
async function openSyncHistory(){
  const en=currentLang==='en';
  if(!driveOn()){toast(en?'Drive sync is off.':'A sincronização com o Drive está desligada.');return;}
  if(!navigator.onLine){toast(en?'No Internet connection.':'Sem ligação à Internet.');return;}
  syncModal(en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive',en?'Loading…':'A carregar…');
  try{
    const files=await driveHistList(true);
    const fmtD=s=>new Date(s).toLocaleString(en?'en-GB':'pt-PT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const rows=files.map(f=>'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)"><div><div style="color:var(--text);font-size:.78rem">'+esc(fmtD(f.createdTime))+'</div><div style="font-size:.62rem;opacity:.7">'+Math.max(1,Math.round((+f.size||0)/1024))+' KB</div></div><button class="btn btn-ghost" style="padding:7px 14px;font-size:.7rem" data-act="syncRestoreFrom" data-arg="'+esc(f.id)+'" data-arg2="'+esc(fmtD(f.createdTime))+'">'+(en?'Restore':'Restaurar')+'</button></div>').join('');
    syncModal(en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive',
      (en?'Encrypted copies kept automatically before Drive is overwritten (all from the last 48 h, one per day for 14 days, one per month for 6 months). Restoring loads that version here — then save to confirm.':'Cópias encriptadas guardadas automaticamente antes de o Drive ser substituído (todas das últimas 48 h, uma por dia durante 14 dias, uma por mês durante 6 meses). Restaurar carrega essa versão aqui — depois gravas para confirmar.')
      +'<div style="margin-top:10px">'+(rows||'<div style="padding:14px 0">'+(en?'No copies yet — the first one is made on the next save.':'Ainda não há cópias — a primeira é feita na próxima gravação.')+'</div>')+'</div>');
  }catch(e){syncModal(en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive',(en?'Could not read the history: ':'Não consegui ler o histórico: ')+esc(e.message||''));}
}
async function syncRestoreFrom(id,label){
  const en=currentLang==='en';
  if(!confirm(en?`Replace the current vault with the version from ${label}?\n\nThe current version is kept in the local history.`:`Substituir o cofre atual pela versão de ${label}?\n\nA versão atual fica guardada no histórico local.`))return;
  try{
    const r=await dApi('https://www.googleapis.com/drive/v3/files/'+id+'?alt=media',{},true);
    if(!r.ok)throw new Error('download '+r.status);
    const txt=await r.text();
    let data;
    try{data=await syncDecrypt(txt,masterPwRaw);}
    catch(e){const pw=prompt(en?'This copy uses a different master password. Enter the password used at that time:':'Esta cópia usa outra palavra-passe mestra. Escreve a palavra-passe usada nessa altura:');if(!pw)return;data=await syncDecrypt(txt,pw);}
    try{if(pendingVaultText)await pushSnapshot(JSON.parse(pendingVaultText));}catch(e){}
    const totpDiff=!syncEq(data.totpEnc,totpEnc)||!syncEq(data.totpRecWrap,totpRecWrap);
    syncApplyData(data);
    if(totpDiff&&totpRecWrap){totpKey=null;totpUnlocked=false;totp=[];}
    markUnsaved();renderAll();
    const ov=document.getElementById('sync-modal');if(ov)ov.classList.remove('open');
    toast(en?`Version from ${label} restored — save to confirm.`:`Versão de ${label} restaurada — grava para confirmar.`);
  }catch(e){toast((en?'Could not restore: ':'Não consegui restaurar: ')+(e.message||''));}
}
window.addEventListener('online',()=>{setTimeout(()=>{try{driveFlushPending();}catch(e){}try{driveCheckOnFocus();}catch(e){}},1500);});

// ── sincronizar agora (botão da barra) ──
async function driveSyncNow(){
  const en=currentLang==='en';
  if(!driveOn()){toast(en?'Drive sync is off — turn it on in Settings.':'Sincronização desligada — liga nas Definições.');return;}
  if(!navigator.onLine){toast(en?'No Internet connection.':'Sem ligação à Internet.');return;}
  toast(en?'Checking Drive…':'A verificar o Drive…');
  try{
    const loaded=await driveCheckOnOpen();
    if(!loaded)toast(en?'Already up to date ✓':'Já estava atualizado ✓');
  }catch(e){toast(en?'Sync failed.':'A sincronização falhou.');}
}

// ── indicador na barra de topo ──
function renderDriveChip(state){
  const el=document.getElementById('drive-chip');if(!el)return;
  const sb=document.getElementById('drive-sync-btn');if(sb)sb.style.display=driveOn()?'inline-flex':'none';
  if(!driveOn()){el.style.display='none';return;}
  el.style.display='inline-flex';
  const en=currentLang==='en';
  if(driveBusy){el.textContent='☁️ …';el.title=en?'Syncing':'A sincronizar';el.style.color='var(--text-muted)';return;}
  const map={
    ok:['☁️ ✓',en?'Synced with Drive':'Sincronizado com o Drive','var(--green)'],
    pend:['☁️ !',en?'Changes pending upload':'Alterações por enviar','var(--accent)'],
    old:['☁️ ↓',en?'Newer version on Drive':'Há versão mais recente no Drive','var(--accent)'],
    off:['☁️ ✕',en?'No connection to Drive':'Sem ligação ao Drive','var(--text-muted)']
  };
  const s=map[state]||map.ok;
  el.textContent=s[0];el.title=s[1];el.style.color=s[2];
}

// ── definições ──
function renderDriveSettings(){
  const box=document.getElementById('drive-state');if(!box)return;
  const en=currentLang==='en';
  const cid=dCfg('cid'),fid=dCfg('fid');
  const inp=document.getElementById('drive-cid');if(inp&&!inp.value)inp.value=cid;
  let s;
  if(!cid)s=en?'Not configured — paste your Google credential above.':'Por configurar — cola a tua credencial da Google acima.';
  else if(!fid)s=en?'Credential saved. Now upload the current vault to Drive.':'Credencial guardada. Falta enviar o cofre atual para o Drive.';
  else if(driveOn())s=(en?'Active. File on Drive: ':'Ativo. Ficheiro no Drive: ')+DRIVE_NAME+(dCfg('mtime')?(en?' · last sync ':' · última sync ')+new Date(dCfg('mtime')).toLocaleString(en?'en-GB':'pt-PT'):'');
  else s=en?'Configured but switched off.':'Configurado mas desligado.';
  box.textContent=s;
  const hb=document.getElementById('drive-hist-btn');if(hb){hb.style.display=fid?'':'none';hb.textContent=en?'🕘 Version history on Drive':'🕘 Histórico de versões no Drive';}
  const b=document.getElementById('drive-toggle-btn');
  if(b)b.textContent=driveOn()?(en?'Turn off sync':'Desligar sincronização'):(en?'Turn on sync':'Ligar sincronização');
  renderDriveChip();
}
function saveDriveCid(){
  const en=currentLang==='en';
  const v=(document.getElementById('drive-cid').value||'').trim();
  dCfg('cid',v||null);
  toast(v?(en?'Credential saved.':'Credencial guardada.'):(en?'Credential removed.':'Credencial removida.'));
  renderDriveSettings();
}
// ── ligar a um ficheiro já existente no Drive (em vez de criar um novo) ──
async function driveListMatches(){
  const q=encodeURIComponent("name='"+DRIVE_NAME+"' and trashed=false");
  const r=await dApi('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id,name,modifiedTime,size,mimeType,shortcutDetails)&orderBy=modifiedTime desc',{},true);
  if(!r.ok)throw new Error('list '+r.status);
  const j=await r.json();
  const files=j.files||[];
  // Atalhos: usar o ficheiro real a que apontam (id + data reais)
  const out=[];
  for(const f of files){
    if(f.mimeType==='application/vnd.google-apps.shortcut'&&f.shortcutDetails&&f.shortcutDetails.targetId){
      try{
        const r2=await dApi('https://www.googleapis.com/drive/v3/files/'+f.shortcutDetails.targetId+'?fields=id,name,modifiedTime,size',{},false);
        if(r2.ok){out.push(await r2.json());continue;}
      }catch(e){}
    }else if(f.mimeType!=='application/vnd.google-apps.shortcut'){
      out.push(f);
    }
  }
  // remover duplicados (mesmo ficheiro real encontrado por 2 vias) e ordenar por data
  const seen=new Set();
  return out.filter(f=>{if(seen.has(f.id))return false;seen.add(f.id);return true;})
            .sort((a,b)=>new Date(b.modifiedTime)-new Date(a.modifiedTime));
}
async function driveOpenLinkPicker(){
  const en=currentLang==='en';
  if(!masterKey){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  if(!dCfg('cid')){toast(en?'Paste the credential first.':'Cola a credencial primeiro.');return;}
  const box=document.getElementById('drive-link-list');
  if(!box)return;
  box.innerHTML='<div class="fuel-hint">'+(en?'Searching Drive…':'A procurar na Drive…')+'</div>';
  document.getElementById('drive-link-overlay').classList.add('open');
  try{
    const files=await driveListMatches();
    if(!files.length){
      box.innerHTML='<div class="fuel-hint">'+(en?'No ciphervault.vault file found on Drive.':'Não foi encontrado nenhum ficheiro ciphervault.vault na Drive.')+'</div>';
      return;
    }
    box.innerHTML=files.map(f=>{
      const d=new Date(f.modifiedTime);
      const ds=d.toLocaleString(en?'en-GB':'pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
      const isCurrent=f.id===dCfg('fid');
      const kb=f.size?(parseInt(f.size)/1024).toFixed(0)+' KB':'';
      return '<div class="fuel-row" style="flex-direction:column;align-items:flex-start;gap:6px'+(isCurrent?';border-color:var(--accent-dim)':'')+'">'+
        '<span class="fuel-main">'+(isCurrent?'⭐ ':'')+(en?'Modified':'Modificado')+': '+ds+' · '+kb+'</span>'+
        '<div style="display:flex;gap:6px;width:100%">'+
          '<button type="button" class="att-btn" style="flex:1" data-act="driveLinkExisting" data-arg="'+esc(f.id)+'">'+(en?'Load this':'Carregar este')+'</button>'+
          '<button type="button" class="att-btn" style="flex:1" data-act="driveLinkKeepLocal" data-arg="'+esc(f.id)+'">'+(en?'Use, keep my current data':'Usar, manter os meus dados')+'</button>'+
        '</div>'+
      '</div>';
    }).join('')+'<div class="fuel-hint" style="margin-top:8px">'+(en?'"Load this" replaces what is on screen with that version. "Use, keep my current data" points to that file but uploads what you have now on your next save.':'"Carregar este" substitui o que está no ecrã por essa versão. "Usar, manter os meus dados" aponta para esse ficheiro mas envia o que tens agora na próxima gravação.')+'</div>';
  }catch(e){
    box.innerHTML='<div class="fuel-hint">'+(en?'Search failed.':'A procura falhou.')+'</div>';
  }
}
function closeDriveLinkPicker(){document.getElementById('drive-link-overlay').classList.remove('open');}
async function driveLinkExisting(fid){
  const en=currentLang==='en';
  closeDriveLinkPicker();
  if(!confirm(en?'Load this version and use it from now on? Your current screen will be replaced.':'Carregar esta versão e passar a usá-la a partir de agora? O que tens no ecrã é substituído.'))return;
  try{
    dCfg('fid',fid);
    driveBusy=true;renderDriveChip();
    const txt=await driveDownload(true);
    await applyContainerText(txt);
    const m=await driveMeta(false);
    if(m&&m.modifiedTime)dCfg('mtime',m.modifiedTime);
    dCfg('on','1');
    driveBusy=false;renderDriveChip('ok');
    toast(en?'Linked. This is now the file in use.':'Ligado. Este passa a ser o ficheiro em uso.');
    renderDriveSettings();
  }catch(e){
    driveBusy=false;renderDriveChip('off');
    toast((en?'Failed: ':'Falhou: ')+e.message);
  }
}
async function driveLinkKeepLocal(fid){
  const en=currentLang==='en';
  closeDriveLinkPicker();
  if(!confirm(en?'Link to this file WITHOUT loading it — what you have on screen now stays, and will overwrite it on your next save. Continue?':'Ligar a este ficheiro SEM o carregar — o que tens agora no ecrã mantém-se, e vai substituir o conteúdo dele na próxima vez que gravares. Continuar?'))return;
  dCfg('fid',fid);dCfg('on','1');dCfg('mtime',null);
  toast(en?'Linked. Save now (💾) to upload your current data.':'Ligado. Grava agora (💾) para enviar os teus dados atuais.');
  renderDriveSettings();renderDriveChip('pend');
}
async function driveFirstUpload(){
  const en=currentLang==='en';
  if(!masterKey){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  if(!dCfg('cid')){toast(en?'Paste the credential first.':'Cola a credencial primeiro.');return;}
  if(!confirm(en?'Upload the current vault to Drive? A new file will be created there.':'Enviar o cofre atual para o Drive? Vai ser criado lá um ficheiro novo.'))return;
  try{
    driveBusy=true;renderDriveChip();
    if(totpUnlocked)totpEnc=await encryptTotpArray();
    const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
    const json=JSON.stringify(mkContainer(ks,p));
    await driveUpload(json,true);
    await localVaultSave(json,false);
    dCfg('on','1');
    driveBusy=false;
    toast(en?'Vault uploaded to Drive.':'Cofre enviado para o Drive.');
    renderDriveSettings();
  }catch(e){
    driveBusy=false;renderDriveChip('off');
    toast((en?'Failed: ':'Falhou: ')+e.message);
  }
}
function driveToggle(){
  const en=currentLang==='en';
  if(driveOn()){dCfg('on',null);toast(en?'Sync off.':'Sincronização desligada.');}
  else{
    if(!dCfg('cid')||!dCfg('fid')){toast(en?'Configure and upload first.':'Configura e envia o cofre primeiro.');return;}
    dCfg('on','1');toast(en?'Sync on.':'Sincronização ligada.');
  }
  renderDriveSettings();
}
function driveForget(){
  const en=currentLang==='en';
  if(!confirm(en?'Disconnect Drive? The file stays there; the app just stops using it.':'Desligar o Drive? O ficheiro fica lá; a app é que deixa de o usar.'))return;
  ['cid','fid','on','mtime'].forEach(k=>dCfg(k,null));
  driveToken=null;driveTokenExp=0;
  const inp=document.getElementById('drive-cid');if(inp)inp.value='';
  renderDriveSettings();
  toast(en?'Disconnected.':'Desligado.');
}

function vaultPayload(){
  const base={fmt:VAULT_FMT,vault,notes,bankCards,activityLog,documents,trash,customCats,docFolders,vaultFolders,wifiNets,legacyNote,legacyOwner,personalInfo,subscriptions,storeCards,vaultName,assets,savedAt:Date.now()};
  if(totpRecWrap){
    base.totpEnc=totpEnc;
    base.totpRecWrap=totpRecWrap;
  }else{
    base.totp=totp;
  }
  return Object.assign({},payloadExtras,base);
}
async function downloadBackupNow(){
  const en=currentLang==='en';
  if(presentationMode){toast(en?'Demo mode — nothing is saved.':'Modo demonstração — nada é guardado.');return;}
  if(!masterKey){toast(en?'Open the vault first.':'Abre o cofre primeiro.');return;}
  if(vaultReadOnly){alert(en?'Blocked: vault from a newer app version.':'Bloqueado: cofre de uma versão mais recente da app.');return;}
  try{
    if(totpUnlocked)totpEnc=await encryptTotpArray();
    const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
    const container=mkContainer(ks,p);
    const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    const stamp=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    downloadVault(container,`ciphervault_backup_${stamp}.vault`);
    toast(en?'Backup downloaded ✓':'Cópia descarregada ✓');
  }catch(e){
    toast(en?'Could not create the backup.':'Não foi possível criar a cópia.');
  }
}
// Uma gravação de cada vez: uma automática e uma manual em paralelo podiam acabar por escrever a versão
// mais antiga por último no ficheiro.
let _saveQ=Promise.resolve();
function saveFile(opts){const run=_saveQ.then(()=>saveFileRun(opts));_saveQ=run.catch(()=>{});return run;}
// Só dá o cofre como gravado se nada mudou entretanto (antes, o que se alterava durante a gravação ficava por gravar sem aviso)
function markSavedAt(seq){
  markSaved();
  if(avSeq!==seq){hasUnsaved=true;const b=document.querySelector('.btn-save-file');if(b)b.classList.add('has-changes');try{avRenderSaveState();avScheduleAutoSave();}catch(e){}}
}
async function saveFileRun(opts){
  const auto=!!(opts&&opts.auto);
  if(presentationMode){if(auto)return;toast(currentLang==='en'?'Demo mode — nothing is saved.':'Modo demonstração — nada é guardado.');return;}
  if(!masterKey)return;
  if(vaultReadOnly){
    if(auto)return;
    alert(currentLang==='en'
      ?'Saving is blocked: this vault comes from a newer version of the app. Update Aurora Vault first.'
      :'Gravação bloqueada: este cofre vem de uma versão mais recente da app. Atualiza o Aurora Vault primeiro.');
    return;
  }
  if(totpUnlocked&&(!totpEnc||syncStable(totp)!==totpSig))totpEnc=await encryptTotpArray();
  const seq=avSeq;
  const ks=keySnap(),p=await encrypt(ks.key,vaultPayload());
  const container=mkContainer(ks,p);
  const json=JSON.stringify(container);pendingVaultText=json;
  const dateStr=new Date().toISOString().slice(0,10);
  lastSavedAt=Date.now();
  let snapAt=0;try{snapAt=+localStorage.getItem('av_snap_at')||0;}catch(e){}
  if(!auto||Date.now()-snapAt>10*60e3){pushSnapshot(container);try{localStorage.setItem('av_snap_at',String(Date.now()));}catch(e){}}
  try{await localVaultSave(json,!driveOn());}catch(e){}
  if(!auto){try{driveAfterSave(json);}catch(e){}avLastDriveUp=Date.now();}
  if(auto){ // gravação automática: nunca abre janelas nem descarrega ficheiros
    let wrote=false,synced=false;
    if(vaultFileHandle){try{if((await vaultFileHandle.queryPermission({mode:'readwrite'}))==='granted'){const w=await vaultFileHandle.createWritable();await w.write(json);await w.close();wrote=true;}}catch(e){}}
    else if(!FSA_OK){try{const l=await localVaultGet();wrote=!!l&&l.json===json;}catch(e){}if(wrote){avDevPersist();avMarkChange();}}
    if(driveOn()){
      const since=Date.now()-avLastDriveUp;
      if(wrote&&since<30000){try{await localVaultSave(json,true);}catch(e){}avDriveFlushLater(30000-since);}
      else{try{await driveAfterSave(json);}catch(e){}try{const loc=await localVaultGet();synced=!(loc&&loc.pending);}catch(e){}avLastDriveUp=Date.now();}
    }
    if(wrote||synced)markSavedAt(seq);
    return {wrote,synced};
  }
  // Sem handle mas com API: escolher onde guardar (uma vez)
  if(!vaultFileHandle&&FSA_OK){
    try{
      vaultFileHandle=await window.showSaveFilePicker({suggestedName:'ciphervault.vault',types:[{description:'Aurora Vault',accept:{'application/octet-stream':['.vault']}}]});
      try{await idbSet('vaultHandle',vaultFileHandle);}catch(e){}
    }catch(e){/* cancelou o picker → cai no download */}
  }
  if(vaultFileHandle){
    try{
      let perm=await vaultFileHandle.queryPermission({mode:'readwrite'});
      if(perm!=='granted')perm=await vaultFileHandle.requestPermission({mode:'readwrite'});
      if(perm==='granted'){
        const w=await vaultFileHandle.createWritable();
        await w.write(json);await w.close();
        let bk='';
        try{
          if(localStorage.getItem('cv_lastbk')!==dateStr){
            downloadVault(container,`ciphervault_backup_${dateStr}.vault`);
            localStorage.setItem('cv_lastbk',dateStr);
            bk=currentLang==='en'?' (+ daily backup)':' (+ backup do dia)';
          }
        }catch(e){}
        toast(`💾 ${currentLang==='en'?'Saved to':'Guardado em'} ${vaultFileHandle.name}${bk} ✓`);
        markSavedAt(seq);return;
      }
    }catch(e){/* falhou escrita direta → fallback download */}
  }
  if(!FSA_OK){ // browser sem acesso direto a ficheiros → o cofre vive (encriptado) no armazenamento da app neste dispositivo
    let ok=false;try{const l=await localVaultGet();ok=!!l&&l.json===json;}catch(e){}
    if(ok){avDevPersist();avMarkChange();markSavedAt(seq);toast(currentLang==='en'?'💾 Saved on this device ✓':'💾 Guardado neste dispositivo ✓');setTimeout(()=>{try{avAutoBackupMaybe();}catch(e){}},600);return;}
  }
  downloadVault(container,'ciphervault.vault');
  setTimeout(()=>downloadVault(container,`ciphervault_backup_${dateStr}.vault`),400);
  markSavedAt(seq);
  if(FSA_OK&&vaultFileHandle){
    alert(currentLang==='en'
      ?'⚠️ Could not write to your .vault file directly (permission denied or file moved).\n\nA copy was downloaded to your Downloads folder instead. Your original file was NOT updated — replace it with the downloaded copy, or use "Open Vault" to pick it again.'
      :'⚠️ Não foi possível escrever diretamente no teu ficheiro .vault (permissão negada ou ficheiro movido).\n\nFoi descarregada uma cópia para as Transferências. O teu ficheiro original NÃO foi atualizado — substitui-o pela cópia descarregada, ou usa "Abrir Cofre" para o escolher outra vez.');
  }else toast(t('toastSaved'));
}
window.addEventListener('beforeunload',e=>{if(hasUnsaved&&masterKey&&!presentationMode){e.preventDefault();e.returnValue=currentLang==='en'?'You have unsaved changes. Are you sure you want to leave?':'Tens alterações não guardadas. Tens a certeza que queres sair?';return e.returnValue;}});
// Descarrega e liberta o URL (antes nunca era revogado: cada gravação/exportação deixava uma cópia do ficheiro presa em memória)
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{try{document.body.removeChild(a);}catch(e){}URL.revokeObjectURL(url);},10000);
}
function downloadVault(c,filename='ciphervault.vault'){
  downloadBlob(new Blob([JSON.stringify(c)],{type:'application/octet-stream'}),filename);
}

