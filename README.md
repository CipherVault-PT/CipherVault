# Aurora Vault (CipherVault)

Gestor de palavras-passe, documentos, cartões e códigos 2FA que funciona **100% no dispositivo**: sem servidores, sem contas, também sem internet.
App web instalável (PWA), publicada com GitHub Pages: <https://ciphervault-pt.github.io/CipherVault/>

## Segurança

- Tudo fica num único ficheiro `.vault`, encriptado com **AES-256-GCM**.
- A chave vem da palavra-passe mestra com **PBKDF2-SHA256, 600 000 iterações** (recomendação atual da OWASP).
  Cofres antigos (200 000 iterações) continuam a abrir e passam para 600 000 sozinhos na gravação seguinte.
- **PIN de 6 dígitos** e **biometria** (WebAuthn PRF) para reabrir no mesmo dispositivo; ficam só nesse browser, encriptados,
  com limite de tentativas. PINs antigos de 4 dígitos continuam a funcionar até se escolher um novo.
- O separador 2FA pode ter uma chave própria (PIN + código de recuperação), independente da palavra-passe mestra.
- **Sem código de terceiros:** leitor de QR, OCR (tesseract.js + dicionários PT/EN), leitor de PDF (pdf.js) e fontes estão
  alojados em `vendor/`, na versão testada. A app não faz pedidos a CDNs nem à Google Fonts.
- **Política de segurança (CSP)** no `index.html`: só corre código deste site e só pode falar com o Google Drive
  (sincronização) e com o Have I Been Pwned (verificação de fugas). Um código estranho não teria para onde enviar dados.

## Estrutura

| Ficheiro | O que é |
| --- | --- |
| `index.html` | Estrutura da página |
| `styles.css` | Aparência |
| `js/crypto.js` | Encriptação do cofre (AES-256-GCM, PBKDF2, formato do ficheiro) — testada à parte |
| `js/actions.js` | Botões e campos sem código dentro do HTML (`data-act`, `data-input`…) |
| `app.js` | O resto da lógica da app (a ser dividido aos poucos) |
| `sw.js` | Service worker: abre sem internet e guarda cada versão uma só vez |
| `img/` | Fotografias do ecrã de entrada |
| `vendor/jsqr.js` | Leitor de QR (só é descarregado quando se usa a câmara num browser sem leitor próprio) |
| `vendor/tesseract-5.1.1/` | OCR (ler validades e documentos em fotos), com os dicionários PT e EN — só descarregado quando se usa |
| `vendor/pdfjs-3.11.174/` | Leitura de PDFs anexados — só descarregado quando se usa |
| `vendor/fonts/` | Fontes Playfair Display e JetBrains Mono (licença OFL) |
| `tests/` | Testes automáticos (Playwright) |

Não há passo de compilação: os ficheiros são publicados tal como estão.

## Correr no computador

```bash
npm install          # só é preciso para os testes
npm run serve        # http://localhost:4173/
```

## Testes

```bash
npx playwright install chromium   # 1.ª vez
npm test
```

Correm também no GitHub em cada *pull request* e em cada alteração ao `main` (separador **Actions**).
Cobrem a encriptação e a migração dos cofres antigos, PIN e biometria, os bugs já corrigidos, o funcionamento sem internet,
o aspeto em telemóvel/computador e tema claro/escuro, e o consumo do fundo animado.

## Publicar uma versão

Mudar o número (ex.: `10.0` → `10.1`) **em todos estes sítios**, senão os telemóveis continuam com a versão antiga guardada:

1. `index.html` — `<meta name="app-version">`, o comentário de compatibilidade logo abaixo, todos os `?v=` (`styles.css`, `js/*.js`, `app.js`) e o `· v…` dos dois rodapés;
2. `app.js` — `const APP_VERSION`.

O teste `tests/version.spec.mjs` falha se algum ficar esquecido.

## Código novo: sem `onclick` no HTML

O objetivo é a política de segurança deixar de precisar de `'unsafe-inline'`. Botões e campos novos usam atributos em vez de código:

```html
<button data-act="lockEnter">Entrar</button>              <!-- clique → lockEnter() -->
<button data-act="setLang" data-arg="en">EN</button>      <!-- clique → setLang('en') -->
<input data-input="onPinInput" data-enter="lockEnter">     <!-- ao escrever / tecla Enter -->
```

A função tem de estar na lista `AV_ACTS` em `js/actions.js`. Os valores vão sempre escapados com `esc()` nos atributos — nunca dentro de código.
Já estão assim (com testes que o garantem): o **ecrã de entrada** e o **cofre de passwords**.
