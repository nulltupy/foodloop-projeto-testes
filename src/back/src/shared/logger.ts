import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // serializers padrão do pino sabem extrair `err.stack`, headers/url/method
  // de req — sem isso, um `{ err }` vira "[object Object]" no log estruturado.
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
  },
  base: {
    service: 'foodloop-back',
    env: process.env.NODE_ENV ?? 'development',
  },
});
