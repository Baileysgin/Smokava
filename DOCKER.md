# Docker Setup Guide

This project is fully dockerized with separate configurations for development and production.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8 or higher

## Quick Start

### Production Mode

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Development Mode

```bash
# Build and start all services with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## Services

- **MongoDB**: Running on port `27017`
- **Backend API**: Running on port `5000`
- **Frontend (Next.js)**: Running on port `3000`
- **Admin Panel (Vite)**: Running on port `5173` (dev) or `80` (prod)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
KAVENEGAR_API_KEY=your-kavenegar-api-key-here
KAVENEGAR_TEMPLATE=your-template-name-here
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Building Individual Services

### Backend
```bash
cd backend
docker build -t smokava-backend .
docker run -p 5000:5000 smokava-backend
```

### Frontend
```bash
cd frontend
docker build -t smokava-frontend .
docker run -p 3000:3000 smokava-frontend
```

### Admin Panel
```bash
cd admin-panel
docker build -t smokava-admin-panel .
docker run -p 5173:80 smokava-admin-panel
```

## Useful Commands

```bash
# Rebuild services after code changes
docker-compose build

# Rebuild and restart services
docker-compose up -d --build

# View logs for a specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f admin-panel

# Execute commands in a container
docker-compose exec backend sh
docker-compose exec frontend sh

# Remove all containers, networks, and volumes
docker-compose down -v

# Clean up unused Docker resources
docker system prune -a
```

## Database Access

MongoDB is accessible at `mongodb://localhost:27017/smokava` from your host machine.

To access MongoDB shell:
```bash
docker-compose exec mongodb mongosh smokava
```

## Troubleshooting

### Port Already in Use
If a port is already in use, you can change it in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change host port from 3000 to 3001
```

### MongoDB Connection Issues
Ensure MongoDB container is healthy:
```bash
docker-compose ps
```

### Rebuild After Dependency Changes
```bash
docker-compose build --no-cache
docker-compose up -d
```

### View Container Logs
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs admin-panel
docker-compose logs mongodb
```

## Production Deployment

For production, use the production docker-compose file and ensure:

1. All environment variables are set correctly
2. Use strong JWT_SECRET
3. Configure proper CORS origins in ALLOWED_ORIGINS
4. Use a managed MongoDB service or configure MongoDB with authentication
5. Set up proper reverse proxy (nginx/traefik) for SSL termination
6. Configure proper volume mounts for persistent data

