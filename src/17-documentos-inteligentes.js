
/* ══ v10.13 — DOCUMENTOS INTELIGENTES: a Aurora lê, lembra e responde ══
   O texto de cada documento (PDF ou foto, lida no dispositivo) fica guardado ENCRIPTADO dentro do cofre, junto ao ficheiro,
   com os dados principais já tirados: tipo, entidade, total, datas, NIF, IBAN, apólice, matrícula. Nada sai do dispositivo. */
const DOC_TEXT_MAX=30000;

// PDF → texto com as mudanças de linha (a versão rápida junta tudo numa linha só)
async function avPdfTextFull(dataUrl,maxPages){
  const lib=await avLoadPdf();
  const buf=new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
  const doc=await lib.getDocument({data:buf,isEvalSupported:false}).promise;let out='';
  try{
    for(let p=1;p<=Math.min(maxPages||10,doc.numPages);p++){
      const tc=await (await doc.getPage(p)).getTextContent();let lastY=null;
      tc.items.forEach(it=>{const y=it.transform?Math.round(it.transform[5]):null;if(lastY!==null&&y!==null&&Math.abs(y-lastY)>2&&!out.endsWith('\n'))out+='\n';else if(out&&!/[\s\n]$/.test(out))out+=' ';out+=it.str;if(it.hasEOL)out+='\n';lastY=y;});
      out+='\n';if(out.length>DOC_TEXT_MAX)break;
    }
  }finally{try{doc.destroy();}catch(e){}}
  return out.slice(0,DOC_TEXT_MAX);
}
// ficheiro → texto (PDF, foto por OCR, texto simples)
async function avDocExtractText(file,opts){
  if(!file||!file.data)return {text:'',src:''};
  const type=file.type||'',name=file.name||'';
  const race=(p,ms)=>Promise.race([p,new Promise((_,rj)=>setTimeout(()=>rj(new Error('tempo')),ms))]);
  if(/pdf$/i.test(type)||/\.pdf$/i.test(name))return {text:await race(avPdfTextFull(file.data,10),30000),src:'pdf'};
  if(/^image\//.test(type)&&(!opts||opts.ocr!==false))return {text:String(await race(avOcrText(file.data),90000)||'').slice(0,DOC_TEXT_MAX),src:'ocr'};
  if(/^text\//.test(type)||/\.(txt|csv|md)$/i.test(name)){try{const b=atob((file.data.split(',')[1]||''));return {text:decodeURIComponent(escape(b)).slice(0,DOC_TEXT_MAX),src:'txt'};}catch(e){}}
  return {text:'',src:''};
}

/* ── dados principais ── */
function avNifOk(n){n=String(n);if(!/^[1235689]\d{8}$/.test(n))return false;let s=0;for(let i=0;i<8;i++)s+=(+n[i])*(9-i);const c=11-(s%11);return (c>=10?0:c)===+n[8];}
function avIbanOk(s){s=String(s).replace(/\s+/g,'').toUpperCase();if(!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s))return false;const r=s.slice(4)+s.slice(0,4);let m=0;for(const ch of r){const v=/\d/.test(ch)?ch:String(ch.charCodeAt(0)-55);for(const d of v)m=(m*10+(+d))%97;}return m===1;}
function avMoney(s){s=String(s).replace(/\s/g,'');if(/,\d{2}$/.test(s))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'');const v=parseFloat(s);return isNaN(v)?null:v;}
const AV_ENTITIES=['EDP','Galp','Endesa','Iberdrola','Goldenergy','Repsol','EPAL','Águas do Porto','SMAS','Indaqua','MEO','NOS','Vodafone','NOWO','DIGI','Fidelidade','Tranquilidade','Allianz','Ageas','Generali','Liberty','Zurich','Ok! Teleseguros','Logo','Lusitania','Caixa Geral de Depósitos','CGD','Millennium','BCP','Santander','Novo Banco','BPI','Montepio','Crédito Agrícola','ActivoBank','Revolut','Continente','Pingo Doce','Lidl','Auchan','Worten','Fnac','MediaMarkt','Radio Popular','IKEA','Leroy Merlin','Decathlon','Apple','Samsung','Autoridade Tributária','Segurança Social','SNS','Via Verde','Brisa','Netflix','Spotify'];
function avDocEntity(n){for(const e of AV_ENTITIES){const k=aurNorm(e);if(new RegExp('(^|[^a-z0-9])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)').test(n))return e;}return '';}
function avDateAny(s){
  let m=s.match(/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})/);if(m)return avIso(+m[3],+m[2],+m[1]);
  m=s.match(/(\d{4})-(\d{2})-(\d{2})/);if(m)return avIso(+m[1],+m[2],+m[3]);
  m=aurNorm(s).match(/(\d{1,2})\s+(?:de\s+)?([a-z]{3,9})\s+(?:de\s+)?(\d{4})/);if(m){const mo=AV_MON[m[2].slice(0,3)];if(mo)return avIso(+m[3],mo,+m[1]);}
  return '';
}
function avIso(y,mo,d){if(y<1990||y>2099||mo<1||mo>12||d<1||d>31)return '';const dt=new Date(y,mo-1,d);if(dt.getMonth()!==mo-1)return '';const z=x=>String(x).padStart(2,'0');return y+'-'+z(mo)+'-'+z(d);}
function avDatesIn(s){const out=[];const re=/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})|(\d{4})-(\d{2})-(\d{2})/g;let m;while((m=re.exec(s))){const d=m[1]?avIso(+m[3],+m[2],+m[1]):avIso(+m[4],+m[5],+m[6]);if(d)out.push(d);}return out;}
function avDocFacts(text,name){
  const raw=String(text||''),lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean),N=aurNorm(raw+' '+(name||'')),f={};
  const kind=typeof AVF_KINDS!=='undefined'?AVF_KINDS.find(k=>k.rx.test(N)):null;if(kind)f.kind=kind.k;
  const ent=avDocEntity(N);if(ent)f.entity=ent;
  const near=(rx,i)=>{const L=aurNorm(lines[i]||'');return rx.test(L);};
  const pickDate=(rx)=>{for(let i=0;i<lines.length;i++)if(near(rx,i)){const d=avDateAny(lines[i])||avDateAny(lines[i+1]||'');if(d)return d;}return '';};
  f.issueDate=pickDate(/data (de )?(emissao|da fatura|do documento|do recibo)|emitid[ao] (em|a)|invoice date|issue date|date of issue/);
  f.dueDate=pickDate(/data (limite|de vencimento|de pagamento|limite de pagamento)|vencimento|pagar ate|pagamento ate|due date/);
  f.expiry=pickDate(/validade|valido ate|valida ate|expira|caduca|valid until|expiry|date of expiry/);
  // período «de 01/10/2026 a 30/09/2027» (seguros, contratos)
  for(let i=0;i<lines.length&&!f.endDate;i++){const L=aurNorm(lines[i]);if(/periodo|vigencia|inicio|termo|valido de|coverage|period/.test(L)){const ds=avDatesIn(lines[i]+' '+(lines[i+1]||''));if(ds.length>=2){f.startDate=ds[0];f.endDate=ds[1];}}}
  if(!f.endDate){f.endDate=pickDate(/data (de )?(termo|fim)|termo|fim do contrato|end date/);f.startDate=f.startDate||pickDate(/data (de )?inicio|inicio|start date/);}
  // total a pagar
  const moneyRe=/(\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d+[.,]\d{2})\s*(?:€|eur)?/gi;
  const totRx=[/total a pagar|valor a pagar|montante a pagar|a pagar|amount due|total due/,/total (c\/|com) iva|total geral|total da fatura|valor total|total/];
  for(const rx of totRx){for(let i=0;i<lines.length&&f.total==null;i++){if(!near(rx,i)||/subtotal|total sem iva|total iliquido|base tributavel/.test(aurNorm(lines[i])))continue;const src=/\d[.,]\d{2}/.test(lines[i])?lines[i]:(lines[i+1]||'');const all=[...src.matchAll(moneyRe)].map(m=>avMoney(m[1])).filter(v=>v!=null);if(all.length)f.total=all[all.length-1];}if(f.total!=null)break;}
  // apólice, matrícula, NIF, IBAN
  let m=raw.match(/ap[óo]lice\s*(?:n\.?\s*[ºo°.]?|n[uú]mero|no\.?|number)?\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\-\/.]{4,})/i)||raw.match(/policy\s*(?:no\.?|number|#)\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\-\/.]{4,})/i);if(m)f.policy=m[1].replace(/[.\-\/]+$/,'');
  m=raw.toUpperCase().match(/\b([A-Z]{2}[-\s]\d{2}[-\s][A-Z]{2}|\d{2}[-\s][A-Z]{2}[-\s]\d{2}|\d{2}[-\s]\d{2}[-\s][A-Z]{2}|[A-Z]{2}[-\s]\d{2}[-\s]\d{2})\b/);if(m)f.plate=m[1].replace(/\s/g,'-');
  const nifs=new Set();lines.forEach(l=>{if(/nif|contribuinte|nipc|fiscal|vat|tax/i.test(aurNorm(l)))(l.match(/\b\d{9}\b/g)||[]).forEach(n=>{if(avNifOk(n))nifs.add(n);});});if(nifs.size)f.nifs=[...nifs];
  const ibans=new Set();(raw.toUpperCase().match(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30}\b/g)||[]).forEach(s=>{const c=s.replace(/\s+/g,'');if(avIbanOk(c))ibans.add(c);});if(ibans.size)f.ibans=[...ibans];
  Object.keys(f).forEach(k=>{if(f[k]===''||f[k]==null)delete f[k];});
  return f;
}

/* ── ler documentos (um de cada vez, em segundo plano) ── */
const AVDX={q:[],busy:false};
function avDocSetText(d,text,src){
  d.text=String(text||'').slice(0,DOC_TEXT_MAX);d.textSrc=src||'';d.textAt=Date.now();
  d.facts=avDocFacts(d.text,d.file&&d.file.name);
  if(!d.expiry&&d.facts.expiry&&(d.facts.kind==='identidade'||d.cat==='pessoal'))d.expiry=d.facts.expiry;
}
function avDocIndexLater(ids,opts){(ids||[]).forEach(id=>{if(!AVDX.q.some(x=>x.id===id))AVDX.q.push({id,opts:opts||{}});});avDocIndexRun();}
async function avDocIndexRun(){
  if(AVDX.busy)return;AVDX.busy=true;let done=0;
  try{
    while(AVDX.q.length){
      if(typeof masterKey==='undefined'||!masterKey){AVDX.q=[];break;}
      const {id,opts}=AVDX.q.shift();const d=documents.find(x=>x.id===id);
      if(!d||!d.file||!d.file.data||(d.textAt&&!opts.force))continue;
      if(/^image\//.test(d.file.type||'')&&opts.ocr===false)continue;
      try{const r=await avDocExtractText(d.file,opts);avDocSetText(d,r.text,r.src);done++;}catch(e){d.textAt=Date.now();d.text=d.text||'';}
      if(opts.progress)opts.progress(d);
    }
  }finally{AVDX.busy=false;}
  if(done&&typeof markUnsaved==='function')markUnsaved();
  return done;
}
// guardar/editar um documento pela janela: lê o ficheiro novo
(function(){
  if(typeof saveDoc!=='function')return;const orig=saveDoc;
  saveDoc=function(){
    const prev=typeof editingDocId!=='undefined'&&editingDocId?documents.find(d=>d.id===editingDocId):null;
    const prevData=prev&&prev.file?prev.file.data:null,before=new Set(documents.map(d=>d.id));
    const r=orig.apply(this,arguments);
    documents.forEach(d=>{
      const isNew=!before.has(d.id),changed=prev&&d.id===prev.id&&((d.file&&d.file.data)||null)!==prevData;
      if(changed){delete d.text;delete d.facts;delete d.textAt;delete d.textSrc;}
      if((isNew||changed)&&d.file)avDocIndexLater([d.id]);
    });
    return r;
  };
})();
// ao abrir o cofre: lê em segundo plano os PDFs ainda por ler (as fotos só a pedido — o OCR é mais pesado)
function avDocIndexPending(){try{if(!masterKey)return;avDocIndexLater(documents.filter(d=>d.file&&!d.textAt&&!/^image\//.test(d.file.type||'')).map(d=>d.id),{ocr:false});}catch(e){}}
(function(){if(typeof doUnlock!=='function')return;const du=doUnlock;doUnlock=function(){const r=du.apply(this,arguments);setTimeout(avDocIndexPending,4000);return r;};})();

/* ── depois de guardar pela Aurora: resumo do que leu + ações sugeridas ── */
function avFactsLine(f){
  const p=[];if(f.entity)p.push('<b>'+aurEsc(f.entity)+'</b>');
  if(f.total!=null)p.push(aurL('total ','total ')+'<b>'+aurMoney(f.total)+'</b>');
  if(f.issueDate)p.push(aurL('emitido a ','issued ')+aurDate(f.issueDate));
  if(f.dueDate)p.push(aurL('pagar até ','due ')+aurDate(f.dueDate));
  if(f.policy)p.push(aurL('apólice ','policy ')+'<b>'+aurEsc(f.policy)+'</b>');
  if(f.plate)p.push(aurL('matrícula ','plate ')+aurEsc(f.plate));
  if(f.endDate)p.push(aurL('até ','until ')+aurDate(f.endDate));
  if(f.expiry)p.push(aurL('validade ','expiry ')+aurDate(f.expiry));
  if(f.ibans)p.push('IBAN '+aurEsc(f.ibans[0].slice(0,4)+'…'+f.ibans[0].slice(-4)));
  return p.join(' · ');
}
function avDocOwnerIbans(){const out=new Set();aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>aurA(p.fields).forEach(x=>{const v=String(x.value||'').replace(/\s+/g,'').toUpperCase();if(v.length>=15&&avIbanOk(v))out.add(v);}));return out;}
function avDocVehicleFor(f){const V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle');if(f.plate){const p=f.plate.replace(/[-\s]/g,'');const hit=V.find(v=>String(v.plate||'').replace(/[-\s]/g,'').toUpperCase()===p);if(hit)return hit;}return V.length===1?V[0]:null;}
function avDocSuggest(d){
  const f=d.facts||{},chips=[],en=avEn();
  if(f.kind==='fatura'&&f.total!=null)chips.push({label:aurL('🧾 Criar garantia (3 anos)','🧾 Create warranty (3 years)'),fn:()=>{
    const a={id:'a'+Date.now().toString(36),kind:'warranty',name:d.title,store:f.entity||'',price:String(f.total),buyDate:f.issueDate||new Date().toISOString().slice(0,10),years:'3',attachments:[{id:'x'+Date.now().toString(36),name:d.file.name,type:d.file.type,size:d.file.size,data:d.file.data}]};
    assets.push(a);markUnsaved();try{renderAll();}catch(e){}
    aurSay(aurL('✓ Garantia criada: <b>'+aurEsc(a.name)+'</b> até '+aurDate(avAddYears(a.buyDate,3))+'. Confirma o nome do produto.','✓ Warranty created: <b>'+aurEsc(a.name)+'</b> until '+aurDate(avAddYears(a.buyDate,3))+'. Check the product name.'),[{label:aurL('Abrir','Open'),fn:()=>{aurClose();switchTab('warranty');setTimeout(()=>{try{openAssetModal('warranty',a.id);}catch(e){}},200);}}]);}});
  const veh=(f.kind==='seguro'||f.policy)&&f.endDate?avDocVehicleFor(f):null;
  if(veh&&veh.insurance!==f.endDate)chips.push({label:aurL('🚗 Seguro do '+veh.name+' até '+aurDate(f.endDate),'🚗 '+veh.name+' insurance until '+aurDate(f.endDate)),fn:()=>{veh.insurance=f.endDate;if(f.plate&&!veh.plate)veh.plate=f.plate;markUnsaved();try{renderAll();}catch(e){}aurSay(aurL('✓ Pus o fim do seguro do <b>'+aurEsc(veh.name)+'</b> a '+aurDate(f.endDate)+' — aviso-te antes.','✓ Set the <b>'+aurEsc(veh.name)+'</b> insurance end to '+aurDate(f.endDate)+' — I’ll remind you.'));}});
  const mine=avDocOwnerIbans(),newIban=(f.ibans||[]).find(i=>!mine.has(i));
  if(newIban&&f.kind==='banco')chips.push({label:aurL('💾 Guardar este IBAN nos meus dados','💾 Save this IBAN to my details'),fn:()=>{
    let p=aurA(typeof personalInfo!=='undefined'?personalInfo:[])[0];if(!p){p={id:'p'+Date.now().toString(36),name:en?'Me':'Eu',fields:[]};personalInfo.push(p);}
    p.fields.push({id:'f'+Date.now().toString(36),label:'IBAN',value:newIban});markUnsaved();try{renderAll();}catch(e){}aurSay(aurL('✓ IBAN guardado nos dados de <b>'+aurEsc(p.name)+'</b>.','✓ IBAN saved to <b>'+aurEsc(p.name)+'</b>’s details.'));}});
  return chips;
}
function avAddYears(iso,y){const d=new Date(iso);d.setFullYear(d.getFullYear()+y);return d;}
async function avDocAfterSave(ids){
  const docs=ids.map(id=>documents.find(d=>d.id===id)).filter(Boolean);if(!docs.length)return;
  for(const d of docs){if(!d.textAt&&d.file){try{const r=await avDocExtractText(d.file);avDocSetText(d,r.text,r.src);}catch(e){}}}
  markUnsaved();
  docs.forEach(d=>{const f=d.facts||{};const line=avFactsLine(f);const chips=avDocSuggest(d);
    if(line||chips.length)aurSay('🔎 '+aurL('Li <b>','I read <b>')+aurEsc(d.title)+'</b>'+(line?': '+line:'')+'.'+(chips.length?aurL('\nQueres que faça algo com isto?','\nWant me to do something with it?'):''),chips);});
}

/* ── Aurora: perguntas sobre os documentos ── */
function avDocsWithText(){return aurA(typeof documents!=='undefined'?documents:[]).filter(d=>d&&!d.archived);}
function avSnippet(text,terms){
  const T=String(text||''),N=aurNorm(T);let at=-1,len=0;
  for(const t of terms){const i=N.indexOf(t);if(i>=0&&(at<0||i<at)){at=i;len=t.length;}}
  if(at<0)return '';
  const a=Math.max(0,at-50),b=Math.min(T.length,at+len+70);
  return (a>0?'…':'')+aurEsc(T.slice(a,at))+'<mark>'+aurEsc(T.slice(at,at+len))+'</mark>'+aurEsc(T.slice(at+len,b)).replace(/\n/g,' ')+(b<T.length?'…':'');
}
function avDocPick(F,list){
  // documentos que falam das palavras do pedido (entidade, título, pasta, texto)
  const terms=F.Q.filter(t=>t.length>=3&&!(AUR_VOCAB[t]||[]).some(x=>AUR_ACTIONS.has(x)||/^(D_DOC|MINE|ALL|D_FILE|D_MONEY|NUM|D_EXPIRY)$/.test(x))&&!/^(fatura|faturas|factura|recibo|recibos|apolice|policy|invoice|bill|ultima|ultimo|last|numero|paguei|pago|pagar|vence|valor|total|quanto|foi|custou|conta|contas|tenho|qual|quais|sobre|seguro|seguros)$/.test(t));
  if(!terms.length)return {terms,list};
  const hay=d=>aurNorm([d.title,d.desc,d.facts&&d.facts.entity,d.facts&&d.facts.plate,d.text].filter(Boolean).join(' '));
  const hit=list.filter(d=>{const h=hay(d);return terms.some(t=>h.includes(t));});
  return {terms,list:hit.length?hit:[]};
}
const AV_FACT_Q=[
  ['policy',/\b(apolice|apolices|policy)\b/],
  ['due',/\b(quando (vence|tenho de pagar|e preciso pagar|devo pagar|pago)|data (limite|de pagamento|de vencimento)|vencimento|when is .* due|due date)\b/],
  ['total',/\b(quanto (paguei|pago|custou|foi|e|era|gastei)|valor|montante|total|how much)\b/],
];
function aurDocFacts(F){
  const n=F.n,docish=/\b(fatura|faturas|factura|recibo|recibos|apolice|apolices|policy|invoice|invoices|bill|bills|contrato|contratos|luz|eletricidade|electricidade|agua|gas|internet|telemovel|renda)\b/.test(n)||F.c.has('D_DOC')||avDocsWithText().some(d=>d.facts&&d.facts.entity&&new RegExp('\\b'+aurNorm(d.facts.entity).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b').test(n));
  if(!docish||F.c.has('ADD')||F.c.has('DELETE')||F.c.has('SCHEDULE'))return AUR_PASS;
  const q=AV_FACT_Q.find(x=>x[1].test(n));if(!q)return AUR_PASS;
  const all=avDocsWithText();
  const withFact=all.filter(d=>d.facts&&(q[0]==='policy'?d.facts.policy:q[0]==='due'?d.facts.dueDate:d.facts.total!=null));
  const car=/\b(carro|automovel|veiculo|viatura|car|vehicle)\b/.test(n);
  let {list}=avDocPick(F,withFact);
  if(!list.length&&car&&q[0]==='policy')list=withFact.filter(d=>d.facts.plate||d.facts.kind==='seguro'||/auto|carro|automovel|viatura/.test(aurNorm(d.text||'')));
  if(!list.length&&!avDocPick(F,withFact).terms.length)list=withFact;
  if(!withFact.length)return aurSay(aurL('Ainda não encontrei esse dado em nenhum documento. Se tens documentos por ler, diz «lê os meus documentos».','I haven’t found that in any document yet. If some aren’t read yet, say “read my documents”.'));
  if(!list.length)return aurSay(aurL('Não encontrei nenhum documento com esse dado sobre isso.','I found no document with that about it.'));
  const when=d=>d.facts.issueDate||d.date||(d.createdAt?new Date(d.createdAt).toISOString().slice(0,10):'');
  list=list.slice().sort((a,b)=>when(b).localeCompare(when(a)));
  const open=d=>({label:aurL('Abrir ','Open ')+d.title,fn:()=>aurOpenEnt({type:'doc',obj:d,name:d.title},F,true)});
  if(q[0]==='policy'){
    const L=list.slice(0,5);
    return aurSay(L.map(d=>'📄 '+aurL('Apólice ','Policy ')+'<b>'+aurEsc(d.facts.policy)+'</b> — '+aurEsc(d.title)+(d.facts.entity?' ('+aurEsc(d.facts.entity)+')':'')+(d.facts.endDate?aurL(', até ',', until ')+aurDate(d.facts.endDate):'')).join('\n'),
      [{label:aurL('Copiar nº','Copy no.'),fn:()=>aurCopy(L[0].facts.policy,aurL('Nº da apólice copiado','Policy no. copied'))},open(L[0])]);
  }
  if(q[0]==='due'){const d=list[0];return aurSay('📅 <b>'+aurEsc(d.title)+'</b>'+(d.facts.entity?' ('+aurEsc(d.facts.entity)+')':'')+aurL(': pagar até ',': due ')+'<b>'+aurDate(d.facts.dueDate)+'</b> ('+aurRel(d.facts.dueDate)+')'+(d.facts.total!=null?' · '+aurMoney(d.facts.total):'')+'.',[open(d)]);}
  // total: um período («este ano», «este mês», «em março») soma; senão, o último
  const R=avDocPeriod(n);
  if(R){
    const inP=list.filter(d=>{const w=when(d);return w&&w>=R.from&&w<=R.to;});
    if(inP.length){const sum=inP.reduce((s,d)=>s+d.facts.total,0);return aurSay('💶 '+aurL('Total ','Total ')+aurEsc(R.label)+': <b>'+aurMoney(sum)+'</b> '+aurL('em ','in ')+inP.length+aurL(inP.length===1?' documento':' documentos',inP.length===1?' document':' documents')+':\n'+inP.slice(0,8).map(d=>'• '+aurEsc(d.title)+' — '+aurMoney(d.facts.total)+' ('+aurDate(when(d))+')').join('\n'));}
    return aurSay(aurL('Não encontrei faturas '+R.label+'.','I found no bills '+R.label+'.'));
  }
  const d=list[0];
  return aurSay('💶 <b>'+aurEsc(d.title)+'</b>'+(d.facts.entity?' ('+aurEsc(d.facts.entity)+')':'')+': <b>'+aurMoney(d.facts.total)+'</b>'+(when(d)?aurL(' · emitida a ',' · issued ')+aurDate(when(d)):'')+(d.facts.dueDate?aurL(' · pagar até ',' · due ')+aurDate(d.facts.dueDate):'')+'.'+(list.length>1?aurL('\n(a mais recente de '+list.length+')','\n(the latest of '+list.length+')'):''),[open(d)]);
}
// «em que documentos aparece o meu IBAN», «procura "fidelização" nos documentos»
function aurDocSearch(F){
  const n=F.n,raw=F.raw||'';
  const where=/\b(em que|quais|que|onde|which|where)\b.*\b(documentos?|documents?|ficheiros?|files?)\b.*\b(aparece|aparecem|tem|tenho|contem|menciona|falam?|fala|diz|dizem|appears?|contains?|mentions?)\b|\b(procura|pesquisa|encontra|search|find|look for)\b.*\b(nos|nas|em|in)\b.*\b(documentos?|documents?|contratos?|faturas?|ficheiros?)\b/.test(n);
  if(!where)return AUR_PASS;
  const q=raw.match(/[«"“]([^»"”]{2,60})[»"”]/);let terms;
  if(q)terms=[aurNorm(q[1])];
  else{
    const own=/\b(meu|minha|my)\b/.test(n);
    if(/\biban\b/.test(n)&&own){const I=[...avDocOwnerIbans()];if(I.length)terms=I.map(x=>aurNorm(x));}
    if(!terms&&/\bnif\b|contribuinte/.test(n)&&own){const v=[];aurA(typeof personalInfo!=='undefined'?personalInfo:[]).forEach(p=>aurA(p.fields).forEach(x=>{if(/nif|contribuinte/i.test(x.label||'')&&x.value)v.push(String(x.value).replace(/\s/g,''));}));if(v.length)terms=v;}
    if(!terms){const skip=/^(documento|documentos|document|documents|ficheiro|ficheiros|file|files|aparece|aparecem|contem|menciona|fala|falam|diz|dizem|procura|pesquisa|encontra|search|find|look|appears|contains|mentions|nos|nas|onde|quais|que|meu|minha|meus|minhas|my|tem|tenho|contratos|contrato|faturas|fatura)$/;terms=F.Q.filter(t=>t.length>=3&&!skip.test(t));}
  }
  if(!terms||!terms.length)return AUR_PASS;
  const flat=s=>aurNorm(s).replace(/\s+/g,'');
  const hits=avDocsWithText().filter(d=>{const h=aurNorm([d.title,d.desc,d.text].filter(Boolean).join(' '));const hf=h.replace(/\s+/g,'');return terms.some(t=>h.includes(t)||(/^\w{9,}$/.test(t.replace(/\s/g,''))&&hf.includes(flat(t))));});
  const label=aurEsc(q?q[1]:terms.length>1?terms[0]+'…':terms[0]);
  if(!hits.length){const unread=avDocsWithText().filter(d=>d.file&&!d.textAt).length;return aurSay(aurL('Não encontrei «'+label+'» em nenhum documento.','I didn’t find «'+label+'» in any document.')+(unread?aurL(' ('+unread+' ainda por ler — diz «lê os meus documentos».)',' ('+unread+' not read yet — say “read my documents”.)'):''));}
  return aurSay('🔎 '+aurL('«'+label+'» aparece em <b>'+hits.length+'</b> '+(hits.length===1?'documento':'documentos')+':','«'+label+'» appears in <b>'+hits.length+'</b> '+(hits.length===1?'document':'documents')+':')+'\n'+hits.slice(0,6).map(d=>'• <b>'+aurEsc(d.title)+'</b>'+(d.text?' — <span class="a-dim">'+avSnippet(d.text,terms.map(t=>aurNorm(t)))+'</span>':'')).join('\n'),
    hits.slice(0,6).map(d=>({label:d.title,fn:()=>aurOpenEnt({type:'doc',obj:d,name:d.title},F,true)})));
}
// «lê os meus documentos» (também as fotos)
function aurDocReadAll(F){
  if(!/\b(le|ler|leia|lê|analisa|analisar|indexa|indexar|processa|processar|read|scan|analy[sz]e|index)\b/.test(F.n)||!/\b(documentos?|documents?|ficheiros?|files?)\b/.test(F.n))return AUR_PASS;
  const todo=avDocsWithText().filter(d=>d.file&&d.file.data&&(!d.textAt||/\b(de novo|outra vez|todos de novo|again)\b/.test(F.n)));
  if(!todo.length)return aurSay(aurL('✓ Já li todos os teus documentos. Pergunta-me o que quiseres sobre eles.','✓ I’ve already read all your documents. Ask me anything about them.'));
  const imgs=todo.filter(d=>/^image\//.test(d.file.type||'')).length;
  aurSay(aurL('📖 A ler <b>'+todo.length+'</b> '+(todo.length===1?'documento':'documentos')+(imgs?' ('+imgs+(imgs===1?' foto':' fotos')+' — demora uns segundos cada)':'')+'… tudo no teu dispositivo.','📖 Reading <b>'+todo.length+'</b> '+(todo.length===1?'document':'documents')+(imgs?' ('+imgs+(imgs===1?' photo':' photos')+' — a few seconds each)':'')+'… all on your device.'));
  let k=0;
  avDocIndexLater(todo.map(d=>d.id),{force:true,progress:()=>{k++;}});
  const wait=setInterval(()=>{if(AVDX.busy||AVDX.q.length)return;clearInterval(wait);
    const withData=todo.filter(d=>d.facts&&Object.keys(d.facts).length).length;
    aurSay(aurL('✓ Li <b>'+k+'</b> '+(k===1?'documento':'documentos')+(withData?', '+withData+' com dados que já sei usar (valores, datas, apólices…)':'')+'. Experimenta: «quanto paguei na última fatura», «qual o nº da apólice do carro», «em que documentos aparece o meu IBAN».','✓ Read <b>'+k+'</b> '+(k===1?'document':'documents')+(withData?', '+withData+' with data I can use (amounts, dates, policies…)':'')+'. Try: “how much was my last bill”, “car insurance policy number”, “which documents contain my IBAN”.'));},400);
  return true;
}

function avDocPeriod(n){
  const t=new Date(),y=t.getFullYear(),z=x=>String(x).padStart(2,'0'),iso=(Y,M,D)=>Y+'-'+z(M)+'-'+z(D),today=iso(y,t.getMonth()+1,t.getDate());
  if(/\b(este|neste) ano\b|\bthis year\b/.test(n))return {from:iso(y,1,1),to:today,label:aurL('este ano','this year')};
  if(/\b(este|neste) mes\b|\bthis month\b/.test(n))return {from:iso(y,t.getMonth()+1,1),to:today,label:aurL('este mês','this month')};
  if(/\b(ano passado|last year)\b/.test(n))return {from:iso(y-1,1,1),to:iso(y-1,12,31),label:aurL('no ano passado','last year')};
  const mi=AUR_MESES.findIndex(m=>new RegExp('\\b'+m+'\\b').test(n)),mj=mi>=0?mi:AUR_MONTHS.findIndex(m=>new RegExp('\\b'+m+'\\b').test(n));
  if(mj>=0){const Y=mj>t.getMonth()?y-1:y,last=new Date(Y,mj+1,0).getDate();return {from:iso(Y,mj+1,1),to:iso(Y,mj+1,last),label:aurL('em '+AUR_MESES[mj].replace('marco','março'),'in '+AUR_MONTHS[mj])};}
  return null;
}
