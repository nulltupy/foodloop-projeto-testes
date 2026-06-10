document.addEventListener('DOMContentLoaded', () => {
  const formSection = document.getElementById('form-section');
  const form = document.getElementById('onboarding-form');
  const confirmationSection = document.getElementById('confirmation-section');
  const alertBox = document.getElementById('alert-box');
  const enderecoNormalizadoDiv = document.getElementById('endereco-normalizado');
  const btnSubmit = document.getElementById('btn-submit');

  // Inputs
  const inputCep = document.getElementById('cep');
  const inputRua = document.getElementById('rua');
  const inputBairro = document.getElementById('bairro');
  const inputCidade = document.getElementById('cidade');
  const inputEstado = document.getElementById('estado');

  // 1. Tratamento do CEP e requisição ViaCEP
  inputCep.addEventListener('input', async (e) => {
    // Máscara 00000-000
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    e.target.value = value;

    const plainCep = value.replace(/\D/g, '');
    if (plainCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${plainCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          inputRua.value = data.logradouro;
          inputBairro.value = data.bairro;
          inputCidade.value = data.localidade;
          inputEstado.value = data.uf;
          document.getElementById('numero').focus();
          esconderAlerta();
        }
      } catch (error) {
        mostrarAlerta('Erro ao consultar o CEP. Tente novamente.');
      }
    }
  });

  // 2. Submit do Form (Mock da API de backend)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderAlerta();

    // Simula bloqueio de tela/loading
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = 'Processando...';
    btnSubmit.disabled = true;

    // Coleta dados ignorando lat/lng
    const payload = {
      cep: inputCep.value.replace(/\D/g, ''),
      rua: inputRua.value,
      numero: document.getElementById('numero').value,
      complemento: document.getElementById('complemento').value,
      bairro: inputBairro.value,
      cidade: inputCidade.value,
      estado: inputEstado.value,
    };

    // ----- INÍCIO DO MOCK (Substituir pela requisição real ao MSW/Backend) -----
    setTimeout(() => {
      btnSubmit.innerText = originalText;
      btnSubmit.disabled = false;

      // Simulação baseada no final do CEP digitado (Apenas para testes visuais)
      const lastDigit = payload.cep.slice(-1);

      if (lastDigit === '1') {
        // Simula erro 409
        mostrarAlerta('Você já tem estabelecimento cadastrado.');
      } else if (lastDigit === '2') {
        // Simula erro 422 - GEOCODING_FALHOU
        mostrarAlerta(
          'Não conseguimos localizar seu endereço. Verifique se rua, número e cidade estão corretos.',
        );
      } else {
        // Simula SUCESSO - Back retorna geocoding normalizado
        const endereco_normalizado = `${payload.rua}, ${payload.numero} - ${payload.bairro}, ${payload.cidade} - ${payload.estado}, CEP: ${inputCep.value}`;
        mostrarConfirmacao(endereco_normalizado);
      }
    }, 1000);
    // ----- FIM DO MOCK -----
  });

  // 3. Controle das telas (Confirmação vs Edição)
  document.getElementById('btn-edit').addEventListener('click', () => {
    confirmationSection.classList.add('hidden');
    formSection.classList.remove('hidden');
  });

  document.getElementById('btn-confirm').addEventListener('click', () => {
    // Redireciona para o dashboard ao confirmar (mock)
    alert('Endereço confirmado! Redirecionando para o Dashboard...');
    window.location.href = '/comerciante/dashboard'; // Ajuste para a rota real
  });

  // Utils
  function mostrarAlerta(mensagem) {
    alertBox.innerText = mensagem;
    alertBox.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function esconderAlerta() {
    alertBox.classList.add('hidden');
    alertBox.innerText = '';
  }

  function mostrarConfirmacao(endereco) {
    formSection.classList.add('hidden');
    enderecoNormalizadoDiv.innerText = endereco;
    confirmationSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
