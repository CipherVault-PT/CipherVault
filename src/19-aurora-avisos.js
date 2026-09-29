
/* ═══════════ AURORA · AVISOS ═══════════
   A Aurora olha pelo cofre sozinha (no dispositivo) e avisa: faturas a vencer, contas que subiram,
   validades, renovações, passwords repetidas/fracas e documentos por ler. */
const AURI_KEY='av_aur_snooze';
function auriSnoozed(){try{const o=JSON.parse(localStorage.getItem(AURI_KEY)||'{}'),now=Date.now();Object.keys(o).forEach(k=>{if(o[k]<now)delete o[k];});return o;}catch(e){return {};}}
function auriSnooze(id,days){try{const o=auriSnoozed();o[id]=Date.now()+days*864e5;localStorage.setItem(AURI_KEY,JSON.stringify(o));}catch(e){}auriBadge();}
function auriDays(d){const x=new Date(d);x.setHours(0,0,0,0);return Math.round((x-aurToday())/864e5);}
function auriIso(d){const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}
function auriWhen(n){return n<0?aurL('há '+(-n)+(n===-1?' dia':' dias'),(-n)+(n===-1?' day':' days')+' ago'):n===0?aurL('hoje','today'):n===1?aurL('amanhã','tomorrow'):aurL('em '+n+' dias','in '+n+' days');}

// lista de avisos: {id, sev (3 urgente · 2 importante · 1 dica), icon, text, chips}
function aurInsights(all){
  const out=[],docs=aurA(typeof documents!=='undefined'?documents:[]),V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>v&&!v.archived&&v.pw);
  const openDoc=d=>({label:aurL('Abrir','Open'),fn:()=>aurOpenEnt({type:'doc',obj:d,name:d.title},{c:new Set(['OPEN']),n:'',raw:''},true)});
  // 1) faturas por pagar
  docs.forEach(d=>{const f=d.facts;if(!f||!f.dueDate||d.paid)return;const n=auriDays(f.dueDate);if(n<-10||n>10)return;
    out.push({id:'due:'+d.id+':'+f.dueDate,sev:n<=3?3:2,icon:'🧾',
      text:aurL('Fatura ','Bill ')+'<b>'+aurEsc(f.entity||d.title)+'</b>'+(f.total!=null?' ('+aurMoney(f.total)+')':'')+(n<0?aurL(' venceu ',' was due ')+auriWhen(n):aurL(' vence ',' is due ')+auriWhen(n)),
      chips:[{label:aurL('✓ Já paguei','✓ Paid'),fn:()=>{d.paid=true;aurDirty();auriBadge();return aurSay(aurL('✓ Marquei a fatura de <b>','✓ Marked the <b>')+aurEsc(f.entity||d.title)+aurL('</b> como paga.','</b> bill as paid.'));}},openDoc(d)]});});
  // 2) contas que subiram (mesma entidade, fatura mais recente vs anterior)
  const byEnt={};docs.forEach(d=>{const f=d.facts;if(f&&f.kind==='fatura'&&f.entity&&f.total!=null&&f.issueDate)(byEnt[f.entity]=byEnt[f.entity]||[]).push(d);});
  Object.keys(byEnt).forEach(e=>{const L=byEnt[e].sort((a,b)=>a.facts.issueDate.localeCompare(b.facts.issueDate));if(L.length<2)return;
    const a=L[L.length-2].facts.total,b=L[L.length-1].facts.total,last=L[L.length-1];
    if(!(a>0)||b<a*1.15||b-a<3||auriDays(last.facts.issueDate)<-75)return;
    out.push({id:'rise:'+last.id,sev:2,icon:'📈',text:aurL('A fatura da <b>','The <b>')+aurEsc(e)+aurL('</b> subiu <b>','</b> bill went up <b>')+Math.round((b/a-1)*100)+'%</b> ('+aurMoney(a)+' → '+aurMoney(b)+')',chips:[openDoc(last)]});});
  // 3) validades e datas (documentos, cartões, garantias, veículos, datas importantes)
  const ICON={doc:'📄',card:'💳',warranty:'🧾',license:'🔑',vehicle:'🚗',date:'📅'};
  aurEvents().forEach(ev=>{if(ev.type==='renew'||ev.type==='holiday')return;const n=auriDays(ev.date);
    const lim=ev.type==='date'?7:30;if(n>lim||n<-30)return;
    out.push({id:'ev:'+ev.type+':'+ev.label+':'+auriIso(ev.date),sev:n<=7?3:2,icon:ICON[ev.type]||'📅',
      text:'<b>'+aurEsc(ev.label)+'</b> '+(n<0?aurL('expirou ','expired ')+auriWhen(n):ev.type==='date'?auriWhen(n):aurL('expira ','expires ')+auriWhen(n))+' <span class="a-dim">('+aurDate(ev.date)+')</span>',
      chips:[{label:aurL('Ver no calendário','Calendar'),fn:aurOpenCal}]});});
  // 4) renovações de subscrições nos próximos 3 dias
  aurEvents().forEach(ev=>{if(ev.type!=='renew')return;const n=auriDays(ev.date);if(n<0||n>3)return;
    out.push({id:'renew:'+ev.label+':'+auriIso(ev.date),sev:1,icon:'🔁',text:'<b>'+aurEsc(ev.label)+'</b> '+aurL('renova ','renews ')+auriWhen(n)+(ev.amount?' · '+aurMoney(ev.amount):''),chips:[]});});
  // 5) passwords repetidas e fracas
  const map={};V.forEach(v=>{(map[v.pw]=map[v.pw]||[]).push(v);});
  const dup=Object.values(map).filter(g=>g.length>1),nd=dup.reduce((s,g)=>s+g.length,0);
  if(nd)out.push({id:'dup:'+nd,sev:2,icon:'🔁',text:aurL('<b>'+nd+' contas</b> partilham a mesma password (','<b>'+nd+' accounts</b> share a password (')+dup[0].slice(0,3).map(v=>aurEsc(v.name)).join(', ')+(nd>3?'…':'')+')',chips:[{label:aurL('Corrigir','Fix'),fn:()=>aurQuick(aurL('quais passwords estão repetidas','which passwords are reused'))}]});
  const weak=typeof getPwScore==='function'?V.filter(v=>getPwScore(v.pw)<2):[];
  if(weak.length)out.push({id:'weak:'+weak.length,sev:1,icon:'⚠️',text:aurL('<b>'+weak.length+'</b> '+(weak.length===1?'password fraca':'passwords fracas'),'<b>'+weak.length+'</b> weak '+(weak.length===1?'password':'passwords')),chips:[{label:aurL('Ver','View'),fn:()=>aurQuick(aurL('tenho passwords fracas','any weak passwords'))}]});
  // 6) documentos por ler
  const unread=docs.filter(d=>d.file&&!d.textAt&&/pdf|image/.test(d.file.type||''));
  if(unread.length)out.push({id:'unread:'+unread.length,sev:1,icon:'📑',text:aurL('Tens <b>'+unread.length+'</b> '+(unread.length===1?'documento que ainda não li':'documentos que ainda não li'),'<b>'+unread.length+'</b> '+(unread.length===1?'document I haven’t read yet':'documents I haven’t read yet')),chips:[{label:aurL('Lê agora','Read now'),fn:()=>aurQuick(aurL('lê os meus documentos','read my documents'))}]});
  const sn=all?{}:auriSnoozed();
  return out.filter(x=>!sn[x.id]).sort((a,b)=>b.sev-a.sev);
}
function auriLine(x,i){return x.icon+' '+x.text;}
function auriChips(x){return x.chips.concat([{label:aurL('Lembra-me amanhã','Remind me tomorrow'),fn:()=>{auriSnooze(x.id,1);return aurSay(aurL('Ok, volto a lembrar amanhã.','Ok, I’ll remind you tomorrow.'));}},{label:aurL('Ignorar','Dismiss'),fn:()=>{auriSnooze(x.id,3650);return aurSay(aurL('Ok, não volto a avisar disto.','Ok, I won’t mention it again.'));}}]);}
function aurInsightsSay(){
  const L=aurInsights();
  if(!L.length)return aurSay(aurL('✅ Está tudo em ordem — não tenho avisos para ti.','✅ All good — nothing needs your attention.'));
  aurSay(aurL('📌 <b>'+L.length+(L.length===1?' coisa':' coisas')+' para tratar:</b>','📌 <b>'+L.length+(L.length===1?' thing':' things')+' to look at:</b>'));
  L.slice(0,8).forEach(x=>aurSay(auriLine(x),auriChips(x)));
  if(L.length>8)aurSay('<span class="a-dim">'+aurL('… e mais '+(L.length-8)+'.','… and '+(L.length-8)+' more.')+'</span>');
  return true;
}

// contador na bolha da Aurora (só avisos importantes; no Dashboard já há o cartão «Avisos»)
let _auriT=null;
function auriBadge(){
  clearTimeout(_auriT);
  _auriT=setTimeout(()=>{
    if(typeof document==='undefined')return;
    let n=0;try{n=typeof masterKey!=='undefined'&&masterKey?aurInsights().filter(x=>x.sev>=2).length:0;}catch(e){}
    const fab=document.getElementById('aurora-fab');if(fab){const en=aurAppLang()==='en',lbl=(en?'Open Aurora AI':'Abrir a Aurora AI')+(n?' ('+n+' '+(en?(n===1?'alert':'alerts'):(n===1?'aviso':'avisos'))+')':'');if(n)fab.dataset.n=n>9?'9+':String(n);else delete fab.dataset.n;fab.setAttribute('aria-label',lbl);fab.title=lbl;}
  },300);
}

(function(){
  // pedidos: «avisos», «o que devo tratar», «o que há de novo», «what needs my attention»
  const h=aurHandle;
  aurHandle=function(raw){
    const n=aurCanon(raw||'');
    if(!AUR.pending&&/^(?:(?:tens|ha|tenho|mostra|mostra me|quais|any|show|show me|my)\s+)*(?:(?:os|as|algum|alguns|alguma|algumas|meus|minhas)\s+)?(avisos?|alertas?|notificacoes|pendentes|novidades|alerts?|notifications)\??$|\bo que (?:devo|tenho de|tenho que|preciso de) tratar\b|\bo que ha de novo\b|^(?:ha |tenho |existe )?(?:alguma coisa|algo) (?:urgente|importante|pendente)$|\bwhat needs my attention\b|\bwhat s new\b|\banything (?:urgent|important)\b/.test(n)){const dl=aurDetectLang(raw,new Set());if(dl)AUR.lang=dl;return aurInsightsSay();}
    return h(raw);
  };
  // saudação: junta os avisos mais importantes
  const g=aurGreet;
  aurGreet=function(){g();try{const L=aurInsights();if(!L.length)return;const top=L.slice(0,3);
    aurSay(aurL('📌 <b>Tenho '+L.length+(L.length===1?' aviso':' avisos')+' para ti:</b>\n','📌 <b>I have '+L.length+(L.length===1?' alert':' alerts')+' for you:</b>\n')+top.map(auriLine).join('\n'),
      (top[0].chips||[]).slice(0,1).concat(L.length>1?[{label:aurL('Ver todos','See all'),fn:aurInsightsSay}]:[]));}catch(e){}};
  // manter o contador em dia
  if(typeof renderAll==='function'){const r=renderAll;renderAll=function(){const x=r.apply(this,arguments);auriBadge();return x;};}
  // ao abrir o cofre: um aviso discreto se houver algo urgente (uma vez por dia)
  if(typeof doUnlock==='function'){const du=doUnlock;doUnlock=function(){const x=du.apply(this,arguments);setTimeout(()=>{auriBadge();try{
    const u=aurInsights().filter(i=>i.sev>=3);if(!u.length||typeof toast!=='function')return;const day=new Date().toDateString();
    if(localStorage.getItem('av_aur_toast')===day)return;localStorage.setItem('av_aur_toast',day);
    const en=aurAppLang()==='en';toast('✨ Aurora: '+u[0].text.replace(/<[^>]+>/g,'')+(u.length>1?(en?' (+'+(u.length-1)+' more)':' (+'+(u.length-1)+')'):''));}catch(e){}},2500);return x;};}
})();
