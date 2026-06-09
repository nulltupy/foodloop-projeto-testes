import { z } from 'zod';

const PLACEHOLDER_JWT_SECRET = 'change-me-min-32-chars-random';

// Rejeita segredos manifestamente fracos: placeholders, "secret"/"password",
// runs de caracteres repetidos (aaaaa...), etc. Quem usar algo assim em prod
// vai cair aqui antes do server subir.
const WEAK_PATTERNS = [/change[-_ ]?me/i, /^(secret|password|test|dev)/i, /(.)\1{7,}/];

const EnvSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres')
    .refine((s) => s !== PLACEHOLDER_JWT_SECRET, {
      message: 'JWT_SECRET não pode usar o placeholder do .env.example',
    })
    // Denylist é gated em test: secrets de fixture deliberadamente começam com
    // "test-" e seriam barrados. Em dev/prod a verificação roda normalmente.
    .refine((s) => process.env.NODE_ENV === 'test' || !WEAK_PATTERNS.some((re) => re.test(s)), {
      message: 'JWT_SECRET parece um placeholder/segredo fraco',
    }),
  FRONT_URL: z.string().url().optional(),
  NODE_ENV: z.string().optional(),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).optional(),
});

const env = EnvSchema.parse({
  JWT_SECRET: process.env.JWT_SECRET,
  FRONT_URL: process.env.FRONT_URL,
  NODE_ENV: process.env.NODE_ENV,
  BCRYPT_COST: process.env.BCRYPT_COST,
});

// Em prod, FRONT_URL é obrigatório — senão o CORS cai no fallback de localhost
// e bloqueia tudo que vem do domínio real.
if (env.NODE_ENV === 'production' && !env.FRONT_URL) {
  throw new Error('FRONT_URL é obrigatório quando NODE_ENV=production');
}

// Cost 10 em prod, 4 em test (bcrypt sobe exponencialmente: cost 10 leva ~100ms,
// cost 4 leva ~1ms — em test suite com vários signups isso pesa).
const defaultBcryptCost = env.NODE_ENV === 'test' ? 4 : 10;

export const authConfig = {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: '7d' as const,
  jwtIssuer: 'foodloop',
  jwtAudience: 'foodloop-api',
  bcryptCost: env.BCRYPT_COST ?? defaultBcryptCost,
  frontUrl: env.FRONT_URL,
};
