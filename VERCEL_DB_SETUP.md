# Настройка Database для Vercel Serverless

## Проблема: "Too many database connections"

В serverless-среде каждый запрос может создавать новое подключение к БД. Это быстро исчерпывает лимит подключений PostgreSQL.

## Решение 1: Connection Pooling через PgBouncer (Рекомендуется)

### Использование Supabase / Neon / Railway

Эти провайдеры предоставляют встроенный connection pooling:

1. **Supabase**: Используйте "Connection pooling" URL вместо "Direct connection"
2. **Neon**: Connection pooling включен по умолчанию
3. **Railway**: Добавьте PgBouncer как отдельный сервис

### Настройка DATABASE_URL в Vercel

В настройках проекта Vercel (Settings → Environment Variables):

```bash
# Основной URL с connection pooling
DATABASE_URL="postgresql://user:password@host:6543/db?pgbouncer=true&connection_limit=1"

# Для миграций (прямое подключение без pooling)
DATABASE_URL_UNPOOLED="postgresql://user:password@host:5432/db"
```

### Важные параметры для Serverless:

```
?connection_limit=1          # Максимум 1 подключение на serverless instance
&pool_timeout=20             # Таймаут ожидания свободного подключения (секунды)
&connect_timeout=10          # Таймаут подключения к БД
&pgbouncer=true              # Включение режима PgBouncer (для некоторых провайдеров)
```

## Решение 2: Prisma Data Proxy (Альтернатива)

Используйте Prisma Accelerate для управления подключениями:

```bash
npm install @prisma/extension-accelerate
```

В `schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

## Решение 3: Оптимизация существующего подключения

### Обновите DATABASE_URL в Vercel:

```bash
# Пример для Supabase
DATABASE_URL="postgresql://user:password@db.project.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"

# Пример для обычного PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=1&pool_timeout=20"
```

### Переменные окружения в Vercel:

```bash
DATABASE_URL=postgresql://user:password@host:6543/db?pgbouncer=true&connection_limit=1
NODE_ENV=production
FRONTEND_URL=https://distahilar-front.vercel.app
```

## Проверка конфигурации

После деплоя проверьте логи Vercel:

```bash
vercel logs <deployment-url>
```

## Дополнительные рекомендации

1. **Используйте Connection Pooler** - это критично для serverless
2. **Ограничьте подключения** - `connection_limit=1` для каждого instance
3. **Мониторьте подключения** - используйте dashboard вашего БД провайдера
4. **Миграции** - запускайте с прямым подключением (без pooling)

## Настройка для разных провайдеров

### Supabase

```
# Pooling URL (для приложения)
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

# Direct URL (для миграций)
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Neon

```
# Pooling включен по умолчанию на порте 5432
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Vercel Postgres

```
# Connection pooling встроен
POSTGRES_PRISMA_URL="postgresql://user:password@host/db?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host/db?sslmode=require"
```

## Troubleshooting

### Если ошибка все еще возникает:

1. Проверьте количество активных подключений в БД:

```sql
SELECT count(*) FROM pg_stat_activity;
```

2. Увеличьте max_connections в PostgreSQL (если у вас есть доступ)

3. Используйте Prisma Accelerate для автоматического управления подключениями

4. Рассмотрите миграцию на провайдера с встроенным pooling (Supabase, Neon, Vercel Postgres)
