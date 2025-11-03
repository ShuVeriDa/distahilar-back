import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import express from 'express';
import { AppModule } from '../src/app.module';

let cachedApp: any;
let isInitializing = false;

async function createApp() {
  // Если приложение уже кэшировано, возвращаем его
  if (cachedApp) {
    return cachedApp;
  }

  // Предотвращаем параллельную инициализацию
  if (isInitializing) {
    // Ждем завершения инициализации
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return cachedApp;
  }

  try {
    isInitializing = true;

    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter, {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn']
          : ['log', 'error', 'warn', 'debug'],
      abortOnError: false, // Не прерывать при ошибках в serverless
    });

    const configService = app.get(ConfigService);

    const frontendUrl =
      configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const nodeEnv = configService.get('NODE_ENV') || 'production';

    // CORS is handled manually in the handler function
    // to avoid conflicts with Vercel serverless functions

    app.setGlobalPrefix('api');
    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, stopAtFirstError: true }),
    );

    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('DistaHilar')
        .setDescription('The DistaHilar API description')
        .setVersion('1.0')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);
    }

    await app.init();
    cachedApp = expressApp;

    // Установка таймаута для очистки неактивного соединения
    // В serverless среде это поможет избежать утечек памяти
    if (nodeEnv === 'production') {
      // Через 5 минут неактивности сбрасываем кэш
      setTimeout(
        () => {
          cachedApp = null;
        },
        5 * 60 * 1000,
      );
    }

    return expressApp;
  } finally {
    isInitializing = false;
  }
}

export default async function handler(req: Request, res: Response) {
  const origin = req.headers.origin;
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = [
    frontendUrl,
    'https://distahilar-front.vercel.app',
    'http://localhost:3000',
  ].filter(Boolean); // Remove undefined values

  // Set CORS headers for all requests from allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight OPTIONS request explicitly before app initialization
  if (req.method === 'OPTIONS') {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      );
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
    // If origin is not allowed, return 403
    return res.status(403).json({ error: 'Origin not allowed by CORS' });
  }

  const app = await createApp();
  return app(req, res);
}
