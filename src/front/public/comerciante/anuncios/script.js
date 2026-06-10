document.addEventListener('DOMContentLoaded', () => {
  // MOCK DATA (Simulando cache inicial do TanStack Query)
  let produtosCache = [
    {
      id: 1,
      nome: 'Marmita de Frango e Batata',
      descricao: 'Frango grelhado, purê de batata doce e brócolis',
      preco: 12.5,
      categoria: 'Lanches',
      ativo: true,
    },
    {
      id: 2,
      nome: 'Suco Natural de Limão 500ml',
      descricao: 'Suco natural feito na hora, sem açúcar adicionado',
      preco: 8.0,
      categoria: 'Bebidas',
      ativo: true,
    },
  ];

  let produtoIdParaDesativar = null;

  // Elementos do DOM
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  const productDialog = document.getElementById('product-dialog');
  const confirmDialog = document.getElementById('confirm-dialog');
  const form = document.getElementById('product-form');
  const modalTitle = document.getElementById('modal-title');

  // --- 1. RENDERIZADOR DE TELAS (Estado Vazio vs Grade) ---
  function renderLista() {
    grid.innerHTML = '';

    if (produtosCache.length === 0) {
      emptyState.classList.remove('hidden');
      grid.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    grid.classList.remove('hidden');

    produtosCache.forEach((prod) => {
      const card = document.createElement('div');
      card.className = `product-card ${prod.ativo ? '' : 'inactive'}`;
      card.innerHTML = `
        <div class="card-header-row">
          <h3 class="card-title">${prod.nome}</h3>
          <span class="badge ${prod.ativo ? '' : 'badge-inactive'}">${prod.ativo ? 'Ativo' : 'Inativo'}</span>
        </div>
        <p class="card-desc">${prod.descricao}</p>
        <div class="card-meta">
          <span class="price-tag">R$ ${prod.preco.toFixed(2).replace('.', ',')}</span>
          <div class="card-actions">
            <button class="btn-icon btn-edit" data-id="${prod.id}">Editar</button>
            ${prod.ativo ? `<button class="btn-icon btn-del" data-id="${prod.id}">Desativar</button>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // --- 2. VALIDAÇÃO DECLARATIVA (Estilo Esquema Zod) ---
  function validarForm(dados) {
    let erros = {};
    if (!dados.nome || dados.nome.trim().length < 3) erros.nome = true;
    if (isNaN(dados.preco) || dados.preco <= 0.1) erros.preco = true;
    return erros;
  }

  // --- 3. EVENTOS DE FLUXO ---
  document.getElementById('btn-novo-produto').addEventListener('click', () => abrirModal());
  document.getElementById('btn-empty-cta').addEventListener('click', () => abrirModal());
  document.getElementById('btn-close-modal').addEventListener('click', () => productDialog.close());
  document.getElementById('btn-close-confirm').addEventListener('click', () => confirmDialog.close());

  function abrirModal(id = null) {
    form.reset();
    document.getElementById('product-id').value = id || '';
    document.querySelectorAll('.error-msg').forEach((el) => el.classList.add('hidden'));
    document.querySelectorAll('input').forEach((el) => el.classList.remove('invalid'));

    if (id) {
      modalTitle.innerText = 'Editar Produto';
      const prod = produtosCache.find((p) => p.id === id);
      document.getElementById('nome').value = prod.nome;
      document.getElementById('descricao').value = prod.descricao;
      document.getElementById('preco_regular').value = prod.preco;
      document.getElementById('categoria').value = prod.categoria;
    } else {
      modalTitle.innerText = 'Novo Produto';
    }
    productDialog.showModal(); // Ativa nativamente focus trap e trava acessível
  }

  // Captura cliques nos botões dinâmicos de Editar/Desativar
  grid.addEventListener('click', (e) => {
    const id = parseInt(e.target.getAttribute('data-id'));
    if (!id) return;

    if (e.target.classList.contains('btn-edit')) {
      abrirModal(id);
    } else if (e.target.classList.contains('btn-del')) {
      produtoIdParaDesativar = id;
      confirmDialog.showModal();
    }
  });

  // Confirmação de desativação (Mutation Mock)
  document.getElementById('btn-confirm-deactivate').addEventListener('click', () => {
    produtosCache = produtosCache.map((p) => (p.id === produtoIdParaDesativar ? { ...p, ativo: false } : p));
    confirmDialog.close();
    renderLista();
  });

  // Submit do formulário com validação ativa
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const dadosForm = {
      id: document.getElementById('product-id').value,
      nome: document.getElementById('nome').value,
      descricao: document.getElementById('descricao').value,
      preco: parseFloat(document.getElementById('preco_regular').value),
      categoria: document.getElementById('categoria').value,
    };

    const erros = validarForm(dadosForm);

    // Renderiza erros visuais se houver falha no schema
    if (Object.keys(erros).length > 0) {
      if (erros.nome) {
        document.getElementById('nome').classList.add('invalid');
        document.getElementById('err-nome').classList.remove('hidden');
      }
      if (erros.preco) {
        document.getElementById('preco_regular').classList.add('invalid');
        document.getElementById('err-preco').classList.remove('hidden');
      }
      return;
    }

    // Fluxo de salvamento (Create / Update mutation cache matching)
    if (dadosForm.id) {
      produtosCache = produtosCache.map((p) =>
        p.id === parseInt(dadosForm.id) ? { ...p, ...dadosForm, id: p.id, ativo: p.ativo } : p,
      );
    } else {
      produtosCache.push({ ...dadosForm, id: Date.now(), ativo: true });
    }

    productDialog.close();
    renderLista();
  });

  // Inicialização da listagem
  renderLista();
});
