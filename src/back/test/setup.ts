import 'dotenv/config';

import { afterAll, beforeEach } from 'vitest';

import { disconnectDb, prisma } from '../src/db/client.js';

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE usuario RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await disconnectDb();
});
