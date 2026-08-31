import { PrismaClient } from '@prisma/client';

// Evita múltiplas instâncias do PrismaClient em desenvolvimento (hot reload) [1, 2]
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'], // Registra logs de queries e erros para facilitar o debug
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
