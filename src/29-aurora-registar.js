
/* ══ AURORA · REGISTAR COM CAMPOS (v12.6) ══
   «regista uma nota: título: compras; texto: leite e pão»
   «guarda uma password: site netflix.com; email: ana@mail.pt; password: Abc123»
   «adiciona um 2fa: nome GitHub; chave JBSWY3DPEHPK3PXP»
   «nova rede wi-fi: nome Casa_5G; password: …» · «cartão de loja: nome Continente; número 2600…»
   «regista info pessoal: NIF: 123456789; nº de utente: 987654321»
   Corre antes da etapa de conversa, que partiria o pedido nos «;». Sem campos reconhecidos, o pedido segue o caminho de sempre. */

// texto em minúsculas e sem acentos, com as MESMAS posições do original (para recortar os valores do texto original)
function aurrFold(s){let o='';for(let i=0;i<s.length;i++){const ch=s[i];let f=ch.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(f.length!==1)f=ch;o+=f;}return o;}

const AURR_VERB=/^\s*(?:(?:por favor|pf|pfv|podes|podias|consegues|quero|queria|preciso de|preciso|vamos|ajuda-me a|please|can you|could you|i want to|i need to)\s+)*(regist(?:a|ar|e)|cri(?:a|ar|e)|adicion(?:a|ar|e)|guard(?:a|ar|e)|grav(?:a|ar|e)|inser(?:e|ir)|met(?:e|er)|anot(?:a|ar|e)|nov[oa]|add|create|save|store|record|register|new|make|write down|note down)(?:-(?:me|nos|lhe))?(?=[\s:]|$)\s*:?\s*/;
const AURR_ART=/^(?:(?:um|uma|uns|umas|o|a|os|as|mais|outr[oa]|nov[oa]|an?|the|another|new)\s+)+/;
const AURR_TYPES=[
  ['person',/^(?:(?:info|infos|informac(?:ao|oes)|dados?)\s+(?:pessoa(?:l|is))|personal\s+(?:info|information|details?|data))\b/],
  ['store',/^(?:cart(?:ao|oes)\s+(?:de\s+)?(?:loja|cliente|fidelizacao|pontos)|store\s+card|loyalty\s+card)\b/],
  ['totp',/^(?:(?:codigos?|chaves?|contas?)\s+(?:de\s+)?)?(?:2fa|f2a|autenticador|autenticacao de dois fatores|totp|otp|authenticator|two[- ]factor)\b/],
  ['wifi',/^(?:redes?\s+(?:de\s+)?)?(?:wi-?fi|wireless)\b|^redes?\b/],
  ['note',/^(?:notas?|apontamentos?|notes?)\b/],
  ['vault',/^(?:passwords?|pass|senhas?|palavras?[- ]?passe|contas?|acessos?|logins?|credenciais|credencial|entradas?|accounts?|credentials?)\b/],
];
// etiquetas de cada tipo (sem acentos; as mais compridas primeiro)
const AURR_LABELS={
  note:{title:'titulo|title|assunto|subject|nome|name',body:'texto|conteudo|corpo|descricao|mensagem|text|body|content|description|message'},
  vault:{user:'nome de utilizador|utilizador|username|user name|user|login|e-mail|email|mail|id',name:'servico|site|website|plataforma|aplicacao|app|nome|service|name|conta|account',url:'url|link|endereco|address',pw:'palavra[- ]passe|password|senha|pass|pwd|pw|pin',notes:'notas|nota|observacoes|obs|notes'},
  totp:{secret:'chave secreta|codigo secreto|segredo|chave|secret key|secret|key|seed|otpauth|codigo|code',account:'utilizador|username|user|login|e-mail|email|account',name:'servico|site|emissor|aplicacao|app|nome|conta|issuer|service|name'},
  wifi:{name:'nome da rede|nome|rede|ssid|network name|network|name',pw:'palavra[- ]passe|password|senha|pass|chave|key|pw'},
  store:{number:'numero do cartao|numero|n[º.o]?|codigo de barras|codigo|number|code|card number',name:'nome|loja|name|store|shop'},
};
function aurrLabelRe(type,mode){
  const L=AURR_LABELS[type],alt=Object.keys(L).map(k=>'(?<'+k+'>'+L[k]+')').join('|');
  // 'colon': «título: x» / «título = x» · 'seg': no início de cada parte, sem dois pontos («2fa: nome GitHub; chave …»)
  // 'natural': «com o título x e o texto y» (só quando não há nenhuma das outras)
  if(mode==='natural')return new RegExp('(?:\\bcom\\s+(?:o\\s+|a\\s+)?|[,;]\\s*(?:e\\s+)?(?:o\\s+|a\\s+)?|\\be\\s+(?:o\\s+|a\\s+)?|\\bwith\\s+(?:the\\s+)?|\\band\\s+(?:the\\s+)?)(?:'+alt+')\\s+','g');
  if(mode==='seg')return new RegExp('[;:\\n]\\s*(?:'+alt+')\\s+(?![:=])','g');
  return new RegExp('(?:^|[\\s;,(\\n:])(?:'+alt+')\\s*[:=]\\s*','g');
}
function aurrClean(v){
  return String(v||'').replace(/^[\s:=;,.\-–]+/,'').replace(/[\s;,]+$/,'').replace(/\s+(?:e|and)(?:\s+(?:o|a|the))?\s*$/i,'').replace(/[\s;,]+$/,'')
    .replace(/^["«“'](.*)["»”']$/s,'$1').trim();
}
function aurrHead(v){return aurrClean(String(v||'').replace(/^[\s:\-–]+/,'').replace(/^(?:para|pra|do|da|dos|das|de|no|na|nos|nas|sobre|about|for|of|on|to|from)\s+(?:o\s+|a\s+|os\s+|as\s+|the\s+)?/i,''));}
function aurrFields(type,raw,fold,from){
  const out={},grab=mode=>{const re=aurrLabelRe(type,mode),hits=[];re.lastIndex=from;let m;
    while((m=re.exec(fold))){const k=Object.keys(m.groups).find(g=>m.groups[g]!=null);hits.push({k,at:m.index,end:m.index+m[0].length});if(m[0].length===0)re.lastIndex++;}
    return hits;};
  let all=grab('colon').concat(grab('seg'));if(!all.length)all=grab('natural');
  // por ordem; uma etiqueta que comece dentro de outra já apanhada (p. ex. no valor dela) não conta
  all.sort((a,b)=>a.at-b.at||b.end-a.end);
  const seen=[];all.forEach(h=>{const p=seen[seen.length-1];if(!p||h.at>=p.end)seen.push(h);});
  seen.forEach((h,i)=>{const v=aurrClean(raw.slice(h.end,i+1<seen.length?seen[i+1].at:raw.length));if(v&&out[h.k]==null)out[h.k]=v;});
  return {fields:out,head:aurrHead(raw.slice(from,seen.length?seen[0].at:raw.length)),n:Object.keys(out).length};
}

function aurrParse(raw){
  const fold=aurrFold(raw);
  const vm=fold.match(AURR_VERB);if(!vm)return null;
  let i=vm[0].length;
  const am=fold.slice(i).match(AURR_ART);if(am)i+=am[0].length;
  let type=null;
  for(const [t,re] of AURR_TYPES){const m=fold.slice(i).match(re);if(m){type=t;i+=m[0].length;break;}}
  if(!type&&/^anot/.test(vm[1]))type='note';
  if(!type)return null;
  return {type,from:i,fold,verb:vm[1]};
}

function aurrSayList(rows){return rows.filter(r=>r[1]).map(r=>'• '+r[0]+': <b>'+aurEsc(r[1])+'</b>').join('\n');}
function aurrMask(s){s=String(s||'');return s.length<=4?'••••':s.slice(0,4)+'•'.repeat(Math.min(8,s.length-4));}

/* ── nota: grava logo (como as notas rápidas) ── */
function aurrNote(raw,P){
  const {fields:f,head}=aurrFields('note',raw,P.fold,P.from);
  let title=f.title||'',body=f.body||'';
  if(!title&&!body){
    // sem etiquetas: os verbos que as notas rápidas já conhecem («cria uma nota a dizer …») continuam a ir para lá;
    // aqui ficam os outros («regista uma nota: comprar leite», «anota: …»)
    if(/^(cri|escrev|faz|adicion|tom|guard|nov|new|write|add|make|create|take)/.test(P.verb))return null;
    const t=aurrClean(raw.slice(P.from).replace(/^\s*(?::|-|a dizer|que diz|com o texto|com|a lembrar|sobre|saying|that says|with|about)\s*/i,''));
    if(!t)return null;
    body=t;
  }else if(!title&&head&&!/^(com|with)$/i.test(head))title=head;
  const derived=!title;
  if(!title)title=aurCap(body.split(/[.\n]/)[0].split(/\s+/).slice(0,6).join(' '));
  if(typeof notes==='undefined')return null;
  const note={id:Date.now().toString(36),title,body,createdAt:Date.now()};
  notes.push(note);aurLog('add',title,'📝');aurDirty();
  AUR.last={type:'note',obj:note,name:title};
  const short=body.length>160?body.slice(0,160)+'…':body;
  return aurSay(derived?aurL('📝 Guardei a nota: ','📝 Saved the note: ')+'<b>'+aurEsc(short)+'</b>'
      :aurL('📝 Guardei a nota <b>','📝 Saved the note <b>')+aurEsc(title)+'</b>'+(body?':\n'+aurEsc(short):'.'),
    [{label:aurL('Abrir nota','Open note'),fn:()=>aurOpenEnt({type:'note',obj:note,name:title},{raw,c:new Set()},true)}]);
}

/* ── password / conta: confirma antes de criar (gera uma password forte se não vier nenhuma) ── */
function aurrVault(raw,P){
  const {fields:f,head,n}=aurrFields('vault',raw,P.fold,P.from);if(!n)return null;
  let name=f.name||'',url=f.url||'',user=f.user||'';
  if(!name&&head)name=head;
  const dom=s=>(String(s).match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+)\.[a-z.]{2,}/i)||[])[1];
  if(name&&!url&&/^(?:https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(name)){url=name;name=aurCap(dom(name)||name);}
  if(!name&&url)name=aurCap(dom(url)||url);
  if(!name&&/@/.test(user)){const d=user.split('@')[1];name=aurCap((d||'').split('.')[0]);}
  if(!name){AUR.pending={type:'askName',withText:t=>aurConfirmAdd({name:aurCap(t.trim()),user,pw:f.pw||'',url,notes:f.notes||''})};
    return aurSay(aurL('Para que serviço é este acesso? (ex.: Netflix)','Which service is this account for? (e.g. Netflix)'));}
  name=name===name.toLowerCase()?aurCap(name):name;
  return aurConfirmAdd({name,user,pw:f.pw||'',url,notes:f.notes||''});
}

/* ── código 2FA ── */
function aurrTotp(raw,P){
  const {fields:f,head,n}=aurrFields('totp',raw,P.fold,P.from);
  const uri=(raw.match(/otpauth:\/\/\S+/i)||[])[0];
  if(!n&&!uri)return null;
  if(typeof totp==='undefined')return null;
  if(aurTotpLocked())return aurNeed2fa(raw);
  let name=f.name||head||'',account=f.account||'',secret=(f.secret||'').replace(/^otpauth.*$/i,'');
  let opts={type:'totp',algorithm:'SHA1',digits:6,period:30,counter:null};
  const p=uri&&typeof parseOtpauth==='function'?parseOtpauth(uri):null;
  if(p){secret=p.secret;name=name||p.name||'';account=account||p.account||'';opts={type:p.type,algorithm:p.algorithm,digits:p.digits,period:p.period,counter:p.counter};}
  secret=String(secret||'').toUpperCase().replace(/[\s\-]/g,'');
  if(!secret)return aurSay(aurL('Falta a chave secreta do 2FA (a que o site mostra ao ativar, ex.: JBSW Y3DP…). Diz-ma assim: «adiciona um 2fa: nome GitHub; chave JBSWY3DPEHPK3PXP».','I need the 2FA secret key (the one the site shows when you turn it on, e.g. JBSW Y3DP…). Say: “add a 2fa: name GitHub; key JBSWY3DPEHPK3PXP”.'));
  if(typeof b32decode==='function'&&!b32decode(secret))return aurSay(aurL('Essa chave não parece válida: as chaves de 2FA só têm letras A–Z e números 2–7.','That key doesn’t look valid: 2FA keys only use the letters A–Z and the digits 2–7.'));
  if(!name){AUR.pending={type:'askName',withText:t=>aurrTotpConfirm(aurCap(t.trim()),account,secret,opts)};return aurSay(aurL('De que serviço é este código 2FA? (ex.: GitHub)','Which service is this 2FA code for? (e.g. GitHub)'));}
  return aurrTotpConfirm(aurCap(name),account,secret,opts);
}
function aurrTotpConfirm(name,account,secret,o){
  AUR.pending={ok:()=>{
    const e={id:Date.now().toString(36),name,account,secret,type:o.type,algorithm:o.algorithm,digits:o.digits,period:o.period,counter:o.counter,recovery:'',createdAt:Date.now()};
    totp.push(e);aurLog('add',name,'🔢');aurDirty();if(typeof renderTotp==='function')try{renderTotp();}catch(x){}
    AUR.last={type:'totp',obj:e,name};
    return aurSay(aurL('✓ Adicionei o código 2FA de <b>','✓ Added the 2FA code for <b>')+aurEsc(name)+aurL('</b>. Não te esqueças de gravar.','</b>. Don’t forget to save.'));
  }};
  return aurSay(aurL('Vou adicionar este código 2FA:\n','I’ll add this 2FA code:\n')+aurrSayList([[aurL('Serviço','Service'),name],[aurL('Conta','Account'),account],[aurL('Chave','Key'),aurrMask(secret)]])+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}

/* ── rede Wi-Fi ── */
function aurrWifi(raw,P){
  const {fields:f,head,n}=aurrFields('wifi',raw,P.fold,P.from);if(!n)return null;
  if(typeof wifiNets==='undefined')return null;
  const name=f.name||head||'';
  if(!name)return aurSay(aurL('Qual é o nome da rede? Diz assim: «nova rede wi-fi: nome Casa; password …».','What’s the network name? Say: “new wi-fi network: name Home; password …”.'));
  const pw=f.pw||'';
  AUR.pending={ok:()=>{
    const w={id:'w'+Date.now().toString(36),name,ssid:name,pw,sec:pw?'WPA':'nopass'};
    wifiNets.push(w);aurLog('add',name,'📶');aurDirty();
    return aurSay(aurL('📶 Guardei a rede <b>','📶 Saved the network <b>')+aurEsc(name)+'</b>.');
  }};
  return aurSay(aurL('Vou guardar esta rede Wi-Fi:\n','I’ll save this Wi-Fi network:\n')+aurrSayList([[aurL('Rede','Network'),name],['Password',pw?aurrMask(pw):aurL('(aberta, sem password)','(open, no password)')]])+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}

/* ── cartão de loja ── */
function aurrStore(raw,P){
  const {fields:f,head,n}=aurrFields('store',raw,P.fold,P.from);if(!n)return null;
  if(typeof storeCards==='undefined')return null;
  const name=aurCap(f.name||head||''),number=(f.number||'').replace(/\s+/g,'');
  if(!name||!number)return aurSay(aurL('Preciso do nome da loja e do número do cartão: «cartão de loja: nome Continente; número 2600000012345».','I need the store name and the card number: “store card: name Lidl; number 2600000012345”.'));
  AUR.pending={ok:()=>{
    const s={id:Date.now().toString(36),name,number,color:'#c9a84c'};
    storeCards.push(s);aurLog('add',name,'🎟️');aurDirty();if(typeof updateWalletTiles==='function')try{updateWalletTiles();}catch(x){}
    return aurSay(aurL('🎟️ Guardei o cartão <b>','🎟️ Saved the card <b>')+aurEsc(name)+'</b>.');
  }};
  return aurSay(aurL('Vou guardar este cartão de loja:\n','I’ll save this store card:\n')+aurrSayList([[aurL('Loja','Store'),name],[aurL('Número','Number'),number]])+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}

/* ── info pessoal: cada «campo: valor» vai para a tua ficha (ou para a pessoa indicada: «info pessoal da Maria: …») ── */
function aurrPerson(raw,P){
  if(typeof personalInfo==='undefined')return null;
  let rest=raw.slice(P.from);
  let who='';const wm=aurrFold(rest).match(/^\s*(?:d[aoe]|of|for)\s+([^:;,\n]+?)\s*(?=:)/);
  if(wm){who=aurrClean(rest.slice(wm.index,wm.index+wm[0].length).replace(/^\s*(?:d[aoe]|of|for)\s+/i,''));rest=rest.slice(wm.index+wm[0].length);}
  const pairs=[];
  rest.replace(/^\s*[:\-–]\s*/,'').split(/\s*[;\n]\s*|,\s*(?=[^,:;]{1,40}[:=])/).forEach(part=>{
    const m=part.match(/^\s*([^:=]{1,40}?)\s*[:=]\s*(.+)$/s);if(!m)return;
    const label=aurrClean(m[1]),value=aurrClean(m[2]);if(label&&value)pairs.push({label:aurCap(label),value});
  });
  if(!pairs.length)return null;
  const en=AUR.lang==='en';
  let person=null,isNew=false;
  if(who){const w=aurNorm(who);person=aurA(personalInfo).find(p=>p&&aurNorm(p.name)===w)||aurA(personalInfo).find(p=>p&&aurNorm(p.name).split(' ')[0]===w.split(' ')[0]);if(!person){person={id:'p'+Date.now().toString(36),name:aurCap(who),fields:[]};isNew=true;}}
  else{person=aurOwner();if(!person){person={id:'p'+Date.now().toString(36),name:(typeof vaultName!=='undefined'&&vaultName.trim())||(en?'Me':'Eu'),fields:[]};isNew=true;}}
  const plan=pairs.map(x=>{const ex=aurA(person.fields).find(fl=>aurNorm(fl.label)===aurNorm(x.label));return {...x,ex};});
  AUR.pending={ok:()=>{
    if(isNew)personalInfo.push(person);
    if(!Array.isArray(person.fields))person.fields=[];
    plan.forEach((x,k)=>{if(x.ex)x.ex.value=x.value;else person.fields.push({id:(Date.now()+k).toString(36),label:x.label,value:x.value});});
    aurLog('edit',person.name,'👤');aurDirty();
    return aurSay(aurL('✓ Guardei na Info de <b>','✓ Saved to <b>')+aurEsc(person.name)+aurL('</b>: ','</b>’s info: ')+plan.map(x=>aurEsc(x.label)).join(', ')+'.');
  }};
  return aurSay(aurL('Vou guardar na Info de <b>','I’ll save to <b>')+aurEsc(person.name)+'</b>'+aurL(isNew?' (nova ficha)':'',isNew?' (new profile)':'')+aurL(':\n','’s info:\n')
    +plan.map(x=>'• '+aurEsc(x.label)+': <b>'+aurEsc(x.value)+'</b>'+(x.ex&&x.ex.value!==x.value?' <span class="a-dim">('+aurL('era ','was ')+aurEsc(x.ex.value)+')</span>':'')).join('\n')+'\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
}

const AURR_DO={note:aurrNote,vault:aurrVault,totp:aurrTotp,wifi:aurrWifi,store:aurrStore,person:aurrPerson};
aurStage('registar',25,(raw,next)=>{
  const P=aurrParse(String(raw||''));
  if(!P)return next(raw);
  const dl=aurDetectLang(raw,new Set());if(dl)AUR.lang=dl;
  // um pedido novo substitui uma confirmação que tenha ficado por responder
  const prev=AUR.pending;AUR.pending=null;
  const r=AURR_DO[P.type](String(raw),P);
  if(r==null){AUR.pending=prev;return next(raw);}
  AUR.trace='registar:'+P.type;
  return r;
});
