document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('anuncio-form');
  const selectProduto = document.getElementById('produto');
  const displayPrecoRegular = document.getElementById('display-preco-regular');
  const inputPrecoPromo = document.getElementById('preco_promocional');
  const inputQuantidade = document.getElementById('quantidade');
  const btnSubmit = document.getElementById('btn-submit');
  const errorText = document.getElementById('price-error');
  const errorPrecoOrigSpan = document.getElementById('error-preco-orig');
  const inputPrazoRetirada = document.getElementById('prazo_retirada');

  // --- 1. SETUP DE DATA (Agora + 2 horas) ---
  function configurarDataPadrao() {
    const dataAtual = new Date();
    dataAtual.setHours(dataAtual.getHours() + 2);
    const tzOffset = dataAtual.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dataAtual - tzOffset).toISOString().slice(0, 16);

    inputPrazoRetirada.value = localISOTime;
    inputPrazoRetirada.min = new Date(new Date() - tzOffset).toISOString().slice(0, 16);
  }
  configurarDataPadrao();

  // --- 2. EXTRATOR DE PREÇO ROBUSTO ---
  function getPrecoOriginal() {
    const option = selectProduto.options[selectProduto.selectedIndex];

    // Se não houver opção selecionada ou for o placeholder vazio
    if (!option || !option.value) return 0;

    // Puxa o valor do atributo, com fallback para "0" caso ele não exista
    const rawPreco = option.getAttribute('data-preco') || '0';

    // Substitui vírgula por ponto (caso o HTML tenha sido escrito com vírgula) e converte
    const preco = parseFloat(rawPreco.replace(',', '.'));

    return isNaN(preco) ? 0 : preco;
  }

  // --- 3. EVENTO: MUDANÇA DE PRODUTO ---
  selectProduto.addEventListener('change', () => {
    const preco = getPrecoOriginal();

    if (preco > 0) {
      displayPrecoRegular.innerText = `R$ ${preco.toFixed(2).replace('.', ',')}`;
      errorPrecoOrigSpan.innerText = preco.toFixed(2).replace('.', ',');
    } else {
      displayPrecoRegular.innerText = 'R$ 20,00';
      errorPrecoOrigSpan.innerText = '20,00';
    }

    // Limpa o input promocional para obrigar nova validação e recalcular tudo
    inputPrecoPromo.value = '';
    validarFormulario();
  });

  // --- 4. EVENTOS: BOTÕES DE DESCONTO ---
  document.querySelectorAll('.btn-discount').forEach((btn) => {
    btn.addEventListener('click', () => {
      const precoOriginal = getPrecoOriginal();

      if (precoOriginal <= 0) {
        alert('Selecione um produto na lista primeiro.');
        selectProduto.focus();
        return;
      }

      const discountPercentage = parseFloat(btn.getAttribute('data-discount'));
      const novoPreco = precoOriginal * (1 - discountPercentage);

      inputPrecoPromo.value = novoPreco.toFixed(2);
      validarFormulario();
    });
  });

  // --- 5. VALIDAÇÃO EM TEMPO REAL ---
  function validarFormulario() {
    const precoOriginal = getPrecoOriginal();
    const precoPromocional = parseFloat(inputPrecoPromo.value.replace(',', '.'));
    const quantidade = parseInt(inputQuantidade.value, 10);

    let isValid = true;

    // (A) Produto selecionado
    if (precoOriginal <= 0) {
      isValid = false;
    }
    // (B) Preço promocional ESTRITAMENTE MENOR que o original
    else if (isNaN(precoPromocional) || inputPrecoPromo.value.trim() === '') {
      isValid = false;
      inputPrecoPromo.classList.remove('invalid');
      errorText.classList.add('hidden');
    } else if (precoPromocional >= precoOriginal) {
      isValid = false;
      inputPrecoPromo.classList.add('invalid');
      errorText.classList.remove('hidden');
    } else {
      // Se passou em tudo, remove os alertas visuais
      inputPrecoPromo.classList.remove('invalid');
      errorText.classList.add('hidden');
    }

    // (C) Quantidade >= 1
    if (isNaN(quantidade) || quantidade < 1) {
      isValid = false;
    }

    // Libera ou bloqueia o botão de envio
    btnSubmit.disabled = !isValid;
  }

  inputPrecoPromo.addEventListener('input', validarFormulario);
  inputQuantidade.addEventListener('input', validarFormulario);

  // --- 6. SUBMIT ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    btnSubmit.innerText = 'Publicando...';
    btnSubmit.disabled = true;

    setTimeout(() => {
      alert('Anúncio criado com sucesso!');
      window.location.href = '/comerciante/anuncios';
    }, 800);
  });
});
