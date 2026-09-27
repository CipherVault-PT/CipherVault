import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// js/crypto.js testado sozinho (em Node, sem browser): vetores oficiais e ida-e-volta
function loadCrypto() {
  const ctx = {
    crypto: globalThis.crypto, TextEncoder, TextDecoder, Blob, Response, CompressionStream, DecompressionStream, fetch,
    Uint8Array, WeakMap, Promise, JSON, Array, Math, Error, setTimeout, clearTimeout,
    FileReader: class { readAsDataURL(b) { b.arrayBuffer().then(a => { this.result = 'data:x;base64,' + Buffer.from(a).toString('base64'); this.onload(); }); } },
    masterKey: null, masterPwRaw: '',
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../js/crypto.js', import.meta.url), 'utf8') + '\n;globalThis.__api={deriveKey,KEY_RAW,encrypt,decrypt,mkContainer,containerIter,KDF_ITER,KDF_ITER_LEGACY,sameBytes};', ctx);
  return ctx.__api;
}
const hex = u8 => Buffer.from(u8).toString('hex');
const enc = s => new TextEncoder().encode(s);

test('PBKDF2-SHA256 dá os valores oficiais', async () => {
  const c = loadCrypto();
  const raw = async (pw, salt, it) => hex(c.KEY_RAW.get(await c.deriveKey(pw, enc(salt), it)));
  expect(await raw('password', 'salt', 1)).toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
  expect(await raw('password', 'salt', 4096)).toBe('c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a');
});

test('encriptar e desencriptar devolve os mesmos dados; outra chave falha', async () => {
  const c = loadCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const k = await c.deriveKey('certa', salt, 1000), k2 = await c.deriveKey('errada', salt, 1000);
  const data = { vault: [{ name: 'Gmail', pw: 'çãõ€ «" 🔐' }], big: 'x'.repeat(50000) };
  const p = await c.encrypt(k, data);
  expect(p.v).toBe(2);
  expect(JSON.stringify(await c.decrypt(k, p))).toBe(JSON.stringify(data));
  await expect(c.decrypt(k2, p)).rejects.toThrow();
  const tampered = { ...p, data: p.data.slice(0, -4) + (p.data.endsWith('AAAA') ? 'BBBB' : 'AAAA') };
  await expect(c.decrypt(k, tampered)).rejects.toThrow();
});

test('formato do ficheiro: iterações gravadas e cofres antigos reconhecidos', () => {
  const c = loadCrypto();
  const salt = new Uint8Array(16).fill(7);
  const novo = c.mkContainer({ salt, iter: c.KDF_ITER }, { v: 2, iv: 'a', data: 'b' });
  expect(novo).toMatchObject({ iter: 600000, payload: { v: 3 } });
  expect(c.containerIter(novo)).toBe(600000);
  const antigo = c.mkContainer({ salt, iter: c.KDF_ITER_LEGACY }, { v: 2, iv: 'a', data: 'b' });
  expect(antigo.iter).toBeUndefined();
  expect(antigo.payload.v).toBe(2);
  expect(c.containerIter({ salt: [] })).toBe(200000);
  expect(c.containerIter({ iter: 5 })).toBe(200000); // valor absurdo → formato antigo
});
