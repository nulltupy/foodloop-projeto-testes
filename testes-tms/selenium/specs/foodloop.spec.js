// Suíte de testes funcionais automatizados do FoodLoop (CT11 a CT20).
// Cada teste abre um navegador limpo, executa o fluxo e salva um print em
// evidencias/ para o relatório.

import assert from 'node:assert/strict';
import { By } from 'selenium-webdriver';
import {
  BASE_URL,
  CLIENTE_DEMO,
  abrirNavegador,
  clicarBotao,
  emailUnico,
  entrar,
  esperar,
  esperarTexto,
  esperarUrl,
  preencher,
  salvarPrint,
} from '../support/driver.js';

describe('FoodLoop — testes funcionais automatizados (Selenium)', function () {
  let driver;

  beforeEach(async function () {
    driver = await abrirNavegador();
  });

  afterEach(async function () {
    if (!driver) return;
    // O id do caso (CT11, CT12...) vira o nome do print.
    const id = this.currentTest.title.split(' ')[0];
    await salvarPrint(driver, id).catch(() => {});
    await driver.quit();
  });

  describe('Login', function () {
    it('CT11 - Entrar como cliente com e-mail e senha válidos', async function () {
      await entrar(driver, CLIENTE_DEMO);

      await esperarTexto(driver, 'preço de resgate');
      const url = await driver.getCurrentUrl();
      assert.equal(new URL(url).pathname, '/', 'o cliente deveria cair na página de ofertas');
    });

    it('CT12 - Tentar entrar com a senha errada', async function () {
      await entrar(driver, { email: CLIENTE_DEMO.email, senha: 'senhaErrada99' });

      const alerta = await esperar(driver, By.css('[role="alert"]'));
      assert.equal(await alerta.getText(), 'E-mail ou senha inválidos.');
      assert.match(await driver.getCurrentUrl(), /\/login$/);
    });

    it('CT13 - Tentar entrar com os campos em branco', async function () {
      await driver.get(`${BASE_URL}/login`);
      await clicarBotao(driver, 'Entrar');

      await esperarTexto(driver, 'Informe um e-mail válido.');
      await esperarTexto(driver, 'Informe a senha.');
      assert.match(await driver.getCurrentUrl(), /\/login$/);
    });
  });

  describe('Cadastro de cliente', function () {
    async function preencherCadastro({ nome, email, telefone, senha }) {
      await driver.get(`${BASE_URL}/cadastro/cliente`);
      await preencher(driver, By.id('nome'), nome);
      await preencher(driver, By.id('email'), email);
      await preencher(driver, By.id('telefone'), telefone);
      await preencher(driver, By.id('senha'), senha);
      await clicarBotao(driver, 'Criar conta');
    }

    it('CT14 - Criar conta de cliente com dados válidos', async function () {
      await preencherCadastro({
        nome: 'Maria Teste',
        email: emailUnico('maria'),
        telefone: '+5531999998888',
        senha: 'minhaSenha123',
      });

      // Depois do cadastro o sistema já entra logado e mostra as ofertas.
      await esperarTexto(driver, 'preço de resgate');
      const conta = await esperar(driver, By.css('[aria-label="Conta e perfil"]'));
      assert.ok(await conta.isDisplayed(), 'o menu da conta deveria aparecer no topo');
    });

    it('CT15 - Tentar cadastrar com telefone fora do padrão', async function () {
      await preencherCadastro({
        nome: 'João Teste',
        email: emailUnico('joao'),
        telefone: '(31) 99999-8888',
        senha: 'minhaSenha123',
      });

      await esperarTexto(driver, 'Use o formato +55DDDNUMERO.');
      assert.match(await driver.getCurrentUrl(), /\/cadastro\/cliente$/);
    });

    it('CT16 - Tentar cadastrar um e-mail que já existe', async function () {
      await preencherCadastro({
        nome: 'Cliente Repetido',
        email: CLIENTE_DEMO.email,
        telefone: '+5531999997777',
        senha: 'minhaSenha123',
      });

      const alerta = await esperar(driver, By.css('[role="alert"]'));
      assert.equal(await alerta.getText(), 'E-mail ou CNPJ já cadastrado.');
    });
  });

  describe('Ofertas e reserva', function () {
    const CAMPO_BUSCA = By.css('input[aria-label="Buscar produto ou estabelecimento"]');
    const TITULOS_CARDS = By.css('main ul li article h3');

    async function entrarEVerOfertas() {
      await entrar(driver, CLIENTE_DEMO);
      await esperar(driver, TITULOS_CARDS);
    }

    it('CT17 - Buscar uma oferta pelo nome do produto', async function () {
      await entrarEVerOfertas();

      // Usa a última palavra do primeiro produto da lista como termo de busca.
      const primeiro = await driver.findElement(TITULOS_CARDS).getText();
      const termo = primeiro.split(' ').at(-1);
      await preencher(driver, CAMPO_BUSCA, termo);

      // Espera a lista ser filtrada (a busca tem um atraso de ~300 ms).
      // Lê todos os títulos de uma vez dentro da página: a lista é redesenhada
      // enquanto filtra, e ler card por card dava erro de elemento "velho".
      await driver.wait(
        async () => {
          const titulos = await driver.executeScript(
            "return [...document.querySelectorAll('main ul li article h3')].map((h) => h.textContent);",
          );
          return titulos.length > 0 && titulos.every((t) => t.toLowerCase().includes(termo.toLowerCase()));
        },
        10_000,
        `todas as ofertas deveriam conter "${termo}"`,
      );
    });

    it('CT18 - Buscar um produto que não existe', async function () {
      await entrarEVerOfertas();
      await preencher(driver, CAMPO_BUSCA, 'xyzprodutoinexistente');

      await esperarTexto(driver, 'Nenhuma oferta encontrada');
      assert.equal((await driver.findElements(TITULOS_CARDS)).length, 0);
    });

    it('CT19 - Reservar uma oferta disponível e receber o código de retirada', async function () {
      await entrarEVerOfertas();

      // Abre as ofertas até achar uma que ainda tenha unidades disponíveis.
      const total = (await driver.findElements(TITULOS_CARDS)).length;
      let achou = false;
      for (let i = 0; i < total && !achou; i++) {
        const cards = await driver.findElements(TITULOS_CARDS);
        await cards[i].click();
        await esperarUrl(driver, '/oferta/');
        const botao = await esperar(
          driver,
          By.xpath("//button[.='Reservar agora' or .='Esgotado por enquanto']"),
        );
        if ((await botao.getText()) === 'Reservar agora') {
          await botao.click();
          achou = true;
        } else {
          await driver.findElement(By.linkText('← Voltar às ofertas')).click();
          await esperar(driver, TITULOS_CARDS);
        }
      }
      assert.ok(achou, 'nenhuma oferta disponível para reservar');

      await esperarUrl(driver, '/checkout');
      await clicarBotao(driver, 'Reservar pedido');

      await esperarTexto(driver, 'Pedido confirmado!');
      const codigo = await esperar(driver, By.css('p.select-all'));
      assert.match(
        await codigo.getText(),
        /^[A-HJKMNP-Z2-9]{8}$/,
        'código deveria ter 8 caracteres sem I, L, O, 0 ou 1',
      );
    });
  });

  describe('Controle de acesso', function () {
    it('CT20 - Abrir "Meus pedidos" sem estar logado', async function () {
      await driver.get(`${BASE_URL}/pedidos`);

      await esperarUrl(driver, '/login');
      await esperarTexto(driver, 'Que bom te ver');
    });
  });
});
