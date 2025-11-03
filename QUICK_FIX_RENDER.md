# ⚡ Быстрое решение для Render.com

## 🔴 Проблема

```
The table `public.users` does not exist in the current database.
```

**Причина**: Миграции Prisma не применены, таблицы не созданы.

---

## ✅ Решение (5 минут)

### Шаг 1: Получите Database URL

1. Откройте [Render.com Dashboard](https://dashboard.render.com/)
2. Найдите ваш **PostgreSQL** сервис
3. Во вкладке **Info** или **Connect** скопируйте **External Database URL**

Формат:

```
postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/dbname
```

---

### Шаг 2: Примените миграции локально

Откройте терминал в папке `back/`:

**Вариант 1: Через временный .env**

```bash
# Создайте временный файл
echo DATABASE_URL="postgresql://ваш-url-от-render" > .env.temp

# Windows PowerShell:
$env:DATABASE_URL="postgresql://ваш-url-от-render"
npx prisma migrate deploy

# Linux/Mac:
export DATABASE_URL="postgresql://ваш-url-от-render"
npx prisma migrate deploy
```

**Вариант 2: Напрямую в команде**

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/db"; npx prisma migrate deploy

# Linux/Mac
DATABASE_URL="postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/db" npx prisma migrate deploy
```

**Если миграций нет, создайте первую:**

```bash
npx prisma migrate dev --name init
```

---

### Шаг 3: Обновите DATABASE_URL в Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/)
2. Ваш проект → **Settings** → **Environment Variables**
3. Найдите `DATABASE_URL` и обновите на:

```
postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/db?connection_limit=1&pool_timeout=20&connect_timeout=10
```

**Важно**: Добавьте query параметры для serverless!

---

### Шаг 4: Переделплойте

```bash
git add .
git commit -m "docs: render migration guide"
git push
```

Или в Vercel: **Deployments** → **Redeploy**

---

## ✅ Проверка

1. Миграции успешно применены (видите "Your database is now in sync")
2. DATABASE_URL обновлен в Vercel с параметрами
3. Проект переделплоен
4. Ошибка исчезла! ✅

---

## 💡 Быстрый способ (если спешите)

```bash
# В папке back/ выполните:
cd F:\programming\DistaHilar\back

# Установите переменную окружения
$env:DATABASE_URL="postgresql://ВСТАВЬТЕ_ВАШ_URL_ОТ_RENDER"

# Примените миграции
npx prisma migrate deploy

# Проверьте таблицы
npx prisma studio
```

Затем обновите DATABASE_URL в Vercel и переделплойте.

---

## 🆘 Если не работает

См. подробную инструкцию: **RENDER_MIGRATION_GUIDE.md**

Основные причины ошибок:

1. Неправильный пароль в URL
2. Используется Internal URL вместо External
3. Не добавлены параметры `connection_limit` и др. в Vercel

---

## Пример готового DATABASE_URL для Vercel:

```
postgresql://distahilar_user:Abc123XYZ@dpg-cm1abc2xyz-a.oregon-postgres.render.com/distahilar_db?connection_limit=1&pool_timeout=20&connect_timeout=10
```

**Компоненты:**

- `distahilar_user` - username
- `Abc123XYZ` - password
- `dpg-cm1abc2xyz-a.oregon-postgres.render.com` - host
- `distahilar_db` - database name
- `?connection_limit=1&...` - параметры для serverless
