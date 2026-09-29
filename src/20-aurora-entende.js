
/* ═══════════ AURORA · ENTENDE MAIS ═══════════
   Frases do dia a dia que a Aurora ainda não percebia: «como faço…», conversa, «tenho X guardado?»,
   faturas por pagar, notas rápidas, subscrições, garantias, licenças, aniversários… */
AUR_PHR.push(
  [/\bguardad[oa]s?\b/g,' '],
  [/\b(password|pass)\s+(da|de)\s+net\b/g,' password do wifi '],
  [/\bmodo\s+(escuro|noturno|noite)\b|\bdark\s+(mode|theme)\b/g,' temas escuros '],
  [/\bmodo\s+claro\b|\blight\s+(mode|theme)\b/g,' temas claros '],
  [/\bcodigos?\s+de\s+(verificacao|autenticacao|acesso)\b|\bverification\s+codes?\b/g,' codigo 2fa ']
);
aurV('D_2FA','autenticacao autenticador');
aurV('ADD','digitaliza digitalizar scan scanear fotografa fotografar anota anotar aponta apontar');
aurV('GET','entro');

// cada pedido do dia a dia é uma intenção com nome e prioridade (ver o motor em src/14-aurora-ai.js)
function aurPre(name,prio,fn){aurIntent(name,prio,fn,true);}
const aurHas=(F,...k)=>k.some(x=>F.c.has(x));
function aurDateTxt(v){const d=/^\d{4}-\d\d-\d\d/.test(String(v))?new Date(String(v).slice(0,10)+'T00:00:00'):new Date(v);return isNaN(d)?String(v):aurDate(d);}

/* ── conversa ── */
const AUR_TALK=[
  [/^(como estas|como vai|tudo bem|esta tudo bem|how are you|how s it going)$/,()=>aurL('Estou ótima, obrigada! 😊 E o teu cofre também está bem guardado. Em que te posso ajudar?','I’m great, thanks! 😊 Your vault is safe and sound too. How can I help?')],
  [/^(quem es|quem es tu|o que es|o que es tu|como te chamas|who are you|what are you|what s your name)$/,()=>aurL('Sou a <b>Aurora</b> ✨, a assistente do teu cofre. Encontro passwords, códigos, documentos e cartões, leio faturas, aviso-te do que expira — tudo no teu dispositivo, sem internet.','I’m <b>Aurora</b> ✨, your vault assistant. I find passwords, codes, documents and cards, read bills and warn you about what expires — all on your device, offline.')],
  [/^(es (fixe|linda|top|incrivel|a maior|brutal|otima|espetacular)|gosto de ti|adoro-te|adoro te|you re (great|awesome|the best)|i love you|good job|bom trabalho|boa)$/,()=>aurL('Obrigada! 🥰 Estou aqui sempre que precisares.','Thank you! 🥰 I’m here whenever you need me.')],
  [/^(nao percebi|nao entendi|nao sei|estou perdido|estou perdida|nao sei o que fazer|i m lost|i don t understand|i dont understand)$/,()=>aurL('Sem problema! Diz-me por palavras tuas o que precisas — por exemplo «qual a password do gmail», «o que expira este mês» ou «quanto paguei de luz». Ou escolhe:','No problem! Tell me in your own words — e.g. “what’s my gmail password”, “what expires this month”. Or pick one:'),true],
  [/^(adeus|ate logo|ate ja|tchau|xau|bye|goodbye|see you)$/,()=>aurL('Até já! ✨','See you! ✨')],
];
aurPre('conversa.social',200,F=>{
  const n=F.n.replace(/\s*aurora$/,'');
  for(const [re,msg,chips] of AUR_TALK)if(re.test(n)){AUR.lang=/\b(how|who|what|you|are|i|m|lost|bye|goodbye|see|love|great|job|understand|dont|don|t|s|going|your|name)\b/.test(n)?'en':'pt';return aurSay(msg(),chips?aurQuickChips():[]);}
  return AUR_PASS;
});

/* ── «como faço…» e «é seguro?» ── */
const AUR_HOWTO=[
  [/\b(importa|importo|importar|import|passar|trazer|migrar)\b.*\b(chrome|google|firefox|edge|safari|bitwarden|lastpass|1password|dashlane|csv|passwords?|contas)\b|\b(chrome|lastpass|bitwarden|1password)\b.*\b(importa|importar|passar)\b/,
    ()=>aurL('📥 Para trazer passwords de outro sítio: exporta-as em <b>CSV</b> (no Chrome: Definições → Passwords → Exportar) e depois abre <b>Definições → Dados → Importar</b>. Aceito Chrome, Firefox, Edge, Safari, Bitwarden, LastPass, 1Password e Dashlane. Apaga o CSV no fim — está em claro.','📥 To bring passwords over: export them as <b>CSV</b> (Chrome: Settings → Passwords → Export), then open <b>Settings → Data → Import</b>. I accept Chrome, Firefox, Edge, Safari, Bitwarden, LastPass, 1Password and Dashlane. Delete the CSV afterwards — it isn’t encrypted.'),
    ()=>[{label:aurL('Abrir importação','Open import'),fn:()=>aurSettings('dados')}]],
  [/\b(exporta|exporto|exportar|export)\b/,()=>aurL('📤 Posso exportar para <b>PDF</b> (para imprimir e guardar num sítio seguro) ou <b>CSV</b> (para outro gestor). Cuidado: o ficheiro fica sem encriptação.','📤 I can export to <b>PDF</b> (to print and keep somewhere safe) or <b>CSV</b> (for another manager). Careful: the file isn’t encrypted.'),()=>[{label:aurL('Exportar','Export'),fn:()=>aurQuick(aurL('exporta as passwords','export passwords'))}]],
  [/\b2fa\b/,()=>aurL('🔐 O <b>2FA</b> é um segundo código que muda a cada 30 s. Para o adicionar: no site, ativa a verificação em 2 passos e escolhe «app de autenticação»; depois toca em ＋ → 2FA e lê o QR (ou cola a chave). A partir daí peço-te só «código do …».','🔐 <b>2FA</b> is a second code that changes every 30 s. To add one: on the website turn on 2-step verification and choose “authenticator app”; then tap ＋ → 2FA and scan the QR (or paste the key). Then just ask me “code for …”.'),()=>[{label:aurL('Adicionar 2FA','Add 2FA'),fn:()=>aurQuick(aurL('adiciona um código 2fa','add a 2fa code'))}]],
  [/\b(wifi|wi fi|rede)\b/,()=>aurL('📶 Para partilhar o Wi-Fi mostro um <b>QR</b> — a outra pessoa aponta a câmara e liga-se sem escrever a password.','📶 To share Wi-Fi I show a <b>QR code</b> — the other person points their camera and connects without typing.'),()=>[{label:aurL('Mostrar QR','Show QR'),fn:()=>aurQuick(aurL('partilha o wifi','share wifi'))}]],
  [/\b(backup|copia|copias|guardar o cofre|nao perder|perder os dados|recuperar o cofre)\b/,()=>aurL('💾 O cofre grava sozinho neste dispositivo. Para não perderes nada: liga o <b>Google Drive</b> (Definições → Dados) ou faz <b>cópias de segurança</b> — ficam encriptadas.','💾 The vault saves itself on this device. To never lose it: connect <b>Google Drive</b> (Settings → Data) or make <b>backups</b> — they stay encrypted.'),()=>[{label:aurL('Fazer cópia agora','Back up now'),fn:()=>aurQuick(aurL('faz uma cópia de segurança','back up'))},{label:aurL('Definições → Dados','Settings → Data'),fn:()=>aurSettings('dados')}]],
  [/\b(biometria|impressao digital|pin|desbloque\w*|entrar mais rapido)\b/,()=>aurL('👆 Em <b>Definições → Segurança</b> ativas o PIN e a impressão digital / Face ID para abrir o cofre num toque.','👆 In <b>Settings → Security</b> you can turn on a PIN and fingerprint / Face ID to open the vault with one tap.'),()=>[{label:aurL('Abrir Segurança','Open Security'),fn:()=>aurSettings('seguranca')}]],
  [/\b(passmestra|mestra)\b/,()=>aurL('🔑 A palavra-passe mestra muda-se em <b>Definições → Segurança</b>. Guarda-a bem — sem ela ninguém (nem eu) consegue abrir o cofre.','🔑 Change the master password in <b>Settings → Security</b>. Keep it safe — without it nobody (not even me) can open the vault.'),()=>[{label:aurL('Abrir Segurança','Open Security'),fn:()=>aurSettings('seguranca')}]],
  [/\b(documento|documentos|digitaliza\w*|scan\w*|fotografa\w*|fatura|faturas|pdf|ficheiro)\b/,()=>aurL('📄 Toca em ＋ → Documento, ou <b>larga/partilha o ficheiro aqui na conversa</b> — eu leio-o (PDF ou foto), guardo-o encriptado e digo-te o que encontrei (valor, datas, NIF…).','📄 Tap ＋ → Document, or <b>drop/share the file here in the chat</b> — I read it (PDF or photo), store it encrypted and tell you what I found (amount, dates, tax no.…).'),()=>[{label:aurL('Adicionar documento','Add document'),fn:()=>aurQuick(aurL('adiciona um documento','add a document'))}]],
  [/\b(heranca)\b/,()=>aurL('🕊️ A <b>herança digital</b> prepara um kit para alguém de confiança aceder ao cofre se te acontecer algo.','🕊️ <b>Digital legacy</b> prepares a kit so someone you trust can access the vault if something happens to you.'),()=>[{label:aurL('Abrir herança','Open legacy'),fn:()=>aurSettings('heranca')}]],
  [/\b(tema|temas|cor|cores|aspeto)\b/,()=>aurL('🎨 Diz-me «temas escuros», «temas claros» ou o nome de um tema («aplica o oceano»).','🎨 Say “dark themes”, “light themes” or a theme name (“apply ocean”).'),()=>[{label:aurL('Ver temas','See themes'),fn:()=>aurQuick(aurL('temas','themes'))}]],
  [/\b(apag\w*|recuper\w*|reciclagem|lixo|arquiv\w*)\b/,()=>aurL('🗑️ O que apagas vai para a <b>Reciclagem</b> — dá para recuperar («recupera o gmail»). O <b>Arquivo</b> guarda o que já não usas sem apagar.','🗑️ What you delete goes to the <b>Trash</b> — you can restore it (“restore gmail”). The <b>Archive</b> keeps what you no longer use without deleting it.'),()=>[{label:aurL('Abrir Reciclagem','Open Trash'),fn:()=>aurGoTab('trash')}]],
  [/\b(password|passwords|conta|contas|acesso|acessos|entrada)\b/,()=>aurL('🔑 Toca em ＋ (canto superior) → Password, ou diz-me, por exemplo: «adiciona a netflix com user eu@mail.pt e password …» — se não disseres a password, gero uma forte.','🔑 Tap ＋ (top corner) → Password, or tell me e.g. “add netflix with user me@mail.com and password …” — if you don’t give one, I generate a strong password.'),()=>[{label:aurL('Adicionar agora','Add now'),fn:()=>{if(typeof openModal==='function'){aurClose();openModal();}}}]],
];
const AUR_SAFE=/\b(cofre|dados|app|aplicacao|isto|vault|data)\b.*\b(seguros?|seguras?|protegid\w*|encriptad\w*|safe|secure)\b|\b(onde ficam|onde estao|onde sao guardad\w*|quem (ve|pode ver|tem acesso)|where (is|are) my (data|passwords)|who can see)\b|\b(e seguro|is it safe|is this safe)\b/;
aurPre('ajuda.comoFazer',210,F=>{
  const n=F.n;
  if(AUR_SAFE.test(n)&&!F.cands.some(e=>e.score>=0.5)){
    const sc=typeof calcSecurityScore==='function'?calcSecurityScore():null;
    const yes=!/\b(onde|quem|where|who)\b/.test(n);
    return aurSay(aurL('🛡️ '+(yes?'Sim. ':'')+'O teu cofre é encriptado com <b>AES-256</b> e uma chave tirada da tua palavra-passe mestra (<b>600 000</b> iterações PBKDF2). Tudo fica <b>no teu dispositivo</b> (e no teu Drive, se o ligares) — encriptado; eu trabalho offline e nada é enviado para servidores. Nem eu vejo a tua palavra-passe mestra.','🛡️ '+(yes?'Yes. ':'')+'Your vault is encrypted with <b>AES-256</b> and a key derived from your master password (<b>600,000</b> PBKDF2 iterations). Everything stays <b>on your device</b> (and your Drive, if connected) — encrypted; I work offline and nothing is sent to servers. Not even I can see your master password.')+(sc!=null?aurL('\nPontuação das tuas passwords: <b>'+sc+'/100</b>.','\nYour password score: <b>'+sc+'/100</b>.'):''),[{label:aurL('Ver segurança','Check security'),fn:()=>aurQuick(aurL('tenho passwords fracas','any weak passwords'))}]);
  }
  if(!/^(como|how (do|can|to)|how i|de que forma|onde (e que )?(posso|consigo)|e possivel|consigo|posso|da para|can i|como e que)\b/.test(n))return AUR_PASS;
  if(/\b(entro|entrar|login|acedo)\b/.test(n)&&F.cands.some(e=>e.type==='vault'&&e.score>=0.5))return AUR_PASS;   // «como entro no gmail» = mostra o gmail
  for(const [re,msg,chips] of AUR_HOWTO)if(re.test(n))return aurSay(msg(),chips());
  return AUR_PASS;
});

/* ── passwords: gerar, «são seguras?», «a mesma password» ── */
aurPre('password.gerarAuditar',220,F=>{
  const n=F.n;
  if(!/\bpassword\b/.test(n))return AUR_PASS;
  const hasEnt=F.cands.some(e=>e.type==='vault'&&e.score>=0.5);
  if(/\b(mesma|iguais|igual|repetid\w*|duplicad\w*|same)\b/.test(n)&&!hasEnt)return aurAudit(Object.assign({},F,{n:n+' repetidas'}));
  if(/\bpasswords?\b.*\b(sao|estao|are)\b.*\b(seguras|fortes|boas|safe|secure|strong|good)\b|\b(seguranca|estado) das (minhas )?passwords\b/.test(n))return aurAudit(F);
  // «preciso de uma password nova», «cria uma password com 12 letras», «inventa uma password»
  const wantNew=/\b(cria|criar|gera|gerar|faz|fazer|inventa|inventar|arranja|arranjar|make|create)\b[^.]{0,20}\bpassword\b/.test(n)||/\b(preciso|quero|da|dame|need|want|give)\b[^.]{0,20}\b(uma|a|an)\b[^.]{0,12}\bpassword\b|\bpassword\s+(nova|novas|new)\b/.test(n);
  if(!hasEnt&&wantNew&&!aurHas(F,'D_WIFI')&&!F.cands.some(e=>e.score>=0.5)&&!/\s(para|pra|no|na|do|da|de|dos|das|for|to|of)\s+(?!decorar)\S/.test(n.slice(n.indexOf('password')).replace(/\bcom \d+.*$/,''))&&!/@/.test(F.raw)){
    const len=+((n.match(/\b(\d{1,2})\s*(letras|caracteres|carateres|digitos|chars?|characters|letters)?\b/)||[])[1]||0);
    const mem=/\b(decorar|memoravel|facil|faceis|memorable|easy)\b/.test(n);
    return aurHandle((mem?aurL('gera uma password fácil de decorar','generate a memorable password'):aurL('gera uma password forte','generate a strong password'))+(len?aurL(' com '+len+' caracteres',' with '+len+' characters'):''));
  }
  return AUR_PASS;
});

/* ── «tenho X guardado?» ── */
aurPre('tenho.guardado',230,F=>{
  const n=F.n;
  if(!/^(tenho|ja tenho|tens|ha|existe|do i have|have i got|is there)\b/.test(n)||aurHas(F,'ADD','DELETE','CHANGE','SCHEDULE','D_EXPIRY'))return AUR_PASS;
  const kinds=[['vault',/\b(password|conta|acesso|login|account)\b/],['store',/\bcartao loja\b|\bcartao (do|da|de) (lidl|continente|pingo|auchan|intermarche|minipreco|ikea|fnac|worten|decathlon|sephora|primark)\b/],['bank',/\bcartao bancario\b/],['doc',/\b(documento|document|escritura|contrato|fatura|apolice)\b/],['totp',/\b2fa\b/],['wifi',/\bwifi\b/],['note',/\bnota\b/]];
  const k=kinds.find(x=>x[1].test(n));if(!k)return AUR_PASS;
  const hits=F.cands.filter(e=>e.type===k[0]&&e.score>=0.5);
  if(hits.length===1)return aurOpenEnt(hits[0],F,false);
  if(hits.length>1)return aurChoose(hits,F,aurL('Sim, tens '+hits.length+':','Yes, you have '+hits.length+':'));
  if(k[0]==='doc'&&F.terms.length)return AUR_PASS;   // documentos: procura também dentro do texto
  const skip=/^(password|conta|acesso|login|account|cartao|loja|bancario|documento|document|2fa|wifi|nota|tenho|ha|existe|have|there)$/;
  const W=F.Q.filter(t=>!skip.test(t)&&!AUR_STOP.has(t));
  if(!W.length||W.some(t=>AUR_VOCAB[t]||/^(fracas?|fortes?|repetidas?|antigas?|seguras?|expiradas?|velhas?|novas?|iguais|weak|old|reused)$/.test(t)))return AUR_PASS;
  const what=W.join(' ');
  const nm=aurCap(what);
  const add={vault:()=>aurQuick(aurL('adiciona '+what,'add '+what)),store:()=>{if(typeof openStoreModal==='function'){aurClose();openStoreModal();}},bank:()=>{if(typeof openCardModal==='function'){aurClose();openCardModal();}},doc:()=>aurQuick(aurL('adiciona um documento','add a document')),totp:()=>aurQuick(aurL('adiciona um código 2fa','add a 2fa code')),wifi:()=>{if(typeof openWifiManager==='function'){aurClose();openWifiManager();}},note:()=>aurQuick(aurL('cria uma nota','create a note'))}[k[0]];
  const kl={vault:['',''],store:['cartão ','card '],bank:['cartão ','card '],doc:['documento ','document '],totp:['código 2FA do ','2FA code for '],wifi:['rede ','network '],note:['nota ','note ']}[k[0]];
  return aurSay(aurL('Não, não tens '+kl[0]+'<b>'+aurEsc(nm)+'</b> guardado.','No, you don’t have a '+kl[1]+'<b>'+aurEsc(nm)+'</b> saved.'),[{label:aurL('Adicionar ','Add ')+nm,fn:add}]);
});

/* ── cartões: validade de um cartão; lista de cartões ── */
aurPre('cartao.validadeLista',240,F=>{
  const n=F.n;
  const C=aurA(typeof bankCards!=='undefined'?bankCards:[]).filter(c=>c&&!c.archived);
  if(!C.length)return AUR_PASS;
  const named=F.cands.filter(e=>e.type==='bank'&&e.score>=0.5).map(e=>e.obj);
  if(named.length===1&&(aurHas(F,'D_EXPIRY')||/\b(validade|expira|caduca|valido|valida)\b/.test(n))&&!aurHas(F,'SCHEDULE')){
    const c=named[0],m=/^(\d{2})\/(\d{2})$/.exec(c.expiry||'');
    if(!m)return aurSay(aurL('O cartão <b>'+aurEsc(c.bank||c.name)+'</b> não tem validade guardada.','The <b>'+aurEsc(c.bank||c.name)+'</b> card has no expiry saved.'));
    const d=new Date(2000+ +m[2],+m[1],0);
    return aurSay('💳 '+aurL('Cartão <b>','<b>')+aurEsc(c.name||c.bank)+aurL('</b>: válido até <b>','</b> card: valid until <b>')+c.expiry+'</b> ('+aurRel(d)+').');
  }
  if(/^(que|quais|quantos|mostra|lista|os meus|as minhas|what|which|list|show)\b/.test(n)&&/\bcartoes\b|\bcards\b|\bcartao bancario\b/.test(n)&&!named.length&&!/\bloja\b/.test(n)&&!aurHas(F,'D_EXPIRY')){
    return aurSay(aurL('💳 Tens <b>'+C.length+'</b> '+(C.length===1?'cartão':'cartões')+':','💳 You have <b>'+C.length+'</b> '+(C.length===1?'card':'cards')+':')+'\n'+C.map(c=>'• <b>'+aurEsc(c.name||c.bank)+'</b> ···· '+aurEsc(String(c.number||'').slice(-4))+(c.expiry?' · '+aurEsc(c.expiry):'')).join('\n'),C.slice(0,6).map(c=>({label:c.name||c.bank,fn:()=>aurOpenEnt({type:'bank',obj:c,name:c.name||c.bank},F,true)})));
  }
  return AUR_PASS;
});

/* ── documentos: «onde está o meu cartão de cidadão», «documentos pessoais» ── */
aurPre('docs.pessoais',250,F=>{
  const n=F.n,D=aurA(typeof documents!=='undefined'?documents:[]);
  const fd=F.fields.find(f=>['cc','carta','passaporte'].includes(f.k));
  if(fd&&/\b(onde|abre|mostra|ve|ver|show|open|where|foto|digitalizado)\b/.test(n)&&!aurHas(F,'ADD','CHANGE','D_EXPIRY')){
    const doc=D.find(d=>fd.l.test(aurCanon(d.title||d.name||'')));
    if(doc)return aurOpenEnt({type:'doc',obj:doc,name:doc.title},F,true);
  }
  if(/\bdocumentos?\b.*\b(pessoais|pessoal)\b|\b(pessoais|personal)\b.*\bdocuments?\b/.test(n)&&!aurHas(F,'ADD','DELETE')){
    const L=D.filter(d=>d.cat==='pessoal'&&!d.archived);
    if(!L.length)return aurSay(aurL('Não tens documentos na categoria pessoal.','You have no personal documents.'));
    return aurSay(aurL('📄 Documentos pessoais (','📄 Personal documents (')+L.length+'):',L.slice(0,10).map(d=>({label:d.title||d.name,fn:()=>aurOpenEnt({type:'doc',obj:d,name:d.title},F,true)})));
  }
  return AUR_PASS;
});

/* ── faturas: «faturas deste mês», «que faturas tenho por pagar» ── */
aurPre('faturas.lista',260,F=>{
  const n=F.n;
  const BW=/\b(faturas|fatura|recibos|bills|invoices)\b|\bcontas (da|de|do) (luz|agua|gas|internet|net|telemovel|casa)\b/;
  if(!BW.test(n)||aurHas(F,'ADD','DELETE'))return AUR_PASS;
  if(/\b(quanto|valor|total|how much)\b/.test(n))return AUR_PASS;   // valores: aurDocFacts
  const B=aurA(typeof documents!=='undefined'?documents:[]).filter(d=>d.facts&&(d.facts.kind==='fatura'||d.facts.dueDate)&&!d.archived);
  const unpaid=/\b(por pagar|pendentes?|em atraso|atrasad\w*|nao pag\w*|falta pagar|unpaid|to pay|overdue|due)\b/.test(n);
  const R=avDocPeriod(n);
  const list=/^(que|quais|mostra|lista|tenho|as minhas|faturas|which|show|list|my)\b/.test(n)||unpaid||R;
  if(!list||!/\b(faturas|recibos|bills|invoices)\b|\bcontas (da|de|do)\b/.test(n))return AUR_PASS;
  const when=d=>d.facts.issueDate||(d.createdAt?new Date(d.createdAt).toISOString().slice(0,10):'');
  let L=B;
  if(unpaid)L=L.filter(d=>d.facts.dueDate&&!d.paid&&auriDays(d.facts.dueDate)>=-60);
  if(R)L=L.filter(d=>{const w=when(d);return w&&w>=R.from&&w<=R.to;});
  L=L.sort((a,b)=>(unpaid?a.facts.dueDate.localeCompare(b.facts.dueDate):when(b).localeCompare(when(a))));
  const what=unpaid?aurL('por pagar','unpaid'):R?R.label:'';
  if(!L.length)return aurSay(unpaid?aurL('✅ Não tens faturas por pagar (das que li).','✅ No unpaid bills (among those I’ve read).'):aurL('Não encontrei faturas '+what+'.','I found no bills '+what+'.'),B.length?[]:[{label:aurL('Adicionar fatura','Add a bill'),fn:()=>aurQuick(aurL('adiciona um documento','add a document'))}]);
  const sum=L.reduce((s,d)=>s+(d.facts.total||0),0);
  const line=d=>'• <b>'+aurEsc(d.facts.entity||d.title)+'</b>'+(d.facts.total!=null?' — '+aurMoney(d.facts.total):'')+(unpaid?' · '+(auriDays(d.facts.dueDate)<0?aurL('venceu ','was due ')+auriWhen(auriDays(d.facts.dueDate)):aurL('pagar até ','due ')+aurDate(d.facts.dueDate)+' ('+auriWhen(auriDays(d.facts.dueDate))+')'):when(d)?' · '+aurDate(when(d)):'');
  return aurSay('🧾 '+aurL('Faturas ','Bills ')+what+' ('+L.length+(sum?' · '+aurMoney(sum):'')+'):\n'+L.slice(0,10).map(line).join('\n'),
    L.slice(0,4).map(d=>({label:(unpaid?aurL('✓ Paguei ','✓ Paid '):'')+(d.facts.entity||d.title),fn:unpaid?()=>{d.paid=true;aurDirty();if(typeof auriBadge==='function')auriBadge();return aurSay(aurL('✓ Marquei <b>','✓ Marked <b>')+aurEsc(d.facts.entity||d.title)+aurL('</b> como paga.','</b> as paid.'));}:()=>aurOpenEnt({type:'doc',obj:d,name:d.title},F,true)})));
});

/* ── notas rápidas: «cria uma nota a dizer…», «anota: …» ── */
aurPre('notas.rapida',270,F=>{
  const raw=F.raw;
  const m=raw.match(/^(?:por favor\s+)?(?:cria|criar|escreve|escrever|faz|fazer|adiciona|adicionar|toma|tomar|guarda|guardar|nova|new|write|add|make|create|take)?\s*(?:uma|a|an)?\s*(?:nota|note)\s*(?:a dizer|que diz|com o texto|com|a lembrar|sobre|saying|that says|with|about)?\s*[:\-–]?\s+(.{2,})$/i)||raw.match(/^(?:anota|anotar|aponta|apontar|note down|jot down)\s*[:\-–]?\s+(.{2,})$/i);
  if(!m||typeof notes==='undefined')return AUR_PASS;
  const body=m[1].trim().replace(/^["«“]|["»”]$/g,'');
  if(!body||/^(nova|new)$/i.test(body))return AUR_PASS;
  const title=aurCap(body.split(/[.\n]/)[0].split(/\s+/).slice(0,6).join(' '));
  const note={id:Date.now().toString(36),title,body,createdAt:Date.now()};
  notes.push(note);aurLog('add',title,'📝');aurDirty();
  AUR.last={type:'note',obj:note,name:title};
  return aurSay(aurL('📝 Guardei a nota <b>','📝 Saved the note <b>')+aurEsc(title)+'</b>.',[{label:aurL('Abrir nota','Open note'),fn:()=>aurOpenEnt({type:'note',obj:note,name:title},F,true)}]);
});

/* ── dados pessoais: aniversário, email de uma pessoa ── */
aurPre('info.anosEmail',280,F=>{
  const n=F.n;
  if(/\b(quando faco anos|o meu aniversario|quando e o meu aniversario|quando nasci|que idade tenho|quantos anos tenho|my birthday|how old am i)\b/.test(n)){
    const p=aurOwner();const f=p&&aurA(p.fields).find(x=>/nascimento|birth/i.test(aurNorm(x.label||'')));
    if(!f||!f.value)return aurSay(aurL('Ainda não tenho a tua data de nascimento. Diz-me: «adiciona a minha data de nascimento 17/05/1990».','I don’t have your date of birth yet. Tell me: “add my date of birth 17/05/1990”.'));
    const m=String(f.value).match(/(\d{4})-(\d{2})-(\d{2})/)||String(f.value).match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/);
    if(!m)return aurSay('🎂 '+aurEsc(f.value));
    const [Y,M,D]=m[1].length===4?[+m[1],+m[2],+m[3]]:[+m[3],+m[2],+m[1]];
    const t=aurToday();let next=new Date(t.getFullYear(),M-1,D);if(next<t)next=new Date(t.getFullYear()+1,M-1,D);
    const age=next.getFullYear()-Y-1,days=Math.round((next-t)/864e5);
    return aurSay('🎂 '+aurL('Fazes anos a <b>'+D+' de '+AUR_MESES[M-1].replace('marco','março')+'</b> — '+(days===0?'<b>é hoje! Parabéns! 🎉</b>':'faltam <b>'+days+'</b> '+(days===1?'dia':'dias'))+'. Tens '+(days===0?age+1:age)+' anos.','Your birthday is <b>'+AUR_MONTHS[M-1].replace(/^./,c=>c.toUpperCase())+' '+D+'</b> — '+(days===0?'<b>it’s today! Happy birthday! 🎉</b>':'<b>'+days+'</b> '+(days===1?'day':'days')+' to go')+'. You are '+(days===0?age+1:age)+'.'));
  }
  const em=F.raw.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if(em&&aurHas(F,'ADD','CHANGE')&&F.persons.length&&/\b(email|mail)\b/.test(n)&&!F.cands.some(e=>e.type==='vault'&&e.score>=0.5)){
    const p=F.persons[0].obj,ex=aurA(p.fields).find(x=>/e-?mail/i.test(x.label||''));
    AUR.pending={ok:()=>{if(ex)ex.value=em[0];else p.fields.push({id:Date.now().toString(36),label:'Email',value:em[0]});aurLog(ex?'edit':'add',p.name+' · Email','👤');aurDirty();return aurSay(aurL('✓ Guardei o email de <b>','✓ Saved the email for <b>')+aurEsc(p.name)+'</b>: '+aurEsc(em[0]));}};
    return aurSay(aurL('Vou '+(ex?'atualizar':'guardar')+' o email de <b>','I’ll '+(ex?'update':'save')+' the email for <b>')+aurEsc(p.name)+'</b>: <b>'+aurEsc(em[0])+'</b>\n'+aurL('Confirmas?','Confirm?'),aurConfirmChips());
  }
  return AUR_PASS;
});

/* ── subscrições: cancelar, adicionar numa frase, a mais cara ── */
aurPre('subs.acoes',290,F=>{
  const n=F.n,S=aurA(typeof subscriptions!=='undefined'?subscriptions:[]);
  const sub=F.cands.find(e=>e.type==='sub'&&e.score>=0.5);
  if(sub&&/\b(cancela|cancelar|cancelei|anula|anular|deixei de pagar|ja nao pago|remove|tira|cancel|unsubscribe)\b/.test(n)){
    const s=sub.obj;
    AUR.pending={ok:()=>{const i=subscriptions.indexOf(s);if(i>=0)subscriptions.splice(i,1);aurLog('delete',s.name,'💸');aurDirty();return aurSay(aurL('✓ Tirei <b>','✓ Removed <b>')+aurEsc(s.name)+aurL('</b> das subscrições. Poupas '+aurMoney(s.cycle==='yearly'?s.amount:s.amount*12)+' por ano. 🎉','</b> from subscriptions. You save '+aurMoney(s.cycle==='yearly'?s.amount:s.amount*12)+' a year. 🎉'));}};
    return aurSay(aurL('Tiro <b>','Remove <b>')+aurEsc(s.name)+aurL('</b> das tuas subscrições? <span class="a-dim">(Lembra-te de cancelar também no site ou na app deles — eu só a tiro daqui.)</span>','</b> from your subscriptions? <span class="a-dim">(Remember to cancel it on their site/app too — I only remove it here.)</span>'),aurConfirmChips());
  }
  if(/\b(mais cara|mais caras|mais caro|pago mais|gasto mais|most expensive|costs the most)\b/.test(n)&&(aurHas(F,'D_SUBS')||/\bsubscri/.test(n))&&S.length){
    const m=s=>s.cycle==='yearly'?s.amount/12:s.cycle==='weekly'?s.amount*52/12:+s.amount||0;
    const top=S.slice().sort((a,b)=>m(b)-m(a))[0];
    return aurSay(aurL('💸 A mais cara é <b>','💸 The most expensive is <b>')+aurEsc(top.name)+'</b>: '+aurMoney(top.amount)+(top.cycle==='yearly'?aurL('/ano (≈ ','/year (≈ ')+aurMoney(m(top))+aurL('/mês)','/month)'):aurL('/mês','/month'))+'.',[{label:aurL('Ver todas','See all'),fn:()=>aurQuick(aurL('quais as minhas subscrições','my subscriptions'))}]);
  }
  const addM=/\b(adiciona|adicionar|acrescenta|regista|nova|novo|cria|add|new)\b/.test(n)&&/\b(subscricao|subscricoes|assinatura|subscription)\b/.test(n);
  const val=F.raw.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?)?/i);
  if(addM&&val){
    const amount=parseFloat(val[1].replace(',','.'));
    const cycle=/\b(por ano|anual|ao ano|a year|per year|yearly|annual)\b/.test(n)?'yearly':'monthly';
    let name=F.raw.replace(/^.*?\b(?:subscri[cç][aã]o|assinatura|subscription)\b\s*(?:d[aoe]s?\s+|of\s+|for\s+)?/i,'').replace(/\s*(?:por|a|de|for|at|with)?\s*\d+(?:[.,]\d{1,2})?\s*(?:€|eur|euros?)?.*$/i,'').trim();
    name=name.replace(/^(?:o|a|the)\s+/i,'');name=(name.length<=4?name.toUpperCase():aurCap(name))||'Subscrição';
    const t=new Date(),o={id:Date.now().toString(36),name,amount,cycle,color:'#5b8def',renewDay:cycle==='monthly'?String(t.getDate()):null,renewDate:cycle==='yearly'?t.toISOString().slice(0,10):null};
    AUR.pending={ok:()=>{subscriptions.push(o);aurLog('add',name,'💸');aurDirty();return aurSay(aurL('✓ Subscrição <b>','✓ Subscription <b>')+aurEsc(name)+'</b> '+aurL('adicionada','added')+': '+aurMoney(amount)+(cycle==='yearly'?aurL('/ano','/year'):aurL('/mês','/month'))+'.');}};
    return aurSay(aurL('Vou adicionar a subscrição <b>','I’ll add the subscription <b>')+aurEsc(name)+'</b>: '+aurMoney(amount)+(cycle==='yearly'?aurL(' por ano',' a year'):aurL(' por mês',' a month'))+aurL(', a renovar a partir de hoje. Confirmas?',', renewing from today. Confirm?'),aurConfirmChips());
  }
  return AUR_PASS;
});

/* ── bens: garantia (onde/quando/quanto), chave da licença, aniversários, abastecimento ── */
aurPre('bens.detalhes',300,F=>{
  const n=F.n,A=aurA(typeof assets!=='undefined'?assets:[]);
  const a=(F.cands.find(e=>e.type==='asset'&&e.score>=0.5)||{}).obj;
  if(a&&a.kind==='warranty'){
    if(/\b(onde|loja|where|store)\b/.test(n))return aurSay('🧾 <b>'+aurEsc(a.name)+'</b>'+(a.store?aurL(': comprada na <b>',': bought at <b>')+aurEsc(a.store)+'</b>':aurL(': não tenho a loja registada',': no store saved'))+(a.buyDate?aurL(' a ',' on ')+aurDateTxt(a.buyDate):'')+(a.price?' · '+aurMoney(a.price):'')+'.');
    if(/\b(quanto (custou|paguei|foi)|preco|how much)\b/.test(n))return aurSay('🧾 <b>'+aurEsc(a.name)+'</b>: '+(a.price?aurMoney(a.price):aurL('sem preço registado','no price saved'))+(a.store?' ('+aurEsc(a.store)+')':'')+'.');
    if(/\b(quando comprei|data de compra|when did i buy)\b/.test(n))return aurSay('🧾 <b>'+aurEsc(a.name)+'</b>: '+(a.buyDate?aurL('comprada a ','bought on ')+aurDateTxt(a.buyDate):aurL('sem data de compra','no purchase date'))+'.');
  }
  if(a&&a.kind==='license'&&/\b(chave|key|codigo|serial|licenca|product key|numero)\b/.test(n)&&!aurHas(F,'CHANGE','DELETE')){
    const key=a.key||a.serial||a.code||'';
    if(!key)return aurSay(aurL('A licença <b>'+aurEsc(a.name)+'</b> não tem chave guardada.','The <b>'+aurEsc(a.name)+'</b> licence has no key saved.'));
    return aurSay('🔑 '+aurL('Chave de <b>','Key for <b>')+aurEsc(a.name)+'</b>: <code>'+aurEsc(key)+'</code>',[{label:aurL('Copiar chave','Copy key'),fn:()=>aurCopy(key,aurL('Chave copiada','Key copied'))}]);
  }
  if(a&&a.kind==='dates'&&(aurHas(F,'WHEN')||/\b(que dia|qual a data|when)\b/.test(n))&&!aurHas(F,'SCHEDULE','CHANGE')){
    const d=a.date?new Date(a.date+'T00:00:00'):null;if(!d||isNaN(d))return AUR_PASS;
    let next=d;if(a.yearly){const t=aurToday();next=new Date(t.getFullYear(),d.getMonth(),d.getDate());if(next<t)next=new Date(t.getFullYear()+1,d.getMonth(),d.getDate());}
    return aurSay('📅 <b>'+aurEsc(a.name)+'</b>: '+aurDate(next)+' ('+aurRel(next)+')'+(a.yearly?aurL(' · todos os anos',' · every year'):'')+'.');
  }
  if(/\b(abastec\w*|atestei|meti gasolina|meti gasoleo|pus gasolina|refuel\w*|combustivel)\b/.test(n)&&aurHas(F,'ADD')){
    const V=A.filter(x=>x.kind==='vehicle');const v=(a&&a.kind==='vehicle')?a:V.length===1?V[0]:null;
    if(!v||typeof openFuelModal!=='function')return AUR_PASS;
    aurClose();openFuelModal(v.id);
    const eur=F.raw.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?)/i),lit=F.raw.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:l|litros|liters|litres)\b/i);
    setTimeout(()=>{const e=document.getElementById('fuel-euros'),l=document.getElementById('fuel-liters');if(eur&&e)e.value=eur[1].replace(',','.');if(lit&&l)l.value=lit[1].replace(',','.');},50);
    return aurSay(aurL('⛽ Abri o registo de abastecimento do <b>','⛽ Opened the refuelling log for <b>')+aurEsc(v.name)+'</b>'+(eur?aurL(' com '+eur[1]+' €',' with €'+eur[1]):'')+aurL(' — confirma os litros e os km.',' — check litres and km.'));
  }
  return AUR_PASS;
});

/* ── mais formas de dizer ── */
AUR_PHR.push(
  [/\bpim\b/g,' pin '],
  [/\bq\b/g,' que '],
  [/^\s*n\s+(?=me|sei|tenho|consigo|encontro|lembro|percebo)/,' nao '],
  [/\b(nao|n)\s+me\s+lembro(\s+d[aoe]s?)?\b|\bja\s+nao\s+sei(\s+qual\s+e)?\b|\besqueci(\s+d[aoe]s?)?\b/g,' '],
  [/^\s*(bora|vamos|anda|olha|ora|pronto|epa|opa|entao|ei|hey)\s+(?=\S)/,' '],
  [/\b(esta|estao|is|are)\s+em\s+dia\b|\bup\s+to\s+date\b/g,' valido '],
  [/^\s*(ajuda|ajudas|podes\s+ajudar|consegues\s+ajudar|help)(\s+me)?\s+(a|to)\s+(?=\S+\s+\S)/,' ']
);
Object.assign(AUR_ALIAS,{passaporte:['passport'],escritura:['deed'],fatura:['bill','invoice'],garantia:['warranty']});
aurV('CHANGE','renomeia renomear');

// «tudo sobre o carro», «tudo o que tenho do golf»
aurPre('tudo.sobre',310,F=>{
  const n=F.n;
  if(!/\b(tudo|everything|all)\b.*\b(sobre|relacionad\w*|ligad\w*|do|da|de|about|on|for|related)\b/.test(n)||aurHas(F,'DELETE','ARCHIVE','EXPORT','COPY','RESTORE','EMPTY'))return AUR_PASS;
  const generic=/^(tudo|mostra|mostrar|tenho|sobre|relacionado|relacionada|ligado|ligada|everything|all|about|related|show|have|que|o|a)$/;
  let terms=F.Q.filter(t=>t.length>=3&&!generic.test(t));
  const car=aurHas(F,'D_VEHICLE');
  const V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle');
  if(car)V.forEach(v=>{terms.push(aurNorm(v.name));if(v.plate)terms.push(aurNorm(v.plate));});
  F.cands.filter(e=>e.score>=0.5&&e.type==='asset'&&e.obj.kind==='vehicle').forEach(e=>{if(e.obj.plate)terms.push(aurNorm(e.obj.plate));});
  terms=[...new Set(terms.filter(t=>!(AUR_VOCAB[t]||[]).some(x=>AUR_ACTIONS.has(x))))];
  if(!terms.length)return AUR_PASS;
  const hit=h=>terms.some(t=>aurNorm(h).includes(t));
  const out=[],seen=new Set();
  const push=(e,why)=>{if(seen.has(e.obj))return;seen.add(e.obj);out.push({e,why});};
  aurIndex().forEach(e=>{if(e.type==='theme')return;if(hit(e.name)||(e.extra&&hit(e.extra)))push(e);});
  if(car)V.forEach(v=>push({type:'asset',obj:v,name:v.name}));
  const folders=aurA(typeof docFolders!=='undefined'?docFolders:[]);
  aurA(typeof documents!=='undefined'?documents:[]).forEach(d=>{
    const fo=folders.find(f=>f.id===d.folderId);
    if(hit(aurDocText(d))||hit([d.title,d.desc,d.facts&&d.facts.entity,d.facts&&d.facts.plate,fo&&fo.name,car&&d.cat==='carro'?'carro':''].filter(Boolean).join(' ')))push({type:'doc',obj:d,name:d.title||d.name});});
  if(!out.length)return aurSay(aurL('Não encontrei nada sobre «','I found nothing about «')+aurEsc(terms.join(' '))+'».');
  const L=out.slice(0,12);
  return aurSay(aurL('🔎 Tudo o que tens sobre <b>','🔎 Everything about <b>')+aurEsc(terms[0])+'</b> ('+out.length+'):\n'+L.map(x=>'• '+aurEsc(aurEntLabel(x.e))).join('\n'),L.map(x=>({label:x.e.name,fn:()=>aurOpenEnt(x.e,F,true)})));
});

// favoritos, duplicar, mover para pasta
aurPre('conta.favDupPasta',320,F=>{
  const n=F.n;
  const v=(F.cands.find(e=>e.type==='vault'&&e.score>=0.5)||{}).obj;
  if(!v)return AUR_PASS;
  if(/\b(favorit\w*|estrela|estrelas|favourit\w*|favorite\w*|star|pin to top)\b/.test(n)&&/\b(poe|por|mete|meter|marca|marcar|adiciona|adicionar|coloca|colocar|tira|tirar|remove|remover|retira|desmarca|add|mark|make|set|unfav\w*|unstar)\b/.test(n)){
    const off=/\b(tira|tirar|remove|remover|retira|desmarca|unfav\w*|unstar|sai)\b/.test(n);
    v.fav=!off;aurLog('edit',v.name,'⭐');aurDirty();
    return aurSay(off?aurL('☆ Tirei <b>'+aurEsc(v.name)+'</b> dos favoritos.','☆ Removed <b>'+aurEsc(v.name)+'</b> from favourites.'):aurL('⭐ <b>'+aurEsc(v.name)+'</b> está nos favoritos — aparece no topo e no Dashboard.','⭐ <b>'+aurEsc(v.name)+'</b> is now a favourite — it shows at the top and on the Dashboard.'));
  }
  if(/\b(duplica|duplicar|copia a entrada|clona|clonar|duplicate|clone)\b/.test(n)){
    const c=JSON.parse(JSON.stringify(v));c.id=Date.now().toString(36);c.name=v.name+aurL(' (cópia)',' (copy)');c.createdAt=Date.now();c.fav=false;
    vault.push(c);aurLog('add',c.name,'📋');aurDirty();AUR.last={type:'vault',obj:c,name:c.name};
    return aurSay(aurL('📋 Criei <b>','📋 Created <b>')+aurEsc(c.name)+'</b>.',[{label:aurL('Mudar o nome','Rename'),fn:()=>aurSay(aurL('Diz-me: «renomeia '+c.name+' para …»','Say: “rename '+c.name+' to …”'))}]);
  }
  const mv=F.raw.match(/\b(?:move|mover|mete|meter|poe|põe|coloca|colocar|guarda|arruma|passa|move|put)\b.*?\b(?:para a pasta|na pasta|pasta|para|to (?:the )?folder|into)\s+(.+?)[.!?]*$/i);
  if(mv&&/\b(pasta|pastas|folder)\b/.test(n)){
    const name=mv[1].replace(/^(?:a|o|the)\s+/i,'').replace(/^(?:pasta|folder)\s+/i,'').trim();if(!name)return AUR_PASS;
    let f=aurA(typeof vaultFolders!=='undefined'?vaultFolders:[]).find(x=>aurNorm(x.name)===aurNorm(name));
    const go=()=>{if(!f){f={id:'f'+Date.now().toString(36),name:aurCap(name),icon:'📁',parentId:null};vaultFolders.push(f);}v.folderId=f.id;aurLog('edit',v.name,'📁');aurDirty();return aurSay(aurL('📁 <b>'+aurEsc(v.name)+'</b> está agora na pasta <b>'+aurEsc(f.name)+'</b>.','📁 <b>'+aurEsc(v.name)+'</b> is now in the <b>'+aurEsc(f.name)+'</b> folder.'));};
    if(f)return go();
    AUR.pending={ok:go};
    return aurSay(aurL('A pasta <b>'+aurEsc(aurCap(name))+'</b> ainda não existe. Crio-a e ponho lá <b>'+aurEsc(v.name)+'</b>?','There’s no <b>'+aurEsc(aurCap(name))+'</b> folder yet. Create it and move <b>'+aurEsc(v.name)+'</b> there?'),aurConfirmChips());
  }
  // «a netflix cobra quanto?» quando a Netflix não está nas subscrições
  if(/\b(cobra|cobram|custa|custam|pago|pagas|charge|charges|cost|costs)\b/.test(n)&&(aurHas(F,'HOWMUCH','D_MONEY')||/\bquanto\b/.test(n))&&!F.cands.some(e=>e.type==='sub'&&e.score>=0.5)&&F.cands.some(e=>e.obj===v&&e.toks.some(t=>F.Qset.has(t))))
    return aurSay(aurL('<b>'+aurEsc(v.name)+'</b> não está nas tuas subscrições, por isso não sei quanto pagas.','<b>'+aurEsc(v.name)+'</b> isn’t in your subscriptions, so I don’t know what you pay.'),[{label:aurL('Adicionar subscrição','Add subscription'),fn:()=>aurSay(aurL('Diz-me: «adiciona a subscrição '+v.name+' por 9,99 por mês»','Say: “add subscription '+v.name+' for 9.99 a month”'))}]);
  return AUR_PASS;
});

// «abre a aba das garantias», «vai ao separador dos cartões»
aurPre('abas',330,F=>{
  if(!/\b(aba|abas|separador|seccao|pagina|ecra|tab|section|page|screen)\b/.test(F.n)||aurHas(F,'ADD','DELETE'))return AUR_PASS;
  const tab=aurDomainTab(F.c);
  return tab?aurGoTab(tab):AUR_PASS;
});

// histórico: «o que mudei hoje», «qual foi a última password que mudei»
aurPre('historico',340,F=>{
  const n=F.n;
  if(/\b(ultima|ultimas|last)\b.*\bpassword\b.*\b(mudei|mudaste|alterei|trocei|troquei|changed|updated)\b|\bpassword\b.*\b(mudada|alterada|changed)\b.*\b(recente|ultima|last)\b/.test(n)){
    const V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>v.pwUpdated).sort((a,b)=>b.pwUpdated-a.pwUpdated);
    if(!V.length)return aurSay(aurL('Ainda não mudaste nenhuma password por aqui.','You haven’t changed any password here yet.'));
    return aurSay(aurL('🔑 A última password que mudaste foi a de <b>','🔑 The last password you changed was <b>')+aurEsc(V[0].name)+'</b> ('+(typeof timeAgo==='function'?timeAgo(V[0].pwUpdated):aurDate(V[0].pwUpdated))+').'+(V.length>1?'\n'+V.slice(1,5).map(v=>'• '+aurEsc(v.name)+' — '+(typeof timeAgo==='function'?timeAgo(v.pwUpdated):aurDate(v.pwUpdated))).join('\n'):''));
  }
  if(/\b(o que (mudei|alterei|fiz|adicionei|apaguei)|historico|atividade|atividades|ultimas alteracoes|alteracoes recentes|what did i (change|do)|recent (changes|activity)|activity|history)\b/.test(n)&&!F.cands.some(e=>e.score>=0.5)){
    const L=aurA(typeof activityLog!=='undefined'?activityLog:[]);
    const today=/\b(hoje|today)\b/.test(n),t0=aurToday().getTime();
    const R=(today?L.filter(a=>a.ts>=t0):L).slice(0,10);
    if(!R.length)return aurSay(today?aurL('Hoje ainda não mudaste nada.','You haven’t changed anything today.'):aurL('Ainda não há atividade registada.','No activity yet.'));
    const verb={add:aurL('adicionaste','added'),edit:aurL('editaste','edited'),delete:aurL('apagaste','deleted'),archive:aurL('arquivaste','archived'),restore:aurL('recuperaste','restored')};
    return aurSay('🕘 '+(today?aurL('Hoje:','Today:'):aurL('Últimas alterações:','Recent changes:'))+'\n'+R.map(a=>'• '+aurEsc(a.icon||'📝')+' '+aurEsc(verb[a.action]||a.action)+' <b>'+aurEsc(a.name)+'</b> <span class="a-dim">'+(typeof timeAgo==='function'?timeAgo(a.ts):'')+'</span>').join('\n'));
  }
  return AUR_PASS;
});

// «quanto gastei da última vez» (combustível)
aurPre('combustivel.ultimo',350,F=>{
  if(!aurHas(F,'D_FUEL')||!/\b(ultima vez|ultimo abastecimento|ultima|last time|last refuel)\b/.test(F.n))return AUR_PASS;
  const V=aurA(typeof assets!=='undefined'?assets:[]).filter(a=>a.kind==='vehicle'&&aurA(a.fuel).length);
  if(!V.length)return AUR_PASS;
  const rows=[];V.forEach(v=>aurA(v.fuel).forEach(f=>rows.push({v,f})));
  rows.sort((a,b)=>String(b.f.date).localeCompare(String(a.f.date)));
  const {v,f}=rows[0];
  return aurSay('⛽ '+aurL('Último abastecimento do <b>','Last refuel for <b>')+aurEsc(v.name)+'</b>: <b>'+aurMoney(f.euros)+'</b>'+(f.liters?' · '+f.liters+' L':'')+(f.liters&&f.euros?' ('+aurMoney(f.euros/f.liters)+'/L)':'')+' · '+aurDateTxt(f.date)+' ('+aurRel(new Date(f.date))+').');
});

/* ── 4.ª ronda: arquivo, bloqueio, notas, contas, sites, 2FA, Wi-Fi ── */
AUR_PHR.push(
  [/\b(?:tira|tirar|retira|sai)\s+(?:o |a |os |as )?(.+?)\s+do\s+arquivo\b/g,' desarquiva $1 '],
  [/\b(?:tira|tirar|retira)\s+(?:o |a |os |as )?(.+?)\s+da\s+(?:reciclagem|lixeira|lixo)\b/g,' recupera $1 '],
  [/\bbloqueio\s+automatico\b|\bbloqueio\s+auto\b/g,' autobloqueio ']
);
const aurVEnt2=v=>({type:'vault',obj:v,name:v.name,toks:aurSig(aurCanon(v.name||''))});
aurPre('diversos',360,F=>{
  const n=F.n,V=aurA(typeof vault!=='undefined'?vault:[]).filter(v=>!v.archived);
  const ent=F.cands.find(e=>e.score>=0.5);
  const v=(F.cands.find(e=>e.type==='vault'&&e.score>=0.5)||{}).obj;
  // «bloqueia depois de 5 minutos» é o auto-bloqueio (não bloquear já)
  if(/\b(bloqueia|bloquear|bloqueie|tranca|lock)\b.*\b(depois de|apos|ao fim de|passados|after|em)\s+\d+\s*(s|seg|segundos|min|mins|minutos|h|horas|seconds|minutes|hours)\b/.test(n)||aurHas(F,'D_AUTOLOCK')||/\bautobloqueio\b/.test(n))
    return aurSettings('seguranca',aurL('⏱️ O tempo do bloqueio automático escolhe-se em <b>Definições → Segurança</b> — por segurança não o mudo pela conversa. Abri-te lá.','⏱️ Set the auto-lock time in <b>Settings → Security</b> — for safety I don’t change it through chat. I opened it for you.'));
  // versão
  if(/\b(versao|version)\b/.test(n)&&/\b(app|aplicacao|aurora|cofre|vault|qual|what)\b/.test(n)&&!ent)
    return aurSay(aurL('ℹ️ Aurora Vault <b>v','ℹ️ Aurora Vault <b>v')+aurEsc(typeof APP_VERSION!=='undefined'?APP_VERSION:'?')+'</b>.');
  // «restaura tudo da reciclagem»
  if(aurHas(F,'RESTORE')&&/\b(tudo|todos|todas|everything|all)\b/.test(n)&&/\b(reciclagem|lixo|lixeira|trash|bin)\b/.test(n)){
    const T=aurA(typeof trash!=='undefined'?trash:[]);
    if(!T.length)return aurSay(aurL('A reciclagem está vazia ✓','The trash is empty ✓'));
    AUR.pending={ok:()=>{let k=0;const total=T.length;while(trash.length&&k++<total)restoreTrashItem(trash.length-1);return aurSay(aurL('♻️ Recuperei '+total+(total===1?' item':' itens')+'.','♻️ Restored '+total+(total===1?' item':' items')+'.'));}};
    return aurSay(aurL('Recupero os <b>'+T.length+'</b> itens da reciclagem?','Restore all <b>'+T.length+'</b> items from the trash?'),aurConfirmChips());
  }
  // notas: ler e acrescentar
  const note=(F.cands.find(e=>e.type==='note'&&e.score>=0.5)||{}).obj;
  if(note){
    const add=F.raw.match(/^(?:acrescenta|acrescentar|adiciona|adicionar|junta|juntar|poe|põe|mete|escreve|add|append)\b.*?\bnota\b[^:–-]*[:–-]\s*(.+)$/i);
    if(add){note.body=(note.body?note.body.replace(/\s+$/,'')+'\n':'')+add[1].trim();note.updatedAt=Date.now();aurLog('edit',note.title,'📝');aurDirty();
      return aurSay(aurL('📝 Acrescentei à nota <b>','📝 Added to the note <b>')+aurEsc(note.title)+'</b>: '+aurEsc(add[1].trim()),[{label:aurL('Abrir nota','Open note'),fn:()=>aurOpenEnt({type:'note',obj:note,name:note.title},F,true)}]);}
    if(/\b(le|ler|le me|diz|dizer|conteudo|texto|o que diz|o que tem|read|what does|says|content)\b/.test(n)&&!aurHas(F,'CHANGE','DELETE','ARCHIVE')){
      const b=String(note.body||'').trim();
      return aurSay('📝 <b>'+aurEsc(note.title)+'</b>\n'+(b?aurEsc(b.length>700?b.slice(0,700)+'…':b):aurL('<span class="a-dim">(nota vazia)</span>','<span class="a-dim">(empty note)</span>')),[{label:aurL('Abrir nota','Open note'),fn:()=>aurOpenEnt({type:'note',obj:note,name:note.title},F,true)},b?{label:aurL('Copiar texto','Copy text'),fn:()=>aurCopy(b,aurL('Texto copiado','Text copied'))}:null]);
    }
  }
  // 2FA: «quanto tempo falta para o código mudar»
  const tt=(F.cands.find(e=>e.type==='totp'&&e.score>=0.5)||{}).obj;
  if(tt&&/\b(quanto tempo|falta|faltam|segundos|valido|how long|expires?)\b/.test(n)&&typeof aurShowCode==='function'&&!aurTotpLocked())return aurShowCode(tt);
  // Wi-Fi: nome da rede
  const w=(F.cands.find(e=>e.type==='wifi'&&e.score>=0.5)||{}).obj;
  if(w&&/\b(nome|ssid|name|chama)\b/.test(n)&&!aurHas(F,'CHANGE'))return aurSay('📶 '+aurL('A rede <b>','The <b>')+aurEsc(w.name)+aurL('</b> chama-se <b>','</b> network is called <b>')+aurEsc(w.ssid||w.name)+'</b>.',[{label:aurL('Copiar nome','Copy name'),fn:()=>aurCopy(w.ssid||w.name)}]);
  // favoritos: «mostra os favoritos», «o gmail é favorito?»
  if(/\bfavorit\w*|favourit\w*|favorite\w*\b/.test(n)){
    if(v&&/\b(e|esta|is)\b/.test(n)&&!/\b(poe|por|mete|marca|adiciona|coloca|tira|remove|retira|desmarca|add|mark|make|set)\b/.test(n))
      return aurSay(v.fav?aurL('⭐ Sim, <b>'+aurEsc(v.name)+'</b> está nos favoritos.','⭐ Yes, <b>'+aurEsc(v.name)+'</b> is a favourite.'):aurL('Não, <b>'+aurEsc(v.name)+'</b> não está nos favoritos.','No, <b>'+aurEsc(v.name)+'</b> isn’t a favourite.'),v.fav?[]:[{label:aurL('Pôr nos favoritos','Make favourite'),fn:()=>{v.fav=true;aurDirty();return aurSay('⭐ '+aurEsc(v.name));}}]);
    if(!v&&/^(mostra|quais|que|lista|os meus|as minhas|abre|show|list|my|which)\b/.test(n)){
      const L=V.filter(x=>x.fav);
      if(!L.length)return aurSay(aurL('Ainda não tens favoritos. Diz «põe o gmail nos favoritos».','No favourites yet. Say “make gmail a favourite”.'));
      return aurSay('⭐ '+aurL('Favoritos','Favourites')+' ('+L.length+'):',L.slice(0,10).map(x=>({label:x.name,fn:()=>aurOpenEnt(aurVEnt2(x),F,false)})));
    }
  }
  // quando foi criada / há quanto tempo
  if(v&&/\b(quando (criei|adicionei|guardei|registei|abri)|desde quando|ha quanto tempo|quanto tempo tenho|when did i (create|add|save)|how long)\b/.test(n)){
    const at=v.createdAt||v.created;
    return aurSay(at?'🔑 <b>'+aurEsc(v.name)+'</b> '+aurL('está no cofre desde ','has been in your vault since ')+aurDate(at)+' ('+aurRel(at)+')'+'.'+(v.pwUpdated?aurL('\nPassword mudada pela última vez: ','\nPassword last changed: ')+aurDate(v.pwUpdated)+'.':''):aurL('Não sei quando <b>'+aurEsc(v.name)+'</b> foi criada — é anterior ao registo de datas.','I don’t know when <b>'+aurEsc(v.name)+'</b> was created — it predates date tracking.'));
  }
  // site de uma conta
  if(v&&/\b(site|sites|url|link|endereco|pagina|website|web)\b/.test(n)&&!/\b(mesma|mesmas|iguais|same|usam|usa|use|uses)\b/.test(n)&&!aurHas(F,'CHANGE','DELETE')){
    if(!v.url)return aurSay(aurL('<b>'+aurEsc(v.name)+'</b> não tem site guardado.','<b>'+aurEsc(v.name)+'</b> has no website saved.'));
    const u=String(v.url);
    if(aurHas(F,'OPEN')&&typeof avGoSite==='function'){avGoSite(v.id);return aurSay(aurL('🌐 A abrir <b>','🌐 Opening <b>')+aurEsc(u)+'</b>…');}
    return aurSay('🌐 <b>'+aurEsc(v.name)+'</b>: '+aurEsc(u),[typeof avGoSite==='function'?{label:aurL('Abrir site','Open site'),fn:()=>avGoSite(v.id)}:null,{label:aurL('Copiar','Copy'),fn:()=>aurCopy(u)}]);
  }
  if(!v&&/\b(sites|websites)\b/.test(n)&&!/\b(mesma|mesmas|iguais|same|usam|use)\b/.test(n)&&/\b(que|quais|tenho|mostra|lista|which|what|my|list)\b/.test(n)){
    const L=V.filter(x=>x.url);
    return aurSay('🌐 '+aurL('Sites guardados','Saved sites')+' ('+L.length+'):\n'+L.slice(0,15).map(x=>'• <b>'+aurEsc(x.name)+'</b> — '+aurEsc(x.url)).join('\n'));
  }
  // «quantas contas de banco tenho», «qual a conta mais recente»
  if(aurHas(F,'COUNT')&&!v&&!aurHas(F,'D_WIFI')&&/\b(conta|contas|acesso|acessos|password|passwords|login|logins|account|accounts)\b/.test(n)){
    const key=typeof aurCatOf==='function'?aurCatOf(n):null;
    if(key){const L=V.filter(x=>x.cat===key);return aurSay(aurL('Tens <b>'+L.length+'</b> '+(L.length===1?'conta':'contas')+' nessa categoria'+(L.length?': ':'.'),'You have <b>'+L.length+'</b> '+(L.length===1?'account':'accounts')+' in that category'+(L.length?': ':'.'))+L.map(x=>aurEsc(x.name)).join(', '));}
  }
  if(/\b(mais recente|mais nova|ultima conta(?! d[aeo]\b)|ultima entrada|ultima que (criei|adicionei)|newest|most recent|latest)\b/.test(n)&&/\b(conta|entrada|acesso|password|account|entry)\b/.test(n)){
    const L=V.filter(x=>x.createdAt).sort((a,b)=>b.createdAt-a.createdAt);
    if(!L.length)return aurSay(aurL('Não tenho datas de criação guardadas.','I have no creation dates.'));
    return aurSay(aurL('🆕 A conta mais recente é <b>','🆕 The newest account is <b>')+aurEsc(L[0].name)+'</b> ('+aurDate(L[0].createdAt)+').',[{label:L[0].name,fn:()=>aurOpenEnt(aurVEnt2(L[0]),F,false)}]);
  }
  return AUR_PASS;
});
