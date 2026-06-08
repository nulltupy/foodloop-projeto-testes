import { disconnectDb } from '../src/db/client.js';
import { logger } from '../src/shared/logger.js';

async function main(): Promise<void> {
  logger.info('seed vazio; preenchimento real virá nos cards de demo');
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, 'seed falhou');
    process.exit(1);
  })
  .finally(() => {
    void disconnectDb();
  });
