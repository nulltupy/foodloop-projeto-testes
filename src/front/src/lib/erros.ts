// Lê o envelope de erro da API ({ error: { code, message } }) sem depender do
// tipo do axios — duck typing evita problemas com cópias do módulo no monorepo.

function corpoErro(e: unknown): { code?: string; message?: string } | undefined {
  return (e as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data
    ?.error;
}

export function codigoErro(e: unknown): string | undefined {
  return corpoErro(e)?.code;
}

export function statusErro(e: unknown): number | undefined {
  return (e as { response?: { status?: number } })?.response?.status;
}

export function mensagemErro(e: unknown, fallback: string): string {
  const msg = corpoErro(e)?.message;
  if (msg) return msg;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
