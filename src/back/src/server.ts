import 'dotenv/config';

import { buildApp } from './app.js';
import { connectDb, disconnectDb } from './db/client.js';
import './shared/config/auth.js'; // validação de JWT_SECRET no boot
import { logger } from './shared/logger.js';

const port = Number(process.env.PORT ?? 3000);

void connectDb()
  .then(() => {
    const app = buildApp();
    const server = app.listen(port, () => {
      logger.info({ port }, 'FoodLoop back rodando');
    });

    // Graceful shutdown: fechar o servidor HTTP (deixa requests em voo terminarem)
    // antes de derrubar a conexão com o banco.
    const shutdown = (signal: string) => {
      logger.info({ signal }, 'shutdown iniciado');
      server.close((err) => {
        if (err) {
          logger.error({ err }, 'erro ao fechar servidor HTTP');
        }
        void disconnectDb()
          .catch((dbErr: unknown) => {
            logger.error({ err: dbErr }, 'erro ao fechar conexão com o banco');
          })
          .finally(() => {
            process.exit(err ? 1 : 0);
          });
      });

      // Timeout duro: se em 10s não fechou, mata o processo. Render/K8s geralmente
      // dão ~15s antes de SIGKILL, então 10s deixa margem pro orquestrador.
      setTimeout(() => {
        logger.warn('shutdown timeout — forçando saída');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err: unknown) => {
    logger.error({ err }, 'falha ao iniciar back');
    process.exit(1);
  });
