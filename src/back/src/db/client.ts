import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';
import { logger } from '../shared/logger.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não definida');
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

/**
 * Abre a conexão com o banco. Chamar no boot do servidor.
 */
export async function connectDb(): Promise<void> {
  await prisma.$connect();
  logger.info('database connection opened');
}

/**
 * Fecha a conexão com o banco. Chamar em shutdown ou fim de script.
 */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  logger.info('database connection closed');
}

// Garante que a conexão é fechada quando o processo termina.
process.on('beforeExit', () => {
  void disconnectDb();
});
