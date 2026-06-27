import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { UpdateUsuarioRequest } from '@foodloop/lib';
import { useAuthStore } from '../../auth/store';
import { mensagemErro } from '../../../lib/erros';

const campo = 'mt-1 w-full rounded-md border border-surface-300 px-3 py-2 text-base';
const telRegex = /^\+?[1-9]\d{1,14}$/;

export function Perfil() {
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ['usuario-me'], queryFn: () => api.auth.getMe() });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  // Preenche o formulário quando os dados do usuário chegam.
  useEffect(() => {
    const me = meQ.data;
    if (me) {
      setNome(me.nome);
      setTelefone(me.telefone ?? '');
      setFotoUrl(me.foto_url ?? '');
    }
  }, [meQ.data]);

  const salvar = useMutation({
    mutationFn: (data: UpdateUsuarioRequest) => api.auth.updateMe(data),
    onSuccess: (me) => {
      setErro(null);
      setSalvo(true);
      // Reflete o novo nome no header (iniciais/menu) sem refazer login.
      useAuthStore.setState((s) => (s.usuario ? { usuario: { ...s.usuario, nome: me.nome } } : {}));
      void qc.invalidateQueries({ queryKey: ['usuario-me'] });
    },
    onError: (e) => {
      setSalvo(false);
      setErro(mensagemErro(e, 'Não foi possível salvar o perfil'));
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvo(false);
    if (nome.trim().length < 2) {
      setErro('Informe um nome com pelo menos 2 caracteres');
      return;
    }
    if (telefone.trim() && !telRegex.test(telefone.trim())) {
      setErro('Telefone inválido (use o formato +55DDDNUMERO)');
      return;
    }
    if (fotoUrl.trim() && !/^https?:\/\//i.test(fotoUrl.trim())) {
      setErro('URL da foto inválida');
      return;
    }
    setErro(null);
    const data: UpdateUsuarioRequest = { nome: nome.trim() };
    if (telefone.trim()) data.telefone = telefone.trim();
    if (fotoUrl.trim()) data.foto_url = fotoUrl.trim();
    salvar.mutate(data);
  }

  if (meQ.isLoading) {
    return <div className="mx-auto m-4 h-64 max-w-lg animate-pulse rounded-lg bg-surface-100" />;
  }

  if (meQ.isError || !meQ.data) {
    return (
      <main className="mx-auto max-w-lg p-4">
        <div className="rounded-md bg-danger-500/10 p-3 text-sm text-danger-600">
          Não foi possível carregar seu perfil.
        </div>
      </main>
    );
  }

  const me = meQ.data;

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-semibold text-brand-700">Meu perfil</h1>
      <p className="mt-1 text-sm text-ink-500">Atualize seus dados de contato.</p>

      <section className="mt-6 rounded-lg border border-surface-200 bg-white p-4">
        <form onSubmit={onSubmit} className="grid gap-3">
          <label className="text-sm">
            E-mail
            <input
              type="email"
              value={me.email}
              disabled
              className={`${campo} bg-surface-100 text-ink-500`}
            />
          </label>

          <label className="text-sm">
            Nome
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={campo}
              maxLength={120}
              required
            />
          </label>

          <label className="text-sm">
            Telefone
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className={campo}
              placeholder="+5511999999999"
            />
          </label>

          <label className="text-sm">
            URL da foto (opcional)
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              className={campo}
              placeholder="https://..."
            />
          </label>

          {salvo && (
            <div className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">Perfil atualizado.</div>
          )}
          {erro && (
            <div role="alert" className="rounded-md bg-danger-500/10 px-3 py-2 text-sm text-danger-600">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={salvar.isPending}
            className="min-h-11 rounded-lg bg-brand-700 px-4 font-medium text-white disabled:opacity-60"
          >
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
      </section>
    </main>
  );
}
