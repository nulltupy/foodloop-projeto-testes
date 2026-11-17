// Funções de apoio da suíte Selenium do FoodLoop.
//
// O front precisa estar rodando em modo e2e (npm run -w src/front dev:e2e).
// Nesse modo a API é simulada pelo MSW dentro do próprio navegador. Por isso,
// depois de entrar no sistema, os testes navegam CLICANDO nos links: um
// driver.get() recarrega a página e zera os dados simulados (usuários
// cadastrados, pedidos feitos etc.).

import fs from 'node:fs';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import chrome from 'selenium-webdriver/chrome.js';

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const ESPERA = 10_000;

// Usuários de demonstração que já vêm na base simulada do projeto.
export const CLIENTE_DEMO = { email: 'cliente@foodloop.dev', senha: 'senha123' };
export const COMERCIANTE_DEMO = { email: 'comerciante@foodloop.dev', senha: 'senha123' };

// Abre o navegador. Padrão: Edge (vem no Windows). Use BROWSER=chrome para o
// Chrome e HEADLESS=1 para rodar sem abrir a janela.
export async function abrirNavegador() {
  const navegador = process.env.BROWSER ?? 'MicrosoftEdge';
  // Bloqueia a geolocalização para o teste não travar no pop-up de permissão.
  const prefs = { 'profile.default_content_setting_values.geolocation': 2 };
  const args = ['--window-size=1280,900'];
  if (process.env.HEADLESS) args.push('--headless=new');

  const opcoesEdge = new edge.Options().addArguments(...args).setUserPreferences(prefs);
  const opcoesChrome = new chrome.Options().addArguments(...args).setUserPreferences(prefs);

  const builder = new Builder()
    .forBrowser(navegador === 'chrome' ? 'chrome' : 'MicrosoftEdge')
    .setEdgeOptions(opcoesEdge)
    .setChromeOptions(opcoesChrome);

  // Normalmente o Selenium Manager acha o driver sozinho. Se ele falhar (ex.:
  // pasta com caminho muito longo no Windows), informe o driver na mão:
  // DRIVER_PATH=C:\caminho\msedgedriver.exe
  if (process.env.DRIVER_PATH) {
    if (navegador === 'chrome') builder.setChromeService(new chrome.ServiceBuilder(process.env.DRIVER_PATH));
    else builder.setEdgeService(new edge.ServiceBuilder(process.env.DRIVER_PATH));
  }

  return builder.build();
}

// Espera um elemento aparecer e ficar visível.
export async function esperar(driver, seletor, tempo = ESPERA) {
  const el = await driver.wait(until.elementLocated(seletor), tempo);
  await driver.wait(until.elementIsVisible(el), tempo);
  return el;
}

// Espera algum texto aparecer em qualquer lugar da página.
export async function esperarTexto(driver, texto, tempo = ESPERA) {
  // Procura só dentro do <body> (o <title> da aba também tem textos da página).
  return esperar(
    driver,
    By.xpath(
      `//body//*[contains(normalize-space(.), ${xpathLiteral(texto)}) and not(*[contains(normalize-space(.), ${xpathLiteral(texto)})])]`,
    ),
    tempo,
  );
}

export async function esperarUrl(driver, trecho, tempo = ESPERA) {
  await driver.wait(until.urlContains(trecho), tempo);
  return driver.getCurrentUrl();
}

export async function preencher(driver, seletor, valor) {
  const campo = await esperar(driver, seletor);
  await campo.clear();
  await campo.sendKeys(valor);
}

// Clica em um botão pelo texto visível.
export async function clicarBotao(driver, texto) {
  const botao = await esperar(driver, By.xpath(`//button[normalize-space(.)=${xpathLiteral(texto)}]`));
  await driver.wait(until.elementIsEnabled(botao), ESPERA);
  await botao.click();
}

// Faz login pela tela, como um usuário faria.
export async function entrar(driver, { email, senha }) {
  await driver.get(`${BASE_URL}/login`);
  await preencher(driver, By.id('email'), email);
  await preencher(driver, By.id('senha'), senha);
  await clicarBotao(driver, 'Entrar');
}

// Gera um e-mail diferente a cada execução, para o cadastro não colidir.
export function emailUnico(prefixo = 'aluno') {
  return `${prefixo}.${Date.now()}@teste.dev`;
}

// Salva um print da tela em evidencias/<nome>.png (usado no relatório).
export async function salvarPrint(driver, nome) {
  const pasta = path.resolve('evidencias');
  fs.mkdirSync(pasta, { recursive: true });
  const imagem = await driver.takeScreenshot();
  fs.writeFileSync(path.join(pasta, `${nome}.png`), imagem, 'base64');
}

function xpathLiteral(texto) {
  if (!texto.includes("'")) return `'${texto}'`;
  return `concat('${texto.split("'").join(`', "'", '`)}')`;
}
