import axios, { type AxiosInstance } from 'axios';

export interface CreateApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  onUnauthorized?: () => void;
}

export function createApiClient(opts: CreateApiClientOptions): AxiosInstance {
  const c = axios.create({ baseURL: opts.baseUrl, timeout: 10_000 });
  c.interceptors.request.use((cfg) => {
    const t = opts.getToken?.();
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  c.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) opts.onUnauthorized?.();
      return Promise.reject(err);
    },
  );
  return c;
}

let _client: AxiosInstance | null = null;

export function setApiClient(c: AxiosInstance): void {
  _client = c;
}

export function getApiClient(): AxiosInstance {
  if (!_client) throw new Error('API client não inicializado; chame setApiClient primeiro');
  return _client;
}
