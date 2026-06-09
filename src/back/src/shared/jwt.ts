import jwt from 'jsonwebtoken';

import { authConfig } from './config/auth.js';

export interface AccessTokenClaims {
  sub: string;
  tipo: 'cliente' | 'comerciante';
}

export interface VerifiedAccessToken extends AccessTokenClaims {
  exp: number;
}

export function signAccessToken(payload: AccessTokenClaims): string {
  return jwt.sign(payload, authConfig.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: authConfig.jwtExpiresIn,
    issuer: authConfig.jwtIssuer,
    audience: authConfig.jwtAudience,
  });
}

export function verifyAccessToken(token: string): VerifiedAccessToken {
  // Pin do algoritmo: sem isso, um token forjado com `alg: none` passaria.
  const decoded = jwt.verify(token, authConfig.jwtSecret, {
    algorithms: ['HS256'],
    issuer: authConfig.jwtIssuer,
    audience: authConfig.jwtAudience,
  });
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Token JWT mal-formado');
  }
  const { sub, tipo, exp } = decoded as {
    sub?: unknown;
    tipo?: unknown;
    exp?: unknown;
  };
  if (typeof sub !== 'string' || (tipo !== 'cliente' && tipo !== 'comerciante') || typeof exp !== 'number') {
    throw new Error('Claims do JWT inválidas');
  }
  return { sub, tipo, exp };
}
