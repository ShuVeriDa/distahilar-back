# Docker Deployment Guide

This guide explains how to deploy the DistaHilar backend using Docker.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed

## Quick Start

### Using Docker Compose (Recommended)

1. **Update environment variables** in `docker-compose.yml` or create a `.env` file:

   ```bash
   cp env.example .env
   # Edit .env with your production values
   ```

2. **Start all services** (database + backend):

   ```bash
   docker-compose up -d
   ```

3. **View logs**:

   ```bash
   docker-compose logs -f backend
   ```

4. **Stop all services**:
   ```bash
   docker-compose down
   ```

### Using Docker only

1. **Build the image**:

   ```bash
   docker build -t distanhilar-backend .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name distanhilar-backend \
     -p 9555:9555 \
     --env-file .env \
     distanhilar-backend
   ```

## Docker Compose Configuration

The `docker-compose.yml` includes:

- **PostgreSQL database** (port 5432)
- **Backend API** (port 9555)
- **Automatic migrations** on startup
- **Volume persistence** for database and uploads
- **Health checks** for both services
- **Network isolation** between services

## Environment Variables

For Docker Compose, you can either:

**Option 1**: Set variables directly in `docker-compose.yml`

**Option 2**: Use environment file (recommended for production):

```yaml
backend:
  env_file:
    - .env
```

Then update your `.env` file with all required variables.

## Database Migrations

Migrations run automatically on container startup via the command:

```bash
npx prisma migrate deploy && node dist/src/main
```

For manual migrations:

```bash
docker-compose exec backend npx prisma migrate deploy
```

## Useful Docker Commands

### View running containers

```bash
docker-compose ps
```

### View logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs postgres

# Follow logs
docker-compose logs -f backend
```

### Execute commands in container

```bash
# Access shell
docker-compose exec backend sh

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate status
```

### Restart services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Clean up

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### Rebuild after code changes

```bash
# Rebuild and restart
docker-compose up -d --build
```

## Production Deployment

### 1. Security Hardening

Update `docker-compose.yml` for production:

```yaml
backend:
  environment:
    POSTGRES_PASSWORD: ${DB_PASSWORD} # Use strong password
    DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/distanhilar
```

### 2. Reverse Proxy

Add nginx service to `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - '80:80'
    - '443:443'
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
    - ./ssl:/etc/nginx/ssl
  depends_on:
    - backend
  networks:
    - distanhilar-network
```

### 3. SSL/TLS Certificates

Mount SSL certificates in nginx volume.

### 4. Resource Limits

Add resource limits to containers:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### 5. Monitoring

Add health checks (already included):

- Backend: HTTP check on `/api`
- Postgres: `pg_isready` check

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check if port is in use
netstat -tuln | grep 9555

# Verify environment variables
docker-compose config
```

### Database connection errors

```bash
# Check if postgres is healthy
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify DATABASE_URL
docker-compose exec backend printenv DATABASE_URL
```

### Build failures

```bash
# Clean build cache
docker-compose build --no-cache

# Check disk space
docker system df
```

### Permission issues

```bash
# Fix uploads directory permissions
sudo chown -R 1001:1001 uploads

# Or make it writable
chmod -R 777 uploads
```

## Development with Docker

For development, mount source code:

```yaml
backend:
  volumes:
    - ./src:/app/src
    - ./uploads:/app/uploads
  command: npm run start:dev
```

Or use Docker Compose override file:

```bash
# Create docker-compose.override.yml
docker-compose up
```

## Advanced Configuration

### Multi-stage builds

The Dockerfile uses multi-stage builds for:

- Smaller final image size
- Better caching
- Production optimizations

### Security features

- Non-root user (`nestjs:nodejs`)
- Alpine Linux (minimal attack surface)
- Health checks
- Read-only filesystem (where possible)

### Performance optimizations

- Node.js production build
- Prisma Client optimization
- Layer caching
- Minimal dependencies

## Docker Hub

To push to Docker Hub:

```bash
# Tag image
docker tag distanhilar-backend username/distanhilar-backend:latest

# Login
docker login

# Push
docker push username/distanhilar-backend:latest
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push
        run: |
          docker build -t distanhilar-backend .
          docker push distanhilar-backend
      - name: Deploy
        run: |
          ssh user@server "docker pull distanhilar-backend && docker-compose up -d"
```

## Support

For Docker-specific issues:

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)
