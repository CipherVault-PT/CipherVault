import { test, expect, openApp, createVault } from './fixtures.mjs';

// Estilos (v11): Ónix & Ouro (por omissão), Nórdico e Clássico — ecrã de entrada, selo, barra de baixo, movimento
const skin = (page, s, extra = {}) => page.addInitScript(([s, extra]) => {
  localStorage.setItem('av_skin', s);
  for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
}, [s, extra]);
const isMobile = testInfo => testInfo.project.name !== 'desktop';

test.describe('Estilos', () => {
  test('por omissão: Ónix & Ouro, sem fotografia nem céu WebGL nem fundo animado', async ({ page }) => {
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
    expect(r).toMatchObject({ skin: 'onix', cls: true, gl: null, run: false, art: 'lanterna', bg: '#0b0b0c' });
    expect(r.fonts).toEqual(expect.arrayContaining(['Inter', 'Bodoni Moda']));
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
    await expect(page.locator('#sk-settings [data-act="setSkin"]')).toHaveCount(3);
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
    expect(['lanterna', 'constelacao', 'aurora']).toContain(r[0]);
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
