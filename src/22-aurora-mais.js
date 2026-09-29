
/* ═══════════ AURORA · DESFAZER, GASTOS, LIMPEZA, SUGESTÕES ═══════════ */

/* ── «desfaz»: anula a última alteração feita pela Aurora ── */
const AURU={stack:[],op:null,last:''};
const AURU_COLS={
  vault:[()=>vault,v=>{vault=v;}],notes:[()=>notes,v=>{notes=v;}],bankCards:[()=>bankCards,v=>{bankCards=v;}],storeCards:[()=>storeCards,v=>{storeCards=v;}],
  documents:[()=>documents,v=>{documents=v;}],trash:[()=>trash,v=>{trash=v;}],totp:[()=>totp,v=>{totp=v;}],wifiNets:[()=>wifiNets,v=>{wifiNets=v;}],
  assets:[()=>assets,v=>{assets=v;}],subscriptions:[()=>subscriptions,v=>{subscriptions=v;}],personalInfo:[()=>personalInfo,v=>{personalInfo=v;}],
  vaultFolders:[()=>vaultFolders,v=>{vaultFolders=v;}],docFolders:[()=>docFolders,v=>{docFolders=v;}]};
// cópia de cada objeto; os ficheiros (grandes e que a Aurora não altera) ficam por referência
function auruClone(o){if(!o||typeof o!=='object')return o;const c={};for(const k of Object.keys(o)){const v=o[k];c[k]=(k==='file'||k==='attachments'||k==='data')?v:(v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v);}return c;}
function auruSnap(label){const C={};for(const k of Object.keys(AURU_COLS)){try{const a=AURU_COLS[k][0]();if(Array.isArray(a))C[k]=a.map(auruClone);}catch(e){}}return {label,C};}
function auruBegin(label){if(AURU.op)return false;AURU.op={label,snap:null,pushed:false};try{AURU.op.snap=auruSnap(label);}catch(e){AURU.op=null;return false;}return true;}
function auruEnd(started){if(started)AURU.op=null;}
function aurUndo(){
  const s=AURU.stack.pop();
  if(!s)return aurSay(aurL('Não há nada para desfazer. (Desfaço o que eu alterei aqui na conversa.)','Nothing to undo. (I undo what I changed here in the chat.)'));
  for(const k of Object.keys(s.C)){try{AURU_COLS[k][1](s.C[k]);}catch(e){}}
  if(typeof renderAll==='function')renderAll();if(typeof markUnsaved==='function')markUnsaved();
  AUR.last=null;
  return aurSay(aurL('↩️ Desfiz: «','↩️ Undone: “')+aurEsc(s.label)+aurL('».','”.')+(AURU.stack.length?'<span class="a-dim"> '+aurL('(posso desfazer mais '+AURU.stack.length+')','(I can undo '+AURU.stack.length+' more)')+'</span>':''));
}
(function(){
  if(typeof markUnsaved==='function'){const mu=markUnsaved;markUnsaved=function(){if(AURU.op&&!AURU.op.pushed&&AURU.op.snap){AURU.stack.push(AURU.op.snap);if(AURU.stack.length>10)AURU.stack.shift();AURU.op.pushed=true;}return mu.apply(this,arguments);};}
  aurStage('desfazer',10,(raw,h)=>{
    const n=aurCanon(raw||'');
    if(/^(desfaz|desfazer|desfaz isso|desfaz o que fizeste|desfaz a ultima( acao| alteracao)?|anula( isso)?|anular|volta atras|undo|undo that|undo it|revert( that)?)$/.test(n)){const dl=aurDetectLang(raw,new Set());if(dl)AUR.lang=dl;return aurUndo();}
    const st=auruBegin(String(raw||'').trim().slice(0,80));if(st)AURU.last=AURU.op.label;
    try{return h(raw);}finally{auruEnd(st);}
  });
  const act=aurAct;aurAct=function(i){const st=auruBegin(AURU.last||aurL('ação','action'));try{return act(i);}finally{auruEnd(st);}};
  const yes=aurYes;aurYes=function(){const st=auruBegin(AURU.last||aurL('confirmação','confirmation'));try{return yes.apply(this,arguments);}finally{auruEnd(st);}};
})();

/* ── gastos: «quanto gastei este mês no total», «compara com o mês passado» ── */
function aurMonthRange(off){const t=new Date(),a=new Date(t.getFullYear(),t.getMonth()+off,1),b=new Date(t.getFullYear(),t.getMonth()+off+1,0);const z=x=>String(x).padStart(2,'0'),iso=d=>d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());return {from:iso(a),to:iso(b),m:a.getMonth(),y:a.getFullYear()};}
function aurSpend(R){
  const inR=d=>d&&d>=R.from&&d<=R.to,out={bills:0,subs:0,fuel:0,items:[]};
  aurA(typeof documents!=='undefined'?documents:[]).forEach(d=>{const f=d.facts;if(!f||f.kind==='trabalho'||f.total==null||d.archived)return;if(!(f.kind==='fatura'||f.dueDate))return;const w=f.issueDate||(d.createdAt?new Date(d.createdAt).toISOString().slice(0,10):'');if(inR(w)){out.bills+=f.total;out.items.push({k:'bill',name:f.entity||d.title,v:f.total});}});
  aurA(typeof subscriptions!=='undefined'?subscriptions:[]).forEach(s=>{const a=+s.amount||0;let v=0;if(s.cycle==='yearly'){const d=s.renewDate?new Date(s.renewDate):null;if(d&&!isNaN(d)&&d.getMonth()===R.m)v=a;}else if(s.cycle==='weekly')v=a*52/12;else v=a;if(v){out.subs+=v;out.items.push({k:'sub',name:s.name,v});}});
  aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle').forEach(a=>aurA(a.fuel).forEach(f=>{if(inR(String(f.date||'').slice(0,10))){const v=+f.euros||0;out.fuel+=v;out.items.push({k:'fuel',name:a.name,v});}}));
  out.total=out.bills+out.subs+out.fuel;return out;
}
function aurMonthName(R){const m=AUR_MESES[R.m].replace('marco','março');return aurL(m,AUR_MONTHS[R.m]);}
aurPre('gastos',450,F=>{
  const n=F.n;
  const spendQ=/\b(quanto (gastei|gasto|paguei|pago|despendi)|gastos|despesas|how much (did i|do i) (spend|pay)|spending|expenses|spent)\b/.test(n);
  const cmp=/\b(compara\w*|compare|comparison|vs|versus|gastei mais|gastei menos|spent more|spent less)\b/.test(n)&&/\b(mes passado|mes anterior|last month|previous month)\b/.test(n);
  if(!spendQ&&!cmp)return AUR_PASS;
  if(!cmp&&(aurHas(F,'D_FUEL','D_SUBS')||/\b(faturas?|luz|agua|gas|internet|renda|combustivel|gasolina|subscric\w*)\b/.test(n)||F.cands.some(e=>e.score>=0.5)))return AUR_PASS;
  if(!cmp&&!/\b(total|no total|ao todo|tudo|em tudo|overall|in total|all|este mes|neste mes|mes passado|this month|last month)\b/.test(n)&&!AUR_MESES.some(m=>new RegExp('\\b'+m+'\\b').test(n)))return AUR_PASS;
  const mi=AUR_MESES.findIndex(m=>new RegExp('\\b'+m+'\\b').test(n)),now=new Date().getMonth();
  const off=/\b(mes passado|mes anterior|last month|previous month)\b/.test(n)&&!cmp?-1:mi>=0?(mi<=now?mi-now:mi-now-12):0;
  const R=aurMonthRange(off),S=aurSpend(R);
  const row=(ic,lbl,v,p)=>'• '+ic+' '+lbl+': <b>'+aurMoney(v)+'</b>'+(p!=null?' <span class="a-dim">('+(v-p>=0?'+':'−')+aurMoney(Math.abs(v-p))+')</span>':'');
  if(cmp){
    const P=aurSpend(aurMonthRange(-1)),dt=S.total-P.total;
    const pct=P.total?Math.round(Math.abs(dt)/P.total*100):null;
    return aurSay('📊 '+aurL('<b>'+aurCap(aurMonthName(R))+'</b> vs <b>'+aurMonthName(aurMonthRange(-1))+'</b>:','<b>'+aurCap(aurMonthName(R))+'</b> vs <b>'+aurMonthName(aurMonthRange(-1))+'</b>:')+'\n'+
      row('🧾',aurL('Faturas','Bills'),S.bills,P.bills)+'\n'+row('🔁',aurL('Subscrições','Subscriptions'),S.subs,P.subs)+'\n'+row('⛽',aurL('Combustível','Fuel'),S.fuel,P.fuel)+'\n'+
      '<b>'+aurL('Total: ','Total: ')+aurMoney(S.total)+'</b> '+(dt===0?aurL('— igual ao mês passado.','— same as last month.'):(dt>0?aurL('— gastaste mais ','— you spent ')+aurMoney(dt)+(pct!=null?' (+'+pct+'%)':'')+aurL('.',' more.'):aurL('— poupaste ','— you saved ')+aurMoney(-dt)+(pct!=null?' (−'+pct+'%)':'')+'. 🎉')));
  }
  if(!S.total)return aurSay(aurL('Não tenho gastos registados em '+aurMonthName(R)+' (faturas lidas, subscrições e combustível).','I have no spending recorded in '+aurMonthName(R)+' (bills I read, subscriptions and fuel).'));
  const top=S.items.slice().sort((a,b)=>b.v-a.v).slice(0,3).map(i=>aurEsc(i.name)+' '+aurMoney(i.v)).join(', ');
  return aurSay('💶 '+aurL('Em <b>'+aurMonthName(R)+'</b> gastaste <b>'+aurMoney(S.total)+'</b>:','In <b>'+aurMonthName(R)+'</b> you spent <b>'+aurMoney(S.total)+'</b>:')+'\n'+row('🧾',aurL('Faturas','Bills'),S.bills)+'\n'+row('🔁',aurL('Subscrições','Subscriptions'),S.subs)+'\n'+row('⛽',aurL('Combustível','Fuel'),S.fuel)+(top?'\n<span class="a-dim">'+aurL('Maiores: ','Biggest: ')+top+'</span>':''),
    off===0?[{label:aurL('Comparar com o mês passado','Compare with last month'),fn:()=>aurQuick(aurL('compara com o mês passado','compare with last month'))}]:[]);
});

/* ── «arruma o meu cofre»: limpeza guiada, um problema de cada vez ── */
const AURL={q:[],i:0,fixed:0};
function aurCleanIssues(){
  const Q=[],today=new Date().toISOString().slice(0,10);
  try{(typeof findDuplicateEntries==='function'?findDuplicateEntries():[]).forEach(g=>{const G=Array.isArray(g)?g:(g&&(g.entries||g.items))||[];if(G.length>1)Q.push({k:'dup',G});});}catch(e){}
  aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived&&!v.pw&&!v.isWifi).forEach(v=>Q.push({k:'nopw',v}));
  aurA(typeof bankCards!=='undefined'?bankCards:[]).filter(c=>!c.archived&&/^\d{2}\/\d{2}$/.test(c.expiry||'')).forEach(c=>{const[mm,aa]=c.expiry.split('/');if(new Date(2000+ +aa,+mm,0)<new Date())Q.push({k:'card',c});});
  aurA(typeof documents!=='undefined'?documents:[]).filter(d=>!d.archived&&d.expiry&&d.expiry<today).forEach(d=>Q.push({k:'doc',d}));
  aurA(typeof notes!=='undefined'?notes:[]).filter(x=>!x.archived&&!String(x.title||'').trim()&&!String(x.body||'').trim()).forEach(x=>Q.push({k:'note',x}));
  const unread=aurA(typeof documents!=='undefined'?documents:[]).filter(d=>d.file&&!d.textAt&&/pdf|image/.test(d.file.type||''));if(unread.length)Q.push({k:'unread',n:unread.length});
  if(typeof avWeakList==='function'&&avWeakList().length)Q.push({k:'weak',n:avWeakList().length});
  return Q;
}
function aurCleanStart(){
  AURL.q=aurCleanIssues();AURL.i=0;AURL.fixed=0;
  if(!AURL.q.length)return aurSay(aurL('✨ O teu cofre está arrumado — não encontrei duplicados, entradas sem password, cartões ou documentos expirados, notas vazias nem passwords fracas.','✨ Your vault is tidy — no duplicates, empty entries, expired cards or documents, empty notes or weak passwords.'));
  aurSay(aurL('🧹 Encontrei <b>'+AURL.q.length+'</b> '+(AURL.q.length===1?'coisa':'coisas')+' para arrumar. Vamos uma a uma — podes saltar ou parar quando quiseres.','🧹 I found <b>'+AURL.q.length+'</b> '+(AURL.q.length===1?'thing':'things')+' to tidy. One at a time — skip or stop whenever you like.'));
  return aurCleanStep();
}
function aurCleanNext(fixed){if(fixed)AURL.fixed++;AURL.i++;return aurCleanStep();}
function aurCleanStep(){
  const it=AURL.q[AURL.i],tot=AURL.q.length;
  if(!it)return aurSay(aurL('✅ Limpeza terminada — resolvi '+AURL.fixed+' de '+tot+'.','✅ Tidy-up done — fixed '+AURL.fixed+' of '+tot+'.')+(AURL.fixed?aurL(' (Diz «desfaz» se te arrependeres de alguma.)',' (Say “undo” if you regret one.)'):''));
  const hd='🧹 <b>'+(AURL.i+1)+'/'+tot+'</b> · ',skip={label:aurL('Saltar','Skip'),fn:()=>aurCleanNext(false)},stop={label:aurL('Parar','Stop'),fn:()=>{AURL.q=[];return aurSay(aurL('Ok, parei a limpeza.','Ok, stopped tidying.'));}};
  const done=(msg)=>{aurDirty();aurSay(msg);return aurCleanNext(true);};
  switch(it.k){
    case 'dup':{const G=it.G,keep=G.slice().sort((a,b)=>(b.pwUpdated||b.updatedAt||b.createdAt||0)-(a.pwUpdated||a.updatedAt||a.createdAt||0))[0];
      return aurSay(hd+aurL('<b>'+aurEsc(keep.name)+'</b> está repetida '+G.length+' vezes (mesmo utilizador). Fico com a mais recente e mando as outras para a reciclagem?','<b>'+aurEsc(keep.name)+'</b> appears '+G.length+' times (same username). Keep the newest and move the others to the trash?'),
        [{label:aurL('Sim, limpar','Yes, clean up'),fn:()=>{G.filter(e=>e!==keep).forEach(e=>{trash.unshift({type:'vault',data:e,deletedAt:Date.now()});vault=vault.filter(v=>v!==e);aurLog('delete',e.name,'🗑️');});return done(aurL('✓ Fiquei com uma só <b>'+aurEsc(keep.name)+'</b>.','✓ Kept a single <b>'+aurEsc(keep.name)+'</b>.'));}},skip,stop]);}
    case 'nopw':{const v=it.v;return aurSay(hd+aurL('<b>'+aurEsc(v.name)+'</b> não tem password guardada.','<b>'+aurEsc(v.name)+'</b> has no password saved.'),
        [{label:aurL('Gerar uma forte','Generate a strong one'),fn:()=>{v.pw=aurGenPw(20);v.pwUpdated=Date.now();return done(aurL('✓ Pus uma password forte em <b>'+aurEsc(v.name)+'</b> — muda-a também no site.','✓ Set a strong password on <b>'+aurEsc(v.name)+'</b> — change it on the site too.'));}},
         {label:aurL('Apagar entrada','Delete entry'),fn:()=>{trash.unshift({type:'vault',data:v,deletedAt:Date.now()});vault=vault.filter(x=>x!==v);return done(aurL('🗑️ Apaguei <b>'+aurEsc(v.name)+'</b>.','🗑️ Deleted <b>'+aurEsc(v.name)+'</b>.'));}},skip,stop]);}
    case 'card':{const c=it.c;return aurSay(hd+aurL('O cartão <b>'+aurEsc(c.name||c.bank)+'</b> expirou ('+aurEsc(c.expiry)+').','The <b>'+aurEsc(c.name||c.bank)+'</b> card expired ('+aurEsc(c.expiry)+').'),
        [{label:aurL('Arquivar','Archive'),fn:()=>{c.archived=true;return done(aurL('📦 Arquivei o cartão <b>'+aurEsc(c.name||c.bank)+'</b>.','📦 Archived the <b>'+aurEsc(c.name||c.bank)+'</b> card.'));}},skip,stop]);}
    case 'doc':{const d=it.d;return aurSay(hd+aurL('<b>'+aurEsc(d.title||d.name)+'</b> expirou a '+aurDate(d.expiry)+'.','<b>'+aurEsc(d.title||d.name)+'</b> expired on '+aurDate(d.expiry)+'.'),
        [{label:aurL('Já renovei — atualizar','Renewed — update'),fn:()=>{AURL.i++;aurOpenEnt({type:'doc',obj:d,name:d.title},{c:new Set(['OPEN']),n:'',raw:''},true);return aurSay(aurL('Abri o documento — põe a nova validade (e a foto nova). Depois diz «continua a limpeza».','I opened the document — set the new expiry (and new photo). Then say “continue tidying”.'));}},
         {label:aurL('Arquivar','Archive'),fn:()=>{d.archived=true;return done(aurL('📦 Arquivei <b>'+aurEsc(d.title||d.name)+'</b>.','📦 Archived <b>'+aurEsc(d.title||d.name)+'</b>.'));}},skip,stop]);}
    case 'note':{const x=it.x;return aurSay(hd+aurL('Tens uma nota vazia.','You have an empty note.'),[{label:aurL('Apagar','Delete'),fn:()=>{trash.unshift({type:'note',data:x,deletedAt:Date.now()});notes=notes.filter(o=>o!==x);return done(aurL('🗑️ Apaguei a nota vazia.','🗑️ Deleted the empty note.'));}},skip,stop]);}
    case 'unread':return aurSay(hd+aurL('Tens <b>'+it.n+'</b> '+(it.n===1?'documento que ainda não li':'documentos que ainda não li')+' — lendo-os consigo responder sobre eles e avisar-te de prazos.','You have <b>'+it.n+'</b> unread '+(it.n===1?'document':'documents')+' — once read I can answer about them and warn you of deadlines.'),
        [{label:aurL('Lê agora','Read now'),fn:()=>{aurQuick(aurL('lê os meus documentos','read my documents'));return aurCleanNext(true);}},skip,stop]);
    case 'weak':return aurSay(hd+aurL('Tens <b>'+it.n+'</b> '+(it.n===1?'password fraca ou repetida':'passwords fracas ou repetidas')+'. Queres revê-las agora, uma a uma?','You have <b>'+it.n+'</b> weak or reused '+(it.n===1?'password':'passwords')+'. Review them now, one by one?'),
        [{label:aurL('Rever agora','Review now'),fn:()=>{AURL.i++;AURL.fixed++;if(typeof avCleanupStart==='function')avCleanupStart();return true;}},skip,stop]);
  }
  return aurCleanNext(false);
}
aurPre('limpeza',460,F=>{
  const n=F.n;
  if(/\b(continua|continuar|segue|seguir|continue)\b.*\b(limpeza|arrumar|arrumacao|tidying|clean ?up)\b/.test(n)&&AURL.q.length)return aurCleanStep();
  if(/^(?:(?:podes|consegues|vamos|quero)\s+)?(arruma|arrumar|organiza|organizar|limpa|limpar|faz uma limpeza|fazer uma limpeza|limpeza|arrumacao|tidy|tidy up|clean up|clean)\b.*\b(cofre|vault|tudo|everything|isto|app|passwords|contas)\b|^(limpeza|arrumacao|limpeza geral|faxina)( do cofre| geral)?$/.test(n)&&!/\b(reciclagem|lixo|lixeira|trash|bin|historico)\b/.test(n))return aurCleanStart();
  return AUR_PASS;
});

/* ── sugestões enquanto escreves (com os nomes do teu cofre) ── */
let AUR_SUGP=null;
function aurSugPool(){
  const key=aurAppLang()+'|'+aurTotpLocked();
  if(AUR_SUGP&&AUR_SUGP.key===key&&aurDataSame(AUR_SUGP))return AUR_SUGP.P;
  const P=aurSugPoolBuild();AUR_SUGP=Object.assign(aurDataStamp(),{key,P});return P;
}
function aurSugPoolBuild(){
  const en=aurAppLang()==='en',P=[];const add=(t,w)=>P.push({t,n:aurNorm(t),w:w||1});
  (en?['what expires this month','what needs my attention','how much did I spend this month','compare with last month','tidy up my vault','any weak passwords','generate a strong password','what have you learned','what didn\'t you understand','undo','unpaid bills','status overview','2fa codes','my tax number','my iban']
    :['o que expira este mês','o que devo tratar','quanto gastei este mês no total','compara com o mês passado','arruma o meu cofre','tenho passwords fracas','gera uma password forte','o que aprendeste','o que não percebeste','desfaz','faturas por pagar','ponto de situação','códigos 2fa','qual o meu nif','qual o meu iban']).forEach(t=>add(t,2));
  aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived&&v.name).slice(0,300).forEach(v=>{add((en?'password for ':'password do ')+v.name,3);add((en?'copy the password for ':'copia a password do ')+v.name);add((en?'username for ':'utilizador do ')+v.name);});
  if(!aurTotpLocked())aurA(typeof totp!=='undefined'?totp:[]).forEach(t=>{const nm=t.name||t.issuer;if(nm)add((en?'code for ':'código do ')+nm,3);});
  aurA(typeof bankCards!=='undefined'?bankCards:[]).filter(c=>!c.archived).forEach(c=>{const nm=c.name||c.bank;if(nm){add((en?'pin for card ':'pin do cartão ')+nm);add((en?'when does card ':'quando expira o cartão ')+nm+(en?' expire':''));}});
  aurA(typeof documents!=='undefined'?documents:[]).filter(d=>!d.archived&&(d.title||d.name)).slice(0,200).forEach(d=>{add((en?'open ':'abre o ')+(d.title||d.name));if(d.text&&d.text.length>260)add((en?'summarise ':'resume o ')+(d.title||d.name));if(d.expiry)add((en?'when does ':'quando expira o ')+(d.title||d.name)+(en?' expire':''),2);});
  aurA(typeof notes!=='undefined'?notes:[]).filter(x=>x.title).forEach(x=>add((en?'read the note ':'lê a nota ')+x.title));
  aurA(typeof wifiNets!=='undefined'?wifiNets:[]).forEach(w=>add((en?'wifi password for ':'password do wifi ')+(w.name||w.ssid)));
  aurA(typeof subscriptions!=='undefined'?subscriptions:[]).forEach(s=>add((en?'how much is ':'quanto pago de ')+s.name));
  return P;
}
function aurSugMatch(n,qw){const words=n.split(/\s+/);return qw.every(w=>words.some(x=>x.startsWith(w)));}
function aurSugQuery(q){return aurNorm(q).replace(/[^\w\s-]/g,' ').trim();}
function aurSuggest(q){
  const qn=aurSugQuery(q);if(qn.length<2)return [];
  const qw=qn.split(/\s+/);
  const R=[];
  for(const p of aurSugPool()){
    if(p.n===qn||!aurSugMatch(p.n,qw))continue;
    R.push({t:p.t,s:(p.n.startsWith(qn)?10:0)+p.w-p.n.length/100});
  }
  return R.sort((a,b)=>b.s-a.s).slice(0,4).map(r=>r.t);
}
// enquanto a lista nova não chega, tira já as sugestões que deixaram de corresponder ao que está escrito
function aurSugPrune(q){
  const box=document.getElementById('aurora-sugg');if(!box||box.hidden)return;
  const qn=aurSugQuery(q),qw=qn.split(/\s+/);
  box.querySelectorAll('button[data-q]').forEach(b=>{const n=aurNorm(b.dataset.q);if(qn.length<2||n===qn||!aurSugMatch(n,qw))b.remove();});
  if(!box.firstChild)box.hidden=true;
}
function aurSugRender(){
  const inp=document.getElementById('aurora-input'),box0=document.querySelector('#aurora-panel .aurora-in');if(!inp||!box0)return;
  let box=document.getElementById('aurora-sugg');
  if(!box){box=document.createElement('div');box.id='aurora-sugg';box.setAttribute('role','listbox');box.setAttribute('aria-label',aurAppLang()==='en'?'Suggestions':'Sugestões');box0.parentNode.insertBefore(box,box0);
    box.addEventListener('click',e=>{const b=e.target.closest('button[data-q]');if(!b)return;inp.value=b.dataset.q;box.innerHTML='';box.hidden=true;auroraSend();});}
  const L=(typeof masterKey!=='undefined'&&masterKey)?aurSuggest(inp.value):[];
  box.hidden=!L.length;
  box.innerHTML=L.map(t=>'<button type="button" role="option" class="a-sug" data-q="'+aurEsc(t)+'">'+aurEsc(t)+'</button>').join('');
}
if(typeof document!=='undefined'){
  // espera por uma pausa na escrita (não refaz as sugestões a cada tecla)
  let _sugT=null;
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='aurora-input'){clearTimeout(_sugT);_sugT=setTimeout(()=>{_sugT=null;aurSugRender();},90);aurSugPrune(e.target.value);}});
  document.addEventListener('keydown',e=>{
    if(!e.target||e.target.id!=='aurora-input')return;
    if(e.key==='Tab'&&_sugT){clearTimeout(_sugT);_sugT=null;aurSugRender();}   // Tab logo a seguir a escrever: calcula já
    const box=document.getElementById('aurora-sugg');
    if(e.key==='Tab'&&box&&!box.hidden&&box.firstChild){e.preventDefault();e.target.value=box.firstChild.dataset.q+' ';aurSugRender();}
    else if(e.key==='Enter'||e.key==='Escape'){if(box){box.innerHTML='';box.hidden=true;}}
  },true);
}
