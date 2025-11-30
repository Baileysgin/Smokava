# Environment Variables Guide

This document lists all required and optional environment variables for Smokava.

## Backend Environment Variables

### Required

```bash
# Database
# Use Docker service name in docker-compose or MongoDB Atlas
MONGODB_URI=mongodb://mongodb:27017/smokava
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smokava

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=5000
NODE_ENV=production
```

### Optional

```bash
# SMS Service (Kavenegar)
KAVENEGAR_API_KEY=your-api-key
KAVENEGAR_TEMPLATE=otp-v2
KAVENEGAR_SENDER=

# URLs
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
OPERATOR_PANEL_URL=https://operator.smokava.com
API_BASE_URL=https://api.smokava.com

# CORS
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com

# OTP Debug (development only)
OTP_DEBUG_SECRET_KEY=smokava-otp-debug-2024

# Payment Gateway
IPG_BASE_URL=https://payment.example.com
IPG_CALLBACK_URL=https://smokava.com/packages/payment-callback

# Timezone
TZ=Asia/Tehran

# Backup
BACKUP_PATH=/var/backups/smokava
RETENTION_DAYS=7
```

## Frontend Environment Variables

### Required

```bash
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
```

### Optional

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE=Smokava - اسموکاوا
NEXT_PUBLIC_ENAMAD_META_CODE=your-enamad-code
```

## Admin Panel Environment Variables

### Required

```bash
VITE_API_URL=https://api.smokava.com/api
```

## Docker Compose Environment Variables

Create a `.env` file in the project root:

```bash
# Database
MONGODB_URI=mongodb://mongodb:27017/smokava

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Kavenegar
KAVENEGAR_API_KEY=your-api-key
KAVENEGAR_TEMPLATE=otp-v2

# URLs
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
API_BASE_URL=https://api.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://www.smokava.com,https://admin.smokava.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.smokava.com/api
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Admin Panel
VITE_API_URL=https://api.smokava.com/api

# Backup
BACKUP_PATH=/var/backups/smokava
RETENTION_DAYS=7
```

## Production Setup

### 1. Create `.env` file

```bash
cp env.example .env
# Edit .env with production values
```

### 2. Set secure JWT secret

```bash
# Generate a secure random string
openssl rand -base64 32
# Add to JWT_SECRET in .env
```

### 3. Configure timezone

```bash
export TZ=Asia/Tehran
# Or add to .env
```

### 4. Set backup path

```bash
export BACKUP_PATH=/var/backups/smokava
mkdir -p $BACKUP_PATH
```

## Security Notes

1. **Never commit `.env` files to git**
2. **Use strong, unique JWT_SECRET in production**
3. **Restrict CORS origins in production**
4. **Use HTTPS in production**
5. **Rotate API keys regularly**
6. **Use environment-specific values**

## Environment-Specific Examples

### Development (Optional - for local testing only)

```bash
# Note: These are for local development only
# Production should NEVER use localhost
NODE_ENV=development
MONGODB_URI=mongodb://mongodb:27017/smokava
# Use your server IP or domain even in development
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
ALLOWED_ORIGINS=https://smokava.com,https://admin.smokava.com
```

### Staging

```bash
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/smokava
FRONTEND_URL=https://staging.smokava.com
```

### Production

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/smokava
FRONTEND_URL=https://smokava.com
# ... (use secure values)
```

