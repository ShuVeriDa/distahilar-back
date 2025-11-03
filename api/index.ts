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

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter);
  const configService = app.get(ConfigService);

  const frontendUrl =
    configService.get('FRONTEND_URL') || 'http://localhost:3000';
  const nodeEnv = configService.get('NODE_ENV') || 'production';

  // Configure CORS before setting global prefix
  const allowedOrigins = [
    frontendUrl,
    'https://distahilar-front.vercel.app',
    'http://localhost:3000',
  ].filter(Boolean); // Remove any undefined values

  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      // or if origin is in the allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['set-cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

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

  return expressApp;
}

export default async function handler(req: Request, res: Response) {
  // Handle preflight OPTIONS request explicitly before app initialization
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const frontendUrl = process.env.FRONTEND_URL;
    const allowedOrigins = [
      frontendUrl,
      'https://distahilar-front.vercel.app',
      'http://localhost:3000',
    ].filter(Boolean); // Remove undefined values

    // For credentials: true, we must return the exact origin or reject
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }

    // If origin is not allowed, return 403
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const app = await createApp();
  return app(req, res);
}
