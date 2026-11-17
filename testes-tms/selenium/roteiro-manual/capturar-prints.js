// Percorre os fluxos dos testes MANUAIS (CT21 a CT30) e salva um print de cada
// tela em testes-tms/manuais/prints/. Não faz asserções: quem decide se o caso
// passou é a pessoa que olha os prints e a tela, como num teste manual.
// Serve de apoio para a documentação; o ideal é o grupo repetir os passos à mão.
//
// Uso (com o front rodando em modo e2e): node roteiro-manual/capturar-prints.js

import fs from 'node:fs';
import path from 'node:path';
import { By } from 'selenium-webdriver';
import {
  CLIENTE_DEMO,
  COMERCIANTE_DEMO,
  abrirNavegador,
  clicarBotao,
  entrar,
  esperar,
  esperarTexto,
  esperarUrl,
  preencher,
} from '../support/driver.js';

const PASTA = path.resolve('..', 'manuais', 'prints');
fs.mkdirSync(PASTA, { recursive: true });

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const TITULOS_CARDS = By.css('main ul li article h3');

async function print(driver, nome) {
  await pausa(600); // deixa as animações terminarem
  fs.writeFileSync(path.join(PASTA, `${nome}.png`), await driver.takeScreenshot(), 'base64');
  console.log('  print:', nome);
}

// Clica no primeiro link VISÍVEL com o texto (o menu do celular repete links).
async function clicarLink(driver, texto) {
  await driver.wait(
    async () => {
      for (const link of await driver.findElements(By.xpath(`//a[normalize-space(.)='${texto}']`))) {
        if (await link.isDisplayed()) {
          await link.click();
          return true;
        }
      }
      return false;
    },
    10_000,
    `link "${texto}" não apareceu`,
  );
}

async function sair(driver) {
  await (await esperar(driver, By.css('[aria-label="Conta e perfil"]'))).click();
  await clicarBotao(driver, 'Sair');
  await esperarUrl(driver, '/login');
}

// Login sem recarregar a página (mantém os dados simulados em memória).
async function entrarSemRecarregar(driver, { email, senha }) {
  await preencher(driver, By.id('email'), email);
  await preencher(driver, By.id('senha'), senha);
  await clicarBotao(driver, 'Entrar');
}

async function reservarPrimeiraDisponivel(driver) {
  const total = (await driver.findElements(TITULOS_CARDS)).length;
  for (let i = 0; i < total; i++) {
    await (await driver.findElements(TITULOS_CARDS))[i].click();
    const botao = await esperar(
      driver,
      By.xpath("//button[.='Reservar agora' or .='Esgotado por enquanto']"),
    );
    if ((await botao.getText()) === 'Reservar agora') {
      await botao.click();
      await clicarBotao(driver, 'Reservar pedido');
      await esperarTexto(driver, 'Pedido confirmado!');
      return (await esperar(driver, By.css('p.select-all'))).getText();
    }
    await clicarLink(driver, '← Voltar às ofertas');
    await esperar(driver, TITULOS_CARDS);
  }
  throw new Error('nenhuma oferta disponível');
}

async function filtrar(driver, { estab, ordem, precoMax, limpar }) {
  // O botão vira "Filtrar 2" quando há filtros ativos, por isso o contains.
  await (await esperar(driver, By.xpath("//button[contains(normalize-space(.), 'Filtrar')]"))).click();
  if (limpar) {
    await clicarBotao(driver, 'Limpar');
    await pausa(800);
    return;
  }
  const selects = await driver.findElements(By.css('[role="dialog"] select, select'));
  if (estab !== undefined) await selects[0].findElement(By.css(`option[value="${estab}"]`)).click();
  if (ordem) await selects[1].findElement(By.css(`option[value="${ordem}"]`)).click();
  if (precoMax !== undefined) await preencher(driver, By.css('input[placeholder="Sem limite"]'), precoMax);
  await clicarBotao(driver, 'Ver ofertas');
  await pausa(800);
}

const driver = await abrirNavegador();
try {
  // CT29 — localização negada e uso do centro de Betim
  console.log('CT29');
  await entrar(driver, CLIENTE_DEMO);
  await esperarTexto(driver, 'Não pegamos sua localização');
  await print(driver, 'CT29-1-aviso-localizacao');
  await clicarBotao(driver, 'Usar centro de Betim');
  await esperar(driver, TITULOS_CARDS);
  await print(driver, 'CT29-2-ofertas-betim');

  // CT26 — filtro por preço máximo + ordenação por preço
  console.log('CT26');
  await filtrar(driver, { ordem: 'preco-asc', precoMax: '15' });
  await print(driver, 'CT26-filtro-preco');
  await filtrar(driver, { limpar: true });

  // CT28 — perfil do estabelecimento a partir do card
  console.log('CT28');
  const linkEstab = await esperar(driver, By.css('main ul li article a[href^="/estabelecimentos/"]'));
  await linkEstab.click();
  await esperarUrl(driver, '/estabelecimentos/');
  await pausa(800);
  await print(driver, 'CT28-perfil-estabelecimento');
  await driver.navigate().back();
  await esperar(driver, TITULOS_CARDS);

  // CT27 — notificações
  console.log('CT27');
  await (await esperar(driver, By.css('[aria-label^="Notificações"]'))).click();
  await esperarTexto(driver, 'Bem-vindo ao FoodLoop');
  await print(driver, 'CT27-1-notificacoes');
  await clicarBotao(driver, 'Marcar todas');
  await pausa(800);
  await print(driver, 'CT27-2-marcadas-como-lidas');
  // Fecha a lista clicando fora dela, como o usuário faria.
  await driver.findElement(By.css('button.fixed.inset-0')).click();
  await pausa(300);

  // CT25 — cliente reserva e cancela um pedido
  console.log('CT25');
  await filtrar(driver, { estab: '1' });
  await esperar(driver, TITULOS_CARDS);
  await reservarPrimeiraDisponivel(driver);
  await clicarLink(driver, 'Meus pedidos');
  await esperarTexto(driver, 'Acompanhe o status');
  await clicarBotao(driver, 'Cancelar');
  await print(driver, 'CT25-1-confirmar-cancelamento');
  await clicarBotao(driver, 'Sim');
  await esperarTexto(driver, 'Cancelado');
  await print(driver, 'CT25-2-pedido-cancelado');

  // CT24 — novo pedido e acompanhamento em "Meus pedidos"
  console.log('CT24');
  await clicarLink(driver, 'Ofertas');
  await esperar(driver, TITULOS_CARDS);
  const codigo = await reservarPrimeiraDisponivel(driver);
  console.log('  código de retirada:', codigo);
  await print(driver, 'CT24-1-pedido-confirmado');
  await clicarLink(driver, 'Meus pedidos');
  await esperarTexto(driver, 'Acompanhe o status');
  await print(driver, 'CT24-2-meus-pedidos');

  // CT21 — comerciante entra e vê o painel
  console.log('CT21');
  await sair(driver);
  await entrarSemRecarregar(driver, COMERCIANTE_DEMO);
  await esperarUrl(driver, '/comerciante');
  await pausa(800);
  await print(driver, 'CT21-painel-comerciante');

  // CT22 — comerciante avança o status do pedido
  console.log('CT22');
  await clicarBotao(driver, 'Iniciar preparo');
  await esperarTexto(driver, 'Marcar pronto');
  await print(driver, 'CT22-1-em-preparo');
  await clicarBotao(driver, 'Marcar pronto');
  await esperar(driver, By.css('input[placeholder="Código do cliente"]'));
  await print(driver, 'CT22-2-pronto-para-retirada');

  // CT23 — confirmar retirada (primeiro com código errado, depois o certo)
  console.log('CT23');
  await preencher(driver, By.css('input[placeholder="Código do cliente"]'), 'ABC');
  await clicarBotao(driver, 'Confirmar retirada');
  await esperarTexto(driver, 'Informe os 8 caracteres do código');
  await print(driver, 'CT23-1-codigo-incompleto');
  await preencher(driver, By.css('input[placeholder="Código do cliente"]'), 'ZZZZZZZZ');
  await clicarBotao(driver, 'Confirmar retirada');
  await pausa(1200);
  await print(driver, 'CT23-2-codigo-errado');
  await preencher(driver, By.css('input[placeholder="Código do cliente"]'), codigo);
  await clicarBotao(driver, 'Confirmar retirada');
  await pausa(1200);
  await print(driver, 'CT23-3-retirada-confirmada');

  // CT30 — layout no celular (375 px)
  console.log('CT30');
  await sair(driver);
  await entrarSemRecarregar(driver, CLIENTE_DEMO);
  await driver.manage().window().setRect({ width: 390, height: 844 });
  await esperar(driver, By.css('main'));
  await pausa(1000);
  await print(driver, 'CT30-celular');

  console.log('Prints salvos em', PASTA);
} catch (e) {
  await print(driver, 'ERRO').catch(() => {});
  console.error(e);
  process.exitCode = 1;
} finally {
  await driver.quit();
}
