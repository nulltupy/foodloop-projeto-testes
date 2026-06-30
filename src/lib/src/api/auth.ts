import { getApiClient } from './client.js';
import {
  AuthResponseSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterComercianteRequest,
  type RegisterRequest,
} from '../schemas/auth.js';
import { UsuarioSchema, type UpdateUsuarioRequest, type Usuario } from '../schemas/usuario.js';

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const r = await getApiClient().post('/api/v1/auth/register', data);
  return AuthResponseSchema.parse(r.data);
}

export async function registerComerciante(data: RegisterComercianteRequest): Promise<AuthResponse> {
  const r = await getApiClient().post('/api/v1/auth/register-comerciante', data);
  return AuthResponseSchema.parse(r.data);
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const r = await getApiClient().post('/api/v1/auth/login', data);
  return AuthResponseSchema.parse(r.data);
}

export async function getMe(): Promise<Usuario> {
  const r = await getApiClient().get('/api/v1/usuarios/me');
  return UsuarioSchema.parse(r.data);
}

export async function updateMe(data: UpdateUsuarioRequest): Promise<Usuario> {
  const r = await getApiClient().patch('/api/v1/usuarios/me', data);
  return UsuarioSchema.parse(r.data);
}
