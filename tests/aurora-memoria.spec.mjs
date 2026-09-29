import { test, expect, openApp, createVault } from './fixtures.mjs';

// Aurora aprende contigo: escolhas repetidas, alcunhas e correções — guardadas encriptadas no cofre
test.describe('Aurora aprende contigo', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await createVault(page);
    await page.evaluate(() => {
      vault.push({ id: 's', name: 'Santander', cat: 'banco', user: 'santa-user', pw: 'Sa#2026-xyzQw' },
        { id: 'r', name: 'Revolut', cat: 'banco', user: 'revo-user', pw: 'Rv!2025-xyzQ' },
        { id: 'g', name: 'Gmail', cat: 'email', user: 'carlos@gmail.com', pw: 'Gm#2024abcXY' },
        { id: 'n', name: 'Netflix', cat: 'social', user: 'netflix-user', pw: 'Nf-2025!qwerty' },
        { id: 'w', name: 'Intranet Empresa', cat: 'outro', user: 'c.silva', pw: 'Tr@b-2026-xyz' });
      window.openReadMode = () => {};
      renderAll(); auroraOpen();
    });
  });

  const say = (page, q) => page.evaluate(async q => {
    const box = document.getElementById('aurora-msgs'), before = box.children.length;
    AUR.pending = null; aurQuick(q); await new Promise(r => setTimeout(r, 40));
    return [...box.children].slice(before + 1).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ ');
  }, q);
  const pick = async (page, label) => {
    await page.locator('#aurora-msgs .aurora-msg').last().locator('.a-btn', { hasText: label }).click();
    await page.waitForTimeout(60);
    return page.evaluate(() => [...document.querySelectorAll('#aurora-msgs .aurora-msg')].slice(-2).map(m => m.innerText.replace(/\s+/g, ' ')).join(' ‖ '));
  };

  test('escolher a mesma conta duas vezes → passa a assumi-la', async ({ page }) => {
    expect(await say(page, 'password do banco')).toMatch(/qual é/);
    await pick(page, 'Santander');
    expect(await say(page, 'password do banco')).toMatch(/qual é/);
    expect(await pick(page, 'Santander')).toMatch(/Aprendi: quando disseres «banco» uso Santander/);
    expect(await say(page, 'qual a password do banco')).toMatch(/Santander[\s\S]*santa-user/);
    // um nome escrito ganha sempre à alcunha
    expect(await say(page, 'password do banco revolut')).toMatch(/Revolut[\s\S]*revo-user/);
  });

  test('correção: «não, eu queria a revolut» corrige e aprende', async ({ page }) => {
    await say(page, 'password do banco'); await pick(page, 'Santander');
    const r = await say(page, 'não, eu queria a revolut');
    expect(r).toMatch(/Revolut[\s\S]*revo-user/);
    expect(r).toMatch(/Aprendi: quando disseres «banco» uso Revolut/);
    expect(await say(page, 'password do banco')).toMatch(/Revolut/);
  });

  test('correção depois de um nome não cria alcunhas erradas', async ({ page }) => {
    await say(page, 'password do gmail');
    expect(await say(page, 'não, a do netflix')).toMatch(/Netflix[\s\S]*netflix-user/);
    expect(await page.evaluate(() => Object.keys(payloadExtras.aurMem?.alias || {}))).toEqual([]);
    expect(await say(page, 'password do gmail')).toMatch(/Gmail[\s\S]*carlos@gmail\.com/);
  });

  test('alcunhas, «o que aprendeste», «esquece» e guardado encriptado no cofre', async ({ page }) => {
    expect(await say(page, 'chama trabalho ao intranet empresa')).toMatch(/«trabalho» passa a ser Intranet Empresa/);
    expect(await say(page, 'password do trabalho')).toMatch(/Intranet Empresa[\s\S]*c\.silva/);
    expect(await say(page, 'quando digo banco quero dizer a revolut')).toMatch(/«banco», percebo Revolut/);
    expect(await say(page, 'password do banco')).toMatch(/Revolut[\s\S]*revo-user/);
    expect(await page.evaluate(() => localStorage.getItem('av_aliases'))).toBeNull();
    expect(await say(page, 'o que aprendeste?')).toMatch(/«banco» → Revolut[\s\S]*«trabalho» → Intranet Empresa/);
    const saved = await page.evaluate(async () => {
      await saveFile({ auto: true });
      const json = pendingVaultText, dec = await decrypt(masterKey, JSON.parse(json).payload);
      return { plain: json.includes('trabalho'), inside: JSON.stringify(dec).includes('"trabalho"') };
    });
    expect(saved).toEqual({ plain: false, inside: true });
    expect(await say(page, 'esquece banco')).toMatch(/esqueci «banco»/);
    expect(await say(page, 'password do banco')).toMatch(/qual é/);
    expect(await say(page, 'esquece tudo o que aprendeste')).toMatch(/Esqueci tudo/);
    expect(await say(page, 'o que aprendeste')).toMatch(/Ainda não aprendi nada/);
  });
});
