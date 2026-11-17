// Gera os prints "antes" e "depois" das refatorações a partir dos trechos em
// testes-tms/refatoracao/codigo/*.txt. Uso: node refatoracao/gerar-prints.js
import fs from 'node:fs';
import path from 'node:path';
import { By } from 'selenium-webdriver';
import { abrirNavegador } from '../support/driver.js';

const PASTA = path.resolve('..', 'refatoracao');
const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function pagina(titulo, codigo, cor) {
  const linhas = codigo
    .trimEnd()
    .split('\n')
    .map((l, i) => `<span class="n">${i + 1}</span>${escapar(l) || ' '}`)
    .join('\n');
  return `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#fff;font-family:Segoe UI,Arial,sans-serif}
    #print{display:inline-block;margin:16px;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px #0003}
    h1{margin:0;padding:10px 16px;font-size:15px;color:#fff;background:${cor}}
    pre{margin:0;padding:14px 18px;background:#1e1e1e;color:#d4d4d4;font:13.5px/1.55 Consolas,monospace}
    .n{display:inline-block;width:2.2em;color:#6e7681;user-select:none}
  </style><div id="print"><h1>${titulo}</h1><pre>${linhas}</pre></div>`;
}

const driver = await abrirNavegador();
try {
  await driver.manage().window().setRect({ width: 1100, height: 1400 });
  for (const n of [1, 2]) {
    for (const fase of ['antes', 'depois']) {
      const codigo = fs.readFileSync(path.join(PASTA, 'codigo', `r${n}-${fase}.txt`), 'utf8');
      const titulo = `Refatoração ${n} — ${fase.toUpperCase()}`;
      const html = pagina(titulo, codigo, fase === 'antes' ? '#b42318' : '#0f7b4f');
      await driver.get('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      const img = await driver.findElement(By.id('print')).takeScreenshot();
      fs.writeFileSync(path.join(PASTA, `R${n}-${fase}.png`), img, 'base64');
      console.log('print:', `R${n}-${fase}.png`);
    }
  }
} finally {
  await driver.quit();
}
