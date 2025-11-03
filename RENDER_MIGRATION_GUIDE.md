# Миграции Prisma для Render.com

## Проблема

```
The table `public.users` does not exist in the current database.
```

База данных пустая, нужно создать таблицы.

---

## Решение: Применение миграций

### Шаг 1: Получите Database URL от Render.com

1. Откройте [Render.com Dashboard](https://dashboard.render.com/)
2. Найдите ваш PostgreSQL сервис
3. Перейдите в **Info** или **Connect**
4. Скопируйте **External Database URL**

Формат URL:

```
postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/dbname
```

Пример:

```
postgresql://distahilar_user:Abc123XYZ456@dpg-cm1abc2xyz-a.oregon-postgres.render.com/distahilar_db
```

---

### Шаг 2: Создайте локальный .env для миграций

В папке `back/` создайте файл `.env.migration`:

```env
DATABASE_URL="postgresql://ваш-user:ваш-password@dpg-xxxxx.oregon-postgres.render.com/ваша-db"
```

⚠️ **ВАЖНО**: Добавьте `.env.migration` в `.gitignore`!

---

### Шаг 3: Примените миграции

**Вариант 1: Локально (рекомендуется для первого раза)**

Откройте терминал в папке `back/`:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://ваш-user:ваш-password@dpg-xxxxx.oregon-postgres.render.com/ваша-db"
npm run migrate:deploy

# Linux/Mac
export DATABASE_URL="postgresql://ваш-user:ваш-password@dpg-xxxxx.oregon-postgres.render.com/ваша-db"
npm run migrate:deploy
```

**Вариант 2: Через Render.com Shell**

1. Откройте ваш Web Service на Render.com
2. Перейдите в **Shell**
3. Выполните:
```bash
npm run migrate:deploy
```

**Вариант 3: Автоматически при деплое**

Настройте Post Deploy Command в Render.com:
- Settings → Build & Deploy → Post Deploy Command: `npm run migrate:deploy`

Это автоматически применит миграции после каждого успешного деплоя.

Если `dotenv-cli` не установлен:

```bash
npm install -g dotenv-cli
```

**Альтернатива** - временно переименуйте файл:

```bash
# Windows PowerShell
mv .env .env.backup
mv .env.migration .env
npx prisma migrate deploy
mv .env .env.migration
mv .env.backup .env

# Linux/Mac
mv .env .env.backup && mv .env.migration .env && npx prisma migrate deploy && mv .env .env.migration && mv .env.backup .env
```

---

### Шаг 4: Проверьте создание таблиц

```bash
npx dotenv -e .env.migration -- npx prisma studio
```

Или используйте Render.com Dashboard:

- Ваш PostgreSQL сервис → Shell
- Выполните: `\dt` (список таблиц)

Вы должны увидеть:

- users
- chats
- messages
- и другие таблицы из schema.prisma

---

### Шаг 5: Настройте Vercel Environment Variables

Теперь добавьте DATABASE_URL в Vercel:

1. Откройте [Vercel Dashboard](https://vercel.com/)
2. Ваш проект → **Settings** → **Environment Variables**
3. Добавьте или обновите:

```
Key: DATABASE_URL
Value: postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/dbname?connection_limit=1
```

**Для Render.com добавьте параметры:**

```
?connection_limit=1&pool_timeout=20&connect_timeout=10
```

**Полный пример:**

```
postgresql://distahilar_user:Abc123@dpg-cm1abc-a.oregon-postgres.render.com/distahilar_db?connection_limit=1&pool_timeout=20&connect_timeout=10
```

---

### Шаг 6: Переделплойте Vercel

```bash
git add .
git commit -m "docs: add render migration guide"
git push
```

Или в Vercel Dashboard:

- Deployments → последний деплой → **Redeploy**

---

## Важные заметки для Render.com

### Connection Pooling

Render.com использует встроенный connection pooling на **порту 5432** (стандартный PostgreSQL порт).

В отличие от Supabase (порт 6543), Render **не требует** отдельного pooling порта.

### Параметры подключения

Обязательные параметры для Vercel Serverless:

| Параметр           | Значение | Описание                              |
| ------------------ | -------- | ------------------------------------- |
| `connection_limit` | `1`      | **КРИТИЧНО!** Ограничение подключений |
| `pool_timeout`     | `20`     | Таймаут ожидания (секунды)            |
| `connect_timeout`  | `10`     | Таймаут подключения                   |

### Пример DATABASE_URL для Vercel:

```
postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/dbname?connection_limit=1&pool_timeout=20&connect_timeout=10
```

---

## Troubleshooting

### Ошибка: "password authentication failed"

- Проверьте правильность пароля в URL
- Используйте URL encoding для специальных символов в пароле:
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`
  - `?` → `%3F`

### Ошибка: "connection timeout"

- Убедитесь, что используете **External Database URL**, а не Internal
- Проверьте, что ваш IP не заблокирован (Render обычно разрешает все IP)

### Ошибка: "database does not exist"

- Проверьте правильность имени базы данных в URL
- Убедитесь, что база данных создана в Render Dashboard

### Таблицы не создаются

```bash
# Проверьте статус миграций
npx prisma migrate status

# Создайте миграцию заново
npx prisma migrate dev --name init --create-only

# Примените миграцию
npx prisma migrate deploy
```

---

## Альтернатива: Запуск миграций из Vercel Build

Не рекомендуется, но возможно:

1. Добавьте в `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && nest build"
  }
}
```

2. Vercel автоматически применит миграции при деплое

⚠️ **Недостатки:**

- Увеличивает время деплоя
- Может конфликтовать с параллельными деплоями
- Лучше применять миграции вручную локально

---

## Проверка после настройки

1. Миграции применены: ✅
2. Таблицы созданы в Render.com: ✅
3. DATABASE_URL обновлен в Vercel: ✅
4. Проект переделплоен: ✅
5. Регистрация работает: ✅

Попробуйте зарегистрировать пользователя на фронтенде!
