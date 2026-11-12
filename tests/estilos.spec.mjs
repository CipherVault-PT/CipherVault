import { test, expect, openApp, createVault } from './fixtures.mjs';

// Estilos (v11, v12): Safira & Platina (por omissão), Ónix & Ouro, Nórdico e Clássico — ecrã de entrada, selo, barra de baixo, movimento
const skin = (page, s, extra = {}) => page.addInitScript(([s, extra]) => {
  localStorage.setItem('av_skin', s);
  for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
}, [s, extra]);
const isMobile = testInfo => testInfo.project.name !== 'desktop';

test.describe('Estilos', () => {
  test('por omissão: Safira & Platina com a Joia, sem fotografia nem céu WebGL nem fundo animado', async ({ page }) => {
    const imgs = [];
    page.on('request', r => { if (/aurora-[lp]\.webp/.test(r.url())) imgs.push(r.url()); });
    await openApp(page);
    const r = await page.evaluate(async () => {
      await document.fonts.ready;
      const fonts = [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))];
      return {
        skin: document.documentElement.dataset.skin, cls: document.documentElement.classList.contains('sk-new'),
        gl: ASKY.gl, run: ASKY.run, art: document.getElementById('sk-art')?.dataset.kind, fonts,
        bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      };
    });
    expect(r).toMatchObject({ skin: 'safira', cls: true, gl: null, run: false, art: 'joia', bg: '#070a13' });
    expect(r.fonts).toEqual(expect.arrayContaining(['Jost', 'Marcellus']));
    await createVault(page);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => AuroraBG.isRunning())).toBe(false);
    expect(imgs).toEqual([]);
  });

  test('o Clássico continua igual: céu, fotografia e fundo animado', async ({ page }) => {
    await skin(page, 'classico');
    await openApp(page);
    expect(await page.evaluate(() => ({ s: document.documentElement.dataset.skin, art: !!document.getElementById('sk-art'), img: !!document.getElementById('asky-img').style.backgroundImage })))
      .toEqual({ s: 'classico', art: false, img: true });
    await createVault(page);
    await expect.poll(() => page.evaluate(() => AuroraBG.isRunning())).toBe(true);
  });

  test('Definições → Aspeto: muda o estilo, o ecrã de entrada e o movimento, e fica guardado', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => { openSettings(); switchSettingsTab('aspeto'); });
    await expect(page.locator('#sk-settings [data-act="setSkin"]')).toHaveCount(4);
    await expect(page.locator('#sk-settings [data-act="setSkin"][data-arg="safira"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sk-settings [data-act="setEntryStyle"][data-arg="joia"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#theme-grid')).toBeHidden();
    await page.locator('#sk-settings [data-act="setSkin"][data-arg="nordico"]').click();
    await page.locator('#sk-settings [data-act="setEntryStyle"][data-arg="constelacao"]').click();
    await page.locator('#sk-settings [data-act="setMotion"][data-arg="desligado"]').click();
    const r = await page.evaluate(() => ({
      skin: localStorage.getItem('av_skin'), entry: localStorage.getItem('av_entry'), motion: localStorage.getItem('av_motion'),
      attr: [document.documentElement.dataset.skin, document.documentElement.dataset.entry, document.documentElement.dataset.motion].join(),
      bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    }));
    expect(r).toEqual({ skin: 'nordico', entry: 'constelacao', motion: 'desligado', attr: 'nordico,constelacao,desligado', bg: '#0e1a17' });
    await page.locator('#sk-settings [data-act="setSkin"][data-arg="classico"]').click();
    await expect(page.locator('#sk-settings [data-act="setEntryStyle"]')).toHaveCount(0);
    await expect(page.locator('#theme-grid')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())).toBe('#0a0e1a');
  });

  test('«Surpreende-me» escolhe um ecrã de entrada do dia', async ({ page }) => {
    await skin(page, 'onix', { av_entry: 'surpresa' });
    await openApp(page);
    const r = await page.evaluate(() => [document.documentElement.dataset.entry, document.getElementById('sk-art').dataset.kind]);
    expect(['joia', 'lanterna', 'constelacao', 'aurora']).toContain(r[0]);
    expect(r[1]).toBe(r[0]);
  });

  test('Constelação: as estrelas acendem-se ao escrever e a assinatura vem do cofre (não da palavra-passe)', async ({ page }) => {
    await skin(page, 'onix', { av_entry: 'constelacao' });
    await openApp(page);
    await page.locator('#start-pw').fill('abc');
    expect(await page.locator('#sk-art .sk-st.lit').count()).toBe(3);
    await page.locator('#start-pw').fill('');
    expect(await page.locator('#sk-art .sk-st.lit').count()).toBe(0);
    await createVault(page, 'sig-pass-1');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('av_sig') || '')).toMatch(/^[0-9a-f]{32}$/);
    const sig = await page.evaluate(() => localStorage.getItem('av_sig'));
    expect(JSON.stringify(await page.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k))))).not.toContain('sig-pass-1');
    await page.evaluate(() => lockApp());
    await expect(page.locator('#sk-hint')).toContainText(/estrelas do teu cofre|your vault/);
    // a mesma assinatura dá sempre as mesmas estrelas
    const a = await page.evaluate(() => [...document.querySelectorAll('#sk-art .sk-st')].map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy')).join(' '));
    await page.evaluate(() => skArtBuild());
    const b = await page.evaluate(() => [...document.querySelectorAll('#sk-art .sk-st')].map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy')).join(' '));
    expect(b).toBe(a);
    expect(sig).toMatch(/^[0-9a-f]{32}$/);
  });

  test('abertura curta: o cofre aparece em menos de 1 s (e logo, com movimento desligado)', async ({ page }) => {
    await openApp(page);
    const unlockMs = motion => page.evaluate(async motion => {
      setMotion(motion);
      const du = doUnlock; let t0 = 0, opening = null;
      doUnlock = function () { t0 = performance.now(); const r = du.apply(this, arguments); opening = document.getElementById('lock-screen').classList.contains('sk-opening'); return r; };
      try {
        if (masterKey) lockApp();
        startNewVault(); document.getElementById('new-pw1').value = 'test-pass-1'; document.getElementById('new-pw2').value = 'test-pass-1';
        await submitNewVault();
        await new Promise(r => { const iv = setInterval(() => { if (getComputedStyle(document.getElementById('app')).display !== 'none') { clearInterval(iv); r(); } }, 5); });
        return { ms: performance.now() - t0, opening };
      } finally { doUnlock = du; }
    }, motion);
    const soft = await unlockMs('suave');
    expect(soft.opening).toBe(true);
    expect(soft.ms).toBeLessThan(900);
    const off = await unlockMs('desligado');
    expect(off.opening).toBe(false);
    expect(off.ms).toBeLessThan(400);
  });

  test('movimento desligado: nada a animar no ecrã de entrada', async ({ page }) => {
    await skin(page, 'onix', { av_motion: 'desligado', av_entry: 'aurora' });
    await openApp(page);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  });

  test('navegação: menu lateral no computador, barra de baixo com a Aurora no telemóvel', async ({ page }, testInfo) => {
    await openApp(page);
    await createVault(page);
    if (!isMobile(testInfo)) {
      const box = await page.locator('#app > .tabs').boundingBox();
      expect(box.x).toBe(0);
      expect(box.height).toBeGreaterThan(500);
      await expect(page.locator('#sk-bnav')).toBeHidden();
      await page.locator('#grp-btn-cofre').click();
      await expect(page.locator('#tab-vault')).toHaveClass(/active/);
      await page.locator('.topbar-logo').click();
      await expect(page.locator('#tab-dashboard')).toHaveClass(/active/);
      return;
    }
    await expect(page.locator('#app > .tabs')).toBeHidden();
    await expect(page.locator('#sk-bnav')).toBeVisible();
    await expect(page.locator('#aurora-fab')).toBeHidden();
    await page.locator('#sk-bnav [data-k="cofre"]').click();
    await expect(page.locator('#tab-vault')).toHaveClass(/active/);
    await expect(page.locator('#sk-bnav [data-k="cofre"]')).toHaveAttribute('aria-current', 'page');
    await page.locator('#sk-bnav [data-k="totp"]').click();
    await expect(page.locator('#tab-totp')).toHaveClass(/active/);
    await page.locator('#sk-bnav [data-k="more"]').click();
    await expect(page.locator('#sk-more-overlay')).toHaveClass(/open/);
    await page.locator('#sk-more-overlay [data-arg2="cards"]').click();
    await expect(page.locator('#sk-more-overlay')).not.toHaveClass(/open/);
    await expect(page.locator('#tab-cards')).toHaveClass(/active/);
    await expect(page.locator('#sk-bnav [data-k="more"]')).toHaveAttribute('aria-current', 'page');
    await page.locator('#sk-bnav .sk-bn-aur').click();
    await expect(page.locator('#aurora-panel')).toHaveClass(/open/);
  });

  test('o kit da pen leva o estilo novo e as fontes dentro do ficheiro', async ({ page }) => {
    await openApp(page);
    const html = await page.evaluate(() => avPenHtml());
    expect(html).not.toMatch(/<link rel="stylesheet" href="skin\.css/);
    expect(html).toContain('html.sk-new');
    expect(html).not.toContain('url(vendor/fonts/');
    expect(html).toContain("font-family:'Bodoni Moda'");
    expect(html).toContain("font-family:'Marcellus'");
  });
});

// v12 — Safira & Platina e a Joia: uma pedra lapidada só deste cofre, que apanha a luz
test.describe('Safira & Platina', () => {
  const SIG = '2b91c4e07a5d3f1866aa09bc4de1f273';
  const fills = page => page.evaluate(() => [...document.querySelectorAll('#sk-art .sk-gem-l polygon[data-a]')].map(p => p.getAttribute('fill')).join('|'));
  const cut = page => page.evaluate(() => [...document.querySelectorAll('#sk-art .sk-gem-l polygon[data-a]')].map(p => p.getAttribute('points')).join('|'));

  test('Joia: as faces têm cor, acendem-se ao escrever e a luz segue o rato', async ({ page }) => {
    await openApp(page);
    const a = await fills(page);
    expect(a.split('|')).toHaveLength(64);
    expect(a).toMatch(/^rgb\(\d+,\d+,\d+\)(\|rgb\(\d+,\d+,\d+\))+$/);
    expect(new Set(a.split('|')).size).toBeGreaterThan(20);
    await page.locator('#start-pw').fill('abcd');
    const b = await fills(page);
    expect(b).not.toBe(a);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointermove', { clientX: innerWidth - 10, clientY: innerHeight - 10, bubbles: true })));
    await expect.poll(() => fills(page)).not.toBe(b);
    // arrastar o dedo na joia move a luz (o browser não usa esse arrastar para deslizar o ecrã)
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.sk-joia')).touchAction)).toBe('none');
    const c = await fills(page);
    await page.evaluate(() => document.body.dispatchEvent(new PointerEvent('pointerdown', { clientX: 12, clientY: 12, bubbles: true })));
    await expect.poll(() => fills(page)).not.toBe(c);
    // só o número de caracteres conta — o conteúdo nunca chega à joia
    await page.locator('#start-pw').fill('wxyz');
    await page.evaluate(() => { SKG.lx = -.35; SKG.ly = -.45; skGemPaint(); });
    expect(await fills(page)).toBe(b);
  });

  test('Joia: o corte vem da assinatura do cofre — cofres diferentes, joias diferentes', async ({ page }) => {
    await skin(page, 'safira', { av_sig: SIG });
    await openApp(page);
    await expect(page.locator('#sk-art .sk-serial')).toHaveText(/Nº 2B91/);
    await expect(page.locator('#sk-hint')).toContainText(/joia do teu cofre|vault’s jewel/);
    const a = await cut(page);
    await page.evaluate(() => { localStorage.setItem('av_sig', 'f0e1d2c3b4a5968778695a4b3c2d1e0f'); skArtBuild(); });
    const b = await cut(page);
    expect(b).not.toBe(a);
    await page.evaluate(sig => { localStorage.setItem('av_sig', sig); skArtBuild(); }, SIG);
    expect(await cut(page)).toBe(a);
  });

  test('Joia: com o cofre aberto fica tudo desligado (sem sensor, sem redesenhar)', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await expect.poll(() => page.evaluate(() => SKG.tilt || SKG.open || !!SKG.amb)).toBe(false);
    const n = await page.evaluate(async () => {
      let c = 0; const o = skGemPaint; skGemPaint = function () { c++; return o.apply(this, arguments); };
      for (let i = 0; i < 5; i++) { document.dispatchEvent(new PointerEvent('pointermove', { clientX: 20 * i, clientY: 30, bubbles: true })); await new Promise(r => requestAnimationFrame(r)); }
      skGemPaint = o; return c;
    });
    expect(n).toBe(0);
    await page.evaluate(() => lockApp());
    // ao trancar a joia volta, já com a lapidação deste cofre (6 a 12 lados → 48 a 96 faces)
    expect(await page.evaluate(() => { const g = document.querySelector('#sk-art .sk-gem'); return [48, 64, 80, 96].includes(g.querySelectorAll('.sk-gem-l polygon[data-a]').length) && +g.dataset.n === g.querySelectorAll('.sk-gem-l polygon[data-a]').length; })).toBe(true);
  });

  test('Joia com «Movimento: desligado»: fica parada e sem animações', async ({ page }) => {
    await skin(page, 'safira', { av_motion: 'desligado' });
    await openApp(page);
    const a = await fills(page);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointermove', { clientX: 5, clientY: 5, bubbles: true })));
    await page.waitForTimeout(200);
    expect(await fills(page)).toBe(a);
    expect(await page.evaluate(() => ({ run: document.getAnimations().filter(x => x.playState === 'running').length, tilt: SKG.tilt, amb: SKG.amb }))).toEqual({ run: 0, tilt: false, amb: 0 });
  });

  test('telemóvel baixo: o ecrã de entrada do cofre memorizado cabe todo, sem deslizar', async ({ page }) => {
    await page.addInitScript(() => { delete window.showOpenFilePicker; localStorage.setItem('av_bk_freq', 'off'); });
    for (const [w, h] of [[390, 664], [360, 640], [320, 568]]) {
      await page.setViewportSize({ width: w, height: h });
      await openApp(page);
      if (w === 390) { await createVault(page); await page.evaluate(async () => { await saveFile({ auto: true }); }); await page.reload(); }
      await page.waitForFunction(() => typeof lockOnPwStep === 'function' && lockOnPwStep());
      expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), `${w}×${h}`).toBeLessThanOrEqual(0);
    }
  });

  test('modo claro e escuro, e o estilo fica em todos os ecrãs sem transbordar', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    for (const mode of ['light', 'dark']) {
      await page.evaluate(m => setSkinMode(m), mode);
      const r = await page.evaluate(() => ({
        bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
        font: getComputedStyle(document.body).fontFamily, over: document.documentElement.scrollWidth - innerWidth,
      }));
      expect(r.bg).toBe(mode === 'light' ? '#f3f5fa' : '#070a13');
      expect(r.font).toContain('Jost');
      expect(r.over).toBeLessThanOrEqual(0);
    }
  });

  test('quem já tinha escolhido outro estilo fica com ele e recebe só o convite para experimentar', async ({ page }) => {
    await skin(page, 'onix');
    await openApp(page);
    await createVault(page);
    expect(await page.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.entry])).toEqual(['onix', 'lanterna']);
    await page.evaluate(() => { vault.push({ id: 'w1', name: 'Conta', user: 'u', pw: 'Xk9!fA2#pQ7', cat: 'email', created: Date.now() }); });
    // o convite não atropela o resumo da semana (que aparece aos 5 s): espera que ele feche
    await expect(page.locator('#av-nudge.show')).toContainText(/resumo da semana|weekly summary/, { timeout: 9000 });
    await page.waitForTimeout(2600);
    await expect(page.locator('#av-nudge.show')).toContainText(/resumo da semana|weekly summary/);
    await page.locator('#av-nudge .av-nudge-x').click();
    await expect(page.locator('#av-nudge.show')).toContainText(/Safira|Sapphire/, { timeout: 9000 });
    expect(await page.evaluate(() => localStorage.getItem('av_skin_intro'))).toBe('2');
    await page.locator('#av-nudge .av-nudge-b').first().click();
    expect(await page.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.entry, localStorage.getItem('av_skin'), localStorage.getItem('av_entry')]))
      .toEqual(['safira', 'joia', 'safira', 'joia']);
    // só uma vez
    expect(await page.evaluate(() => localStorage.getItem('av_skin_intro'))).toBe('2');
  });
});

// Selo: com a impressão digital configurada, tocar no selo (ou no botão) pede-a logo e entra
test('tocar no selo pede a impressão digital e entra', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'autenticador virtual só existe no Chromium');
  await page.addInitScript(() => { delete window.showOpenFilePicker; });
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true },
  });
  await openApp(page);
  await createVault(page, 'biopass1');
  await page.evaluate(async () => { await saveFile({ auto: true }); const r = await saveBioUnlock(); if (!r.ok) throw new Error('bio'); });
  await page.reload();
  await page.waitForFunction(() => typeof lockSwipeNeed !== 'undefined' && lockOnPwStep() && unlockMode === 'bio');
  await expect(page.locator('#sk-seal')).toHaveAttribute('aria-label', /impressão digital|fingerprint/);
  await expect(page.locator('#lk-swipe-txt')).toContainText(/Toca|Clica|Tap|Click/);
  await page.locator('#sk-seal').click();
  await page.waitForFunction(() => !!masterKey);
  await expect(page.locator('#app')).toBeVisible();
});

// v11.1 — fluidez: estas garantias impedem que o gasto escondido volte
test.describe('Fluidez', () => {
  test('parado no Início: o anel da Aurora fica quieto no «Suave» e flui no «Completo»', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    const ring = () => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('aur-ring')).length);
    await page.waitForTimeout(300);
    expect(await ring()).toBe(0);
    await page.evaluate(() => setMotion('completo'));
    await expect.poll(ring).toBeGreaterThan(0);
  });

  test('mudanças de texto não fazem rever a página inteira (só quando entram cartões)', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    const n = await page.evaluate(async () => {
      let c = 0; const o = avxScan; avxScan = function () { c++; return o.apply(this, arguments); };
      const el = document.getElementById('aur-launch-ph') || document.body;
      for (let i = 0; i < 20; i++) { el.textContent = 'x' + i; await new Promise(r => requestAnimationFrame(r)); }
      avxScan = o; return c;
    });
    expect(n).toBe(0);
  });

  // v12
  test('só a aba aberta é desenhada; as outras desenham-se ao entrar e esvaziam-se ao trancar', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => {
      for (let i = 0; i < 6; i++) vault.push({ id: 'z' + i, name: 'Conta secreta ' + i, user: 'u' + i, pw: 'Pw!' + i + 'aB9', cat: 'email', created: Date.now() });
      notes.push({ id: 'n1', title: 'Nota secreta', body: 'x', updated: Date.now() });
      renderAll();
    });
    expect(await page.evaluate(() => [document.querySelectorAll('#tab-vault .entry-card').length, document.getElementById('tab-notes').textContent.includes('Nota secreta')])).toEqual([0, false]);
    await page.evaluate(() => switchTab('vault'));
    await expect(page.locator('#tab-vault .entry-card')).toHaveCount(6);
    await page.evaluate(() => switchTab('notes'));
    await expect(page.locator('#tab-notes')).toContainText('Nota secreta');
    await page.evaluate(() => lockApp());
    expect(await page.evaluate(() => /secreta/.test(document.getElementById('app').textContent))).toBe(false);
  });

  test('parado em qualquer aba no «Suave»: nenhuma animação a correr sem fim', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => {
      vault.push({ id: 'q1', name: 'Fraca', user: 'u', pw: '123456', cat: 'email', created: Date.now() });
      totp.push({ id: 't1', name: 'Google', issuer: 'Google', secret: 'JBSWY3DPEHPK3PXP', digits: 6, period: 30, algo: 'SHA1' });
      renderAll();
    });
    for (const tab of ['dashboard', 'vault', 'totp', 'notes', 'cards', 'docs', 'archive']) {
      await page.evaluate(t => switchTab(t), tab);
      await page.waitForTimeout(250);
      const endless = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity).map(a => a.animationName || '?'));
      expect(endless, 'animações sem fim na aba ' + tab).toEqual([]);
    }
  });

  test('cofre grande: com o Cofre fechado só se desenha o 1.º lote; o resto quando é aberto', async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => { for (let i = 0; i < 150; i++) vault.push({ id: 'f' + i, name: 'Conta ' + i, user: 'u' + i, pw: 'Pw!' + i + 'aB9', cat: 'email', created: Date.now() }); renderAll(); switchTab('dashboard'); });
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => document.querySelectorAll('#tab-vault .entry-card').length);
    expect(before).toBeLessThan(150);
    await page.evaluate(() => switchTab('vault'));
    await expect.poll(() => page.evaluate(() => document.querySelectorAll('#tab-vault .entry-card').length)).toBe(150);
  });
});
