import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@foodloop/lib';
import type { UpdateUsuarioRequest } from '@foodloop/lib';
import { useAuthStore } from '../../auth/store';
import { mensagemErro } from '../../../lib/erros';

const telRegex = /^\+?[1-9]\d{1,14}$/;

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? '';
  const b = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (a + b).toUpperCase() || '?';
}

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
    return <div className="mx-auto m-4 h-64 max-w-lg animate-pulse rounded-2xl bg-canvas-line/60" />;
  }

  if (meQ.isError || !meQ.data) {
    return (
      <main className="mx-auto max-w-lg p-4">
        <div className="rounded-xl bg-danger-50 p-3 text-sm font-semibold text-danger-dark">
          Não foi possível carregar seu perfil.
        </div>
      </main>
    );
  }

  const me = meQ.data;

  return (
    <main className="mx-auto max-w-lg p-4 sm:p-6">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Meu perfil</h1>

      <div className="card mt-5 flex items-center gap-4 p-5">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-leaf-100"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-leaf text-xl font-bold text-white">
            {iniciaisDe(nome || me.nome)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-ink">{nome || me.nome}</p>
          <p className="truncate text-sm text-ink-mute">{me.email}</p>
          <span className="mt-1 inline-block rounded-full bg-leaf-50 px-2.5 py-0.5 text-xs font-bold text-leaf-dark">
            {me.tipo === 'comerciante' ? 'Comerciante' : 'Cliente'}
          </span>
        </div>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-extrabold text-ink">Dados de contato</h2>
        <form onSubmit={onSubmit} className="mt-3 grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-ink-soft">E-mail</label>
            <input
              type="email"
              value={me.email}
              disabled
              className="campo cursor-not-allowed bg-canvas text-ink-mute"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-ink-soft">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="campo"
              maxLength={120}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-ink-soft">Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="campo"
              placeholder="+5511999999999"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-ink-soft">URL da foto (opcional)</label>
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              className="campo"
              placeholder="https://..."
            />
          </div>

          {salvo && (
            <div className="rounded-xl bg-leaf-50 px-3 py-2 text-sm font-semibold text-leaf-dark">
              Perfil atualizado.
            </div>
          )}
          {erro && (
            <div
              role="alert"
              className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-dark"
            >
              {erro}
            </div>
          )}

          <button type="submit" disabled={salvar.isPending} className="btn btn-primary mt-1 w-full text-base">
            {salvar.isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </form>
      </section>
    </main>
  );
}
