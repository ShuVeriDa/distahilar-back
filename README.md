# DistaHilar — Backend (NestJS + Prisma)

English | [Русский ниже](#русский)

Looking for the web client? Check out the [DistaHilar Frontend](../front/README.md).

## Overview

DistaHilar Backend powers a modern, real‑time messaging experience inspired by Telegram. It provides authentication, chats, messages, reactions, media uploads, folders, contacts, and WebSocket gateways for live updates, plus WebRTC signaling for calls and live rooms.

This is a personal, non‑commercial project for learning purposes. Product and interface ideas are inspired by the Telegram application; all trademarks belong to their respective owners.

## Features

- Authentication with access/refresh tokens (JWT)
- Real‑time updates via Socket.IO gateways (users, chats, messages, folders)
- WebRTC signaling for 1:1 calls and live voice rooms
- Chats: dialogs, groups, channels; search and pagination
- Messages: text, image/video/audio/file, replies, pinning, read state, reactions
- Media uploads with Cloudinary (compression/optimization options)
- Contacts and folders (chat organization)
- Swagger API in development mode

## Tech Stack

- NestJS, TypeScript
- Prisma ORM, PostgreSQL
- Socket.IO (gateway + client support)
- Cloudinary (media storage/processing)
- Class‑validator, JWT, Argon2

## Architecture Diagram

```mermaid
flowchart LR
    Client[Next.js Frontend] -->|REST /api| Nest[NestJS Backend]
    Client -->|Socket.IO| Nest
    Nest -->|Prisma Client| Postgres[(PostgreSQL)]
    Nest --> Cloudinary[(Cloudinary Media Storage)]
    Nest --> WebRTCSignaling[[WebRTC Signaling]]
```

## Project Structure (high level)

- `auth` — auth controller/service, JWT strategy and guards
- `user` — user controller/service, status service, user WebSocket gateway
- `chat` — chat controller/service, WebSocket gateway
- `message` — message service/gateway (media, reactions, replies, read state)
- `file` — upload controller/service, Cloudinary integration
- `folder` — folders and related gateway
- `contact` — contacts
- `call` — WebRTC signaling (1:1 and live)
- `community`/`member` — channel and membership logic

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Environment

Create `.env` in `back/`:

```env
NODE_ENV=development
PORT=9555
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Install and run

```bash
npm install
npm run prisma:generate
npm run migrate:dev   # optional: if you use migrations
npm run start:dev
```

Server runs by default at `http://localhost:9555` with global prefix `/api`.

### API Docs

Swagger is available in non‑production mode at:

```
http://localhost:9555/api
```

### AsyncAPI (WebSocket spec)

- The Socket.IO/WS contract lives in `asyncapi.yaml`.
- Channels and operations are grouped into logical sections (Messaging, Chats & Folders, Calls, Live, Signaling) with inline comments for easier navigation.
- Open the file in [AsyncAPI Studio](https://studio.asyncapi.com/) or any v3.0 compatible tooling to explore schemas, payloads, and event flows.

## Production Notes

- Set `NODE_ENV=production` to disable Swagger.
- Ensure `DATABASE_URL` uses connection pooling for serverless platforms.
- Configure CORS using `FRONTEND_URL` and cookies if needed.

## License and Attribution

This repository is for educational purposes only. It is not affiliated with Telegram and is not intended for commercial use. Design and functionality are inspired by the Telegram application.

---

## Русский

### Описание

Backend DistaHilar — это сервер реального времени для современного мессенджера, вдохновлённого Telegram. Он обеспечивает аутентификацию, чаты и сообщения, реакции, загрузку медиа, папки и контакты, а также WebSocket‑шлюзы для живых обновлений и сигнальный слой WebRTC для звонков и «живых» комнат.

Это личный, некоммерческий проект для образовательных целей. Идеи дизайна и функционала вдохновлены приложением Telegram; все товарные знаки принадлежат их правообладателям.

### Функциональность

- Аутентификация на JWT (access/refresh)
- Обновления в реальном времени через Socket.IO (пользователи, чаты, сообщения, папки)
- Сигналинг WebRTC для 1:1 звонков и «живых» комнат
- Чаты: диалоги, группы, каналы; поиск и пагинация
- Сообщения: текст, изображение/видео/аудио/файл, ответы, закрепление, статус прочтения, реакции
- Загрузка медиа в Cloudinary (сжатие/оптимизация)
- Контакты и папки (организация чатов)
- Swagger‑документация в режиме разработки

### Технологии

- NestJS, TypeScript
- Prisma ORM, PostgreSQL
- Socket.IO (gateway + клиент)
- Cloudinary (хранение/обработка медиа)
- Class‑validator, JWT, Argon2

### Архитектура

```mermaid
flowchart LR
    Client[Next.js Frontend] -->|REST /api| Nest[NestJS Backend]
    Client -->|Socket.IO| Nest
    Nest -->|Prisma Client| Postgres[(PostgreSQL)]
    Nest --> Cloudinary[(Cloudinary Media Storage)]
    Nest --> WebRTCSignaling[[WebRTC Signaling]]
```

### Структура (крупными мазками)

- `auth` — аутентификация, JWT‑стратегия и guard’ы
- `user` — пользователи, статусы, WebSocket‑шлюз
- `chat` — чаты и их WebSocket‑шлюз
- `message` — сообщения/медиа/реакции/ответы/прочитано
- `file` — загрузка файлов, интеграция с Cloudinary
- `folder` — папки и соответствующий шлюз
- `contact` — контакты
- `call` — сигналинг WebRTC (1:1 и live)
- `community`/`member` — каналы и роли

### Быстрый старт

1. Установите зависимости:

```bash
npm install
```

2. Сгенерируйте Prisma‑клиент и примените схему:

```bash
npm run prisma:generate
npm run migrate:dev   # при использовании миграций
```

3. Запустите dev‑сервер:

```bash
npm run start:dev
```

Сервер доступен по адресу `http://localhost:9555`, глобальный префикс — `/api`.

### Переменные окружения

См. пример `.env` выше: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `FRONTEND_URL`, `PORT`, `NODE_ENV`.

### Продакшен

- `NODE_ENV=production` отключает Swagger.
- Для serverless используйте пул соединений в `DATABASE_URL`.
- Настройте CORS и cookie‑параметры согласно фронтенду.

### AsyncAPI (WebSocket-спецификация)

- Контракт Socket.IO/WS описан в файле `asyncapi.yaml`.
- Каналы и операции разбиты по тематическим секциям (Messaging, Chats & Folders, Calls, Live, Signaling) с поясняющими комментариями для удобной навигации.
- Откройте файл в [AsyncAPI Studio](https://studio.asyncapi.com/) или другом инструменте с поддержкой AsyncAPI 3.0, чтобы изучить схемы и события.

### Лицензия и атрибуция

Репозиторий предназначен только для обучения и не связан с Telegram. Проект не является коммерческим. Дизайн и функционал вдохновлены приложением Telegram.
