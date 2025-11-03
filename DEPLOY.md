# Deployment Guide for DistaHilar Backend

This guide provides instructions for deploying the DistaHilar backend application to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Cloudinary account (for file uploads)
- Environment variables configured

## Environment Variables

Copy the `env.example` file to `.env` and fill in the required values:

```bash
cp env.example .env
```

### Required Environment Variables

| Variable                   | Description                                    | Example                                                 |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string                   | `postgresql://user:password@localhost:5432/distanhilar` |
| `JWT_ACCESS_SECRET`        | Secret key for access tokens                   | Generate a secure random string                         |
| `JWT_REFRESH_SECRET`       | Secret key for refresh tokens                  | Generate a secure random string                         |
| `ACCESS_TOKEN_EXPIRES_IN`  | Access token expiration                        | `15m`                                                   |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration                       | `7d`                                                    |
| `EXPIRE_DAY_REFRESH_TOKEN` | Cookie expiration days                         | `7`                                                     |
| `REFRESH_TOKEN_NAME`       | Cookie name for refresh token                  | `refreshToken`                                          |
| `DOMAIN`                   | Domain for cookies (leave empty for localhost) | `example.com`                                           |
| `NODE_ENV`                 | Environment                                    | `production`                                            |
| `PORT`                     | Server port                                    | `9555`                                                  |
| `CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name                          | Your Cloudinary cloud name                              |
| `CLOUDINARY_API_KEY`       | Cloudinary API key                             | Your Cloudinary API key                                 |
| `CLOUDINARY_API_SECRET`    | Cloudinary API secret                          | Your Cloudinary secret                                  |
| `FRONTEND_URL`             | Frontend URL for CORS                          | `https://yourdomain.com`                                |

## Deployment Steps

### 1. Install Dependencies

```bash
npm ci --production
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migrations

```bash
npx prisma migrate deploy
```

Or if you need to push the schema:

```bash
npx prisma db push
```

### 4. Build the Application

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

### 5. Start the Application

#### Development

```bash
npm run start:dev
```

#### Production

```bash
npm run start:prod
```

The production start command runs `node dist/src/main`.

## Database Management

### Initial Setup

1. Create the database:

   ```bash
   createdb distanhilar
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Seed Database (Optional)

If you have seed files:

```bash
npm run seed
npm run seed2
```

### Access Prisma Studio (Development Only)

```bash
npm run prisma:studio
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secrets**: Use strong, randomly generated secrets
3. **Database**: Use secure passwords and restrict access
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure `FRONTEND_URL` properly to restrict CORS origins
6. **Cookies**: Set `DOMAIN` appropriately in production

## Production Checklist

- [ ] All environment variables are set
- [ ] Database is created and migrated
- [ ] JWT secrets are strong and unique
- [ ] `NODE_ENV=production` is set
- [ ] Frontend URL is configured correctly
- [ ] Cloudinary credentials are valid
- [ ] Database connection is secure
- [ ] Port is accessible (or mapped via reverse proxy)
- [ ] Application logs are monitored
- [ ] Backup strategy is in place

## Docker Deployment (Optional)

For detailed Docker deployment instructions, see [DOCKER.md](./DOCKER.md).

Quick start with Docker Compose:

```bash
# Start all services (database + backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

The `Dockerfile` and `docker-compose.yml` are already configured with:

- Multi-stage builds for optimized images
- Automatic database migrations
- Health checks
- Security best practices
- Production-ready configuration

## Process Management

For production deployments, use a process manager like PM2:

```bash
npm install -g pm2

pm2 start dist/src/main.js --name distanhilar-backend
pm2 save
pm2 startup
```

## Monitoring

- Application logs are available in the console
- Swagger API documentation is available at `/api` in development mode
- Monitor database connections and query performance
- Set up alerts for application errors

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure database server is running
- Check firewall settings
- Verify credentials

### JWT Token Issues

- Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Verify secrets haven't changed between restarts
- Check token expiration settings

### CORS Issues

- Verify `FRONTEND_URL` matches your frontend domain
- Check that credentials are enabled
- Ensure cookie domain is set correctly

### Port Already in Use

- Change `PORT` environment variable
- Or stop the process using the port

## Support

For issues or questions, refer to:

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
