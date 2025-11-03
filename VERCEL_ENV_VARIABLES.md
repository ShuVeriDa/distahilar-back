# Переменные окружения для Vercel

## Как добавить переменные в Vercel:

1. Откройте проект на vercel.com
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте следующие переменные:

---

## 🔴 КРИТИЧЕСКИ ВАЖНО: DATABASE_URL

**Проблема**: "Too many database connections" возникает из-за отсутствия connection pooling.

**Решение**: Используйте URL с connection pooling (обычно порт **6543** вместо 5432).

### Примеры для разных провайдеров:

#### Supabase (Рекомендуется)

```
Key: DATABASE_URL
Value: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

**Где найти**:

- Supabase Dashboard → Project Settings → Database → Connection Pooling
- Используйте "Session" или "Transaction" mode

#### Neon

```
Key: DATABASE_URL
Value: postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&connection_limit=1
```

#### Vercel Postgres

```
Key: DATABASE_URL
Value: (используйте POSTGRES_PRISMA_URL из Vercel Storage)
```

#### Railway с PgBouncer

```
Key: DATABASE_URL
Value: postgresql://user:password@host:6543/railway?pgbouncer=true&connection_limit=1
```

---

## Обязательные переменные:

| Key            | Value                                 | Description                           |
| -------------- | ------------------------------------- | ------------------------------------- |
| `DATABASE_URL` | `postgresql://...`                    | **С CONNECTION POOLING!** (порт 6543) |
| `NODE_ENV`     | `production`                          | Режим работы                          |
| `FRONTEND_URL` | `https://distahilar-front.vercel.app` | URL фронтенда                         |

---

## JWT Secrets (обязательно смените!):

| Key                  | Value                     | Description                |
| -------------------- | ------------------------- | -------------------------- |
| `JWT_ACCESS_SECRET`  | `your-secret-key-here`    | Секрет для access токенов  |
| `JWT_REFRESH_SECRET` | `another-secret-key-here` | Секрет для refresh токенов |

**Генерация секретов:**

```bash
# В терминале:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Cloudinary (если используется):

| Key                     | Value             |
| ----------------------- | ----------------- |
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` |
| `CLOUDINARY_API_KEY`    | `your-api-key`    |
| `CLOUDINARY_API_SECRET` | `your-api-secret` |

---

## Параметры DATABASE_URL:

Важные query параметры для serverless:

| Параметр           | Значение  | Описание                               |
| ------------------ | --------- | -------------------------------------- |
| `connection_limit` | `1`       | **КРИТИЧНО!** Ограничивает подключения |
| `pgbouncer`        | `true`    | Включает режим PgBouncer               |
| `pool_timeout`     | `20`      | Таймаут ожидания (секунды)             |
| `connect_timeout`  | `10`      | Таймаут подключения                    |
| `sslmode`          | `require` | Требует SSL соединение                 |

### Пример полного URL:

```
postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=1&pool_timeout=20&connect_timeout=10&sslmode=require
```

---

## Проверка после настройки:

1. Сохраните переменные в Vercel
2. Переделплойте проект: `vercel --prod`
3. Проверьте логи: `vercel logs`
4. Ошибка должна исчезнуть! ✅

---

## Для миграций (выполняйте локально):

Создайте `.env` файл локально с **прямым** подключением (порт 5432):

```env
# Без pooling для миграций
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Запустите миграции:

```bash
npx prisma migrate deploy
```

**Важно**: Миграции НЕЛЬЗЯ запускать через connection pooler!

---

## Troubleshooting:

### Если ошибка осталась:

1. **Проверьте порт**: должен быть **6543** (pooling), а не 5432
2. **Проверьте параметр**: `connection_limit=1` обязателен
3. **Проверьте провайдер**: у вас включен PgBouncer?
4. **Смотрите логи**: `vercel logs --follow`

### Как узнать pooling URL:

- **Supabase**: Settings → Database → Connection Pooling
- **Neon**: Dashboard → Connection Details (pooling включен по умолчанию)
- **Vercel Postgres**: Используйте `POSTGRES_PRISMA_URL` вместо `POSTGRES_URL`
- **Railway**: Добавьте PgBouncer как отдельный сервис

---

## Контакты для помощи:

Если проблема не решается:

1. Проверьте документацию вашего БД провайдера
2. Убедитесь, что используете connection pooling
3. Рассмотрите переход на Supabase или Neon (у них встроенный pooling)
