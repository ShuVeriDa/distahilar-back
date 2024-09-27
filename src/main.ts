import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // Установка префикса 'api' для всех маршрутов в приложении
  app.use(cookieParser()); // Подключение middleware для парсинга cookie
  app.enableCors({
    origin: ['http://localhost:3000'], // Установка разрешенного источника для CORS (доступ с этого домена)
    credentials: true, // Включение поддержки отправки cookie через CORS
    exposedHeaders: 'set-cookie', // Разрешение клиенту доступа к заголовку 'set-cookie' в ответе сервера
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, stopAtFirstError: true }), // Включение глобальной валидации данных: удаление невалидных полей (whitelist) и остановка на первой ошибке
  );

  await app.listen(9555);
}
bootstrap();
