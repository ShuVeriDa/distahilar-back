import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // Оптимизация для serverless
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Логирование только в development
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    // Подключаемся к БД только если еще не подключены
    await this.$connect();
  }

  async onModuleDestroy() {
    // Закрываем соединение при завершении
    await this.$disconnect();
  }

  // Метод для очистки idle connections в serverless среде
  async cleanupIdleConnections() {
    try {
      await this.$disconnect();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}
