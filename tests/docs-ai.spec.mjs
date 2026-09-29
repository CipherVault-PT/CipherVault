import { test, expect, openApp, createVault } from './fixtures.mjs';

// A Aurora lê os documentos (PDF e fotos, no dispositivo), guarda o texto encriptado no cofre e responde sobre eles.
// PDF mínimo com várias linhas (texto ASCII, como num PDF real sem acentos embutidos)
const PDF = lines => {
  const esc = s => s.replace(/[\\()]/g, m => '\\' + m);
  const stream = 'BT /F1 11 Tf 40 800 Td ' + lines.map((l, i) => (i ? '0 -16 Td ' : '') + '(' + esc(l) + ') Tj').join(' ') + ' ET';
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return pdf;
};
const EDP = ['EDP Comercial - Fatura de Eletricidade', 'Fatura n. FT 2026/118832', 'Data de emissao: 03/09/2026', 'Data limite de pagamento: 20/09/2026',
  'NIF: 123456789', 'Periodo de fidelizacao de 24 meses', 'Subtotal 36,75 EUR', 'Total a pagar: 45,20 EUR', 'IBAN PT50 0002 0123 1234 5678 9015 4'];
const EDP2 = ['EDP Comercial - Fatura de Eletricidade', 'Data de emissao: 03/08/2026', 'Total a pagar: 52,10 EUR'];
const SEGURO = ['Fidelidade - Seguro Automovel', 'Apolice n. AU-55667788', 'Matricula: 12-AB-34', 'Periodo: de 01/10/2026 a 30/09/2027', 'Premio anual 312,40 EUR'];
const RECIBO = ['Recibo de Vencimento', 'Empresa XPTO Lda', 'Periodo: de 01/09/2026 a 30/09/2026', 'Vencimento base 1.500,00', 'Total iliquido 1.500,00',
  'Seguro de Acidentes de Trabalho: Fidelidade Apolice n. AT-99887766', 'Seguranca Social 165,00', 'IRS 180,00', 'Liquido a receber 1.155,00'];
const CONTRATO = ['Contrato de Prestacao de Servicos de Internet e Televisao', 'MEO - Servicos de Comunicacoes e Multimedia', 'Data de inicio: 01/10/2026',
  'Periodo de fidelizacao de 24 meses, ate 30/09/2028.', 'Mensalidade de 39,99 EUR com IVA incluido.',
  'Em caso de rescisao antecipada aplica-se uma penalizacao de 150,00 EUR.', 'O contrato renova automaticamente por periodos de 12 meses.',
  'A denuncia deve ser comunicada com pre-aviso de 30 dias.', 'O cliente pode pedir a portabilidade do numero de telefone.',
  'A assistencia tecnica esta disponivel 24 horas por dia, todos os dias.', 'O servico de internet inclui velocidade de 1 Gbps.'];
const WORTEN = ['Worten - Fatura Recibo', 'Televisor Samsung 55', 'Data da fatura: 15/06/2026', 'Total a pagar: 599,99 EUR'];

test.describe('Aurora lê documentos', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => {
      assets.push({ id: 'v', kind: 'vehicle', name: 'Golf', plate: '12-AB-34', fuel: [] });
      personalInfo.push({ id: 'p', name: 'Eu', fields: [{ id: 'f', label: 'IBAN', value: 'PT50 0002 0123 1234 5678 9015 4' }, { id: 'n', label: 'NIF', value: '123456789' }] });
      renderAll(); auroraOpen();
    });
  });

  // carregar pela Aurora e guardar em Documentos
  const upload = (page, name, pdfText) => page.evaluate(async ([name, pdf]) => {
    const f = new File([Uint8Array.from(pdf, c => c.charCodeAt(0))], name, { type: 'application/pdf' });
    await avFilesReceive([f]);
    avFilePlan({ dest: { type: 'doc', path: [] } }); avFileSave();
    await new Promise(r => setTimeout(r, 300));
    return documents.find(d => d.file && d.file.name === name);
  }, [name, pdfText]);
  const ask = (page, q) => page.evaluate(async q => {
    const box = document.getElementById('aurora-msgs'), before = box.children.length;
    AUR.pending = null; aurQuick(q); await new Promise(r => setTimeout(r, 60));
    return [...box.children].slice(before + 1).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ ');
  }, q);

  test('fatura em PDF: guarda o texto e os dados, e responde sobre ela', async ({ page }) => {
    const d = await upload(page, 'fatura-edp.pdf', PDF(EDP));
    expect(d.text).toContain('Total a pagar');
    expect(d.facts).toMatchObject({ kind: 'fatura', entity: 'EDP', total: 45.2, issueDate: '2026-09-03', dueDate: '2026-09-20', nifs: ['123456789'], ibans: ['PT50000201231234567890154'] });
    expect(await page.locator('#aurora-msgs').innerText()).toMatch(/Li [\s\S]*EDP[\s\S]*45,20/);
    await upload(page, 'fatura-edp-agosto.pdf', PDF(EDP2));
    expect(await ask(page, 'quanto paguei na última fatura da edp')).toMatch(/45,20/);
    expect(await ask(page, 'quando vence a fatura da edp')).toMatch(/20\/09\/2026/);
    expect(await ask(page, 'quanto paguei de luz à edp em agosto')).toMatch(/52,10/);
    expect(await ask(page, 'e em setembro?')).toMatch(/45,20/);
    expect(await ask(page, 'procura "fidelizacao" nos documentos')).toMatch(/fatura-edp[\s\S]*fidelizacao de 24 meses/i);
    expect(await ask(page, 'em que documentos aparece o meu IBAN')).toMatch(/1 documento[\s\S]*fatura-edp/);
    expect(await ask(page, 'documentos sobre fidelizacao')).toMatch(/fatura-edp/);
  });

  test('o texto fica encriptado no cofre (não aparece em claro no ficheiro gravado)', async ({ page }) => {
    await upload(page, 'fatura-edp.pdf', PDF(EDP));
    const r = await page.evaluate(async () => {
      await saveFile({ auto: true });
      const json = pendingVaultText; const dec = await decrypt(masterKey, JSON.parse(json).payload);
      return { plain: json.includes('fidelizacao'), inside: JSON.stringify(dec).includes('fidelizacao') };
    });
    expect(r).toEqual({ plain: false, inside: true });
  });

  test('apólice: nº, matrícula e prazo → propõe o seguro no carro certo', async ({ page }) => {
    const d = await upload(page, 'apolice-auto.pdf', PDF(SEGURO));
    expect(d.facts).toMatchObject({ kind: 'seguro', entity: 'Fidelidade', policy: 'AU-55667788', plate: '12-AB-34', startDate: '2026-10-01', endDate: '2027-09-30' });
    await page.locator('#aurora-msgs .a-btn', { hasText: 'Seguro do Golf' }).click();
    expect(await page.evaluate(() => assets.find(a => a.id === 'v').insurance)).toBe('2027-09-30');
    expect(await ask(page, 'qual o número da apólice do seguro do carro')).toMatch(/AU-55667788/);
  });

  test('recibo de vencimento: não é um seguro do carro; lê o líquido e o bruto', async ({ page }) => {
    const d = await upload(page, 'recibo-setembro.pdf', PDF(RECIBO));
    expect(d.facts).toMatchObject({ kind: 'trabalho', net: 1155, gross: 1500 });
    expect(d.facts.policy).toBeUndefined();
    const chat = await page.locator('#aurora-msgs').innerText();
    expect(chat).toMatch(/líquido[\s\S]*1\.?155,00/);
    expect(chat).not.toMatch(/Seguro do Golf/);
    expect(await ask(page, 'quanto recebi de ordenado em setembro')).toMatch(/Ordenado em setembro[\s\S]*1\.?155,00/);
    expect(await ask(page, 'qual o meu salário')).toMatch(/Último recibo[\s\S]*1\.?155,00[\s\S]*bruto/);
  });

  test('documentos lidos com a versão antiga são revistos ao abrir o cofre', async ({ page }) => {
    const r = await page.evaluate(lines => {
      documents.push({ id: 'old', title: 'Recibo antigo', cat: 'pessoal', text: lines.join('\n'), textAt: 1, facts: { kind: 'seguro', policy: 'AT-99887766', endDate: '2026-09-30' } });
      const n = avDocRefreshFacts(), d = documents.find(x => x.id === 'old');
      return { n, kind: d.facts.kind, policy: d.facts.policy, again: avDocRefreshFacts() };
    }, RECIBO);
    expect(r).toEqual({ n: 1, kind: 'trabalho', policy: undefined, again: 0 });
  });

  test('fatura de compra → cria a garantia com loja, preço e data', async ({ page }) => {
    const d = await upload(page, 'tv-worten.pdf', PDF(WORTEN));
    expect(d.facts).toMatchObject({ kind: 'fatura', entity: 'Worten', total: 599.99, issueDate: '2026-06-15' });
    await page.locator('#aurora-msgs .a-btn', { hasText: 'Criar garantia' }).click();
    const w = await page.evaluate(() => assets.find(a => a.kind === 'warranty'));
    expect(w).toMatchObject({ store: 'Worten', price: '599.99', buyDate: '2026-06-15', years: '3' });
    expect(w.attachments.length).toBe(1);
  });

  test('pesquisa geral encontra texto dentro dos documentos; «lê os meus documentos» lê os antigos', async ({ page }) => {
    await page.evaluate(pdf => {
      documents.push({ id: 'old', title: 'Contrato antigo', cat: 'outro', file: { name: 'c.pdf', type: 'application/pdf', size: 900, data: 'data:application/pdf;base64,' + btoa(pdf) }, createdAt: Date.now() });
    }, PDF(['Contrato de prestacao de servicos', 'Clausula de rescisao antecipada']));
    expect(await ask(page, 'lê os meus documentos')).toMatch(/A ler/);
    await expect.poll(() => page.evaluate(() => (documents.find(d => d.id === 'old').text || '').includes('rescisao')), { timeout: 20000 }).toBe(true);
    await expect(page.locator('#aurora-msgs')).toContainText('Li 1 documento');
    await page.evaluate(() => { auroraClose(); const si = document.getElementById('search-input'); si.value = 'rescisao'; gsRun(); });
    await expect(page.locator('#global-search-results')).toContainText('Contrato antigo');
  });

  test('foto de um talão lida por OCR (no dispositivo)', async ({ page }) => {
    test.setTimeout(180_000);
    const d = await page.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 1000; c.height = 420;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 1000, 420); g.fillStyle = '#000'; g.font = 'bold 44px Arial';
      g.fillText('FATURA RECIBO WORTEN', 40, 90); g.fillText('Data da fatura: 10/05/2026', 40, 190); g.fillText('TOTAL A PAGAR 129,90 EUR', 40, 290);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      await avFilesReceive([new File([blob], 'talao.png', { type: 'image/png' })]);
      avFilePlan({ dest: { type: 'doc', path: [] } }); avFileSave();
      await new Promise(r => setTimeout(r, 300));
      return documents.find(x => x.file && x.file.name === 'talao.png');
    });
    expect(d.textSrc).toBe('ocr');
    expect(d.facts).toMatchObject({ entity: 'Worten', total: 129.9, issueDate: '2026-05-10' });
  });

  test('«resume o contrato da meo»: datas, valores e pontos de atenção tirados do documento', async ({ page }) => {
    await upload(page, 'contrato-meo.pdf', PDF(CONTRATO));
    await upload(page, 'fatura-edp.pdf', PDF(EDP));
    const r = await ask(page, 'resume o contrato da meo');
    expect(r).toMatch(/Resumo de contrato-meo/);
    expect(r).toMatch(/Datas[\s\S]*01\/10\/2026[\s\S]*30\/09\/2028/);
    expect(r).toMatch(/Valores[\s\S]*39,99[\s\S]*150,00/);
    expect(r).toMatch(/Pontos de atenção[\s\S]*(renova automaticamente|pre-aviso de 30 dias)/);
    expect(r).toMatch(/O essencial/);
    expect(r).not.toMatch(/EDP/);
    // «resume-o» depois de falar dele, e um documento ainda por ler
    expect(await ask(page, 'quais são os pontos importantes do contrato')).toMatch(/Resumo de contrato-meo/);
    const r2 = await page.evaluate(async () => {
      documents.push({ id: 'nt', title: 'Escritura', cat: 'casa', file: { name: 'e.pdf', type: 'application/pdf', size: 10, data: 'data:application/pdf;base64,' } });
      renderAll(); const box = document.getElementById('aurora-msgs'), before = box.children.length;
      AUR.pending = null; aurQuick('resume a escritura'); await new Promise(r => setTimeout(r, 60));
      return [...box.children].slice(before + 1).map(m => m.innerText).join(' ');
    });
    expect(r2).toMatch(/Ainda não li Escritura[\s\S]*Lê agora/);
    expect(await ask(page, 'resume o meu cofre')).toMatch(/Ponto de situação/);
  });
});
