# Environment Variables Reference

This document lists all environment variables used in the Smokava project.

## 📁 File Locations

- **Root**: `env.example` - Master environment template
- **Backend**: `backend/.env` - Backend-specific variables
- **Frontend**: `frontend/.env.production` - Frontend production variables
- **Admin Panel**: `admin-panel/.env.production` - Admin panel production variables

## 🔧 Backend Environment Variables

### Required Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `production` | `development` |
| `PORT` | Server port | `5000` | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smokava` | `mongodb://localhost:27017/smokava` |
| `JWT_SECRET` | Secret for JWT token signing | `your-secret-key` | - |

### Optional Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `FRONTEND_URL` | User application URL (for CORS) | `https://mydomain.com` | - |
| `ADMIN_PANEL_URL` | Admin panel URL (for CORS) | `https://admin.mydomain.com` | - |
| `OPERATOR_PANEL_URL` | Operator panel URL (for CORS) | `https://operator.mydomain.com` | - |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins | `https://mydomain.com,https://admin.mydomain.com` | - |
| `KAVENEGAR_API_KEY` | Kavenegar SMS API key | `your-api-key` | - |
| `KAVENEGAR_TEMPLATE` | Kavenegar template name | `smokava-otp` | - |
| `IPG_BASE_URL` | Payment gateway base URL | `https://payment.example.com` | `https://payment.example.com` |
| `IPG_CALLBACK_URL` | Payment callback URL | `https://mydomain.com/packages/payment-callback` | Uses `FRONTEND_URL` |

### CORS Configuration

The backend uses the following priority for CORS origins:

1. `FRONTEND_URL` (if set)
2. `ADMIN_PANEL_URL` (if set)
3. `OPERATOR_PANEL_URL` (if set)
4. `ALLOWED_ORIGINS` (comma-separated list)
5. Development origins (only in development mode)

## 🎨 Frontend Environment Variables

### Required Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.mydomain.com/api` | `http://localhost:5000/api` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox API token | `pk.eyJ1Ijoi...` | - |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## 👨‍💼 Admin Panel Environment Variables

### Required Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.mydomain.com/api` | `http://localhost:5000/api` |

**Note**: Variables prefixed with `VITE_` are exposed to the browser.

## 🔄 Environment Variable Loading

### Development

- Backend: Loads from `backend/.env`
- Frontend: Loads from `frontend/.env.local` (not committed)
- Admin Panel: Loads from `admin-panel/.env.local` (not committed)

### Production

- Backend: Loads from `backend/.env` (on server)
- Frontend: Loads from `frontend/.env.production` (built into bundle)
- Admin Panel: Loads from `admin-panel/.env.production` (built into bundle)

## 🚀 Setting Up Environment Variables

### Local Development

1. Copy `env.example` to create `.env` files:
   ```bash
   cp env.example backend/.env
   cp env.example frontend/.env.local
   cp env.example admin-panel/.env.local
   ```

2. Update values in each file

### Production Deployment

1. On server, create environment files:
   ```bash
   cd /opt/smokava
   cp env.example backend/.env
   nano backend/.env  # Update values
   ```

2. For frontend and admin panel, create `.env.production`:
   ```bash
   cat > frontend/.env.production << EOF
   NEXT_PUBLIC_API_URL=https://api.mydomain.com/api
   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
   EOF

   cat > admin-panel/.env.production << EOF
   VITE_API_URL=https://api.mydomain.com/api
   EOF
   ```

3. Rebuild applications:
   ```bash
   cd frontend && npm run build
   cd ../admin-panel && npm run build
   ```

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Use HTTPS in production** - All API URLs should use `https://`
4. **Rotate secrets regularly** - Especially JWT_SECRET
5. **Use GitHub Secrets** - For CI/CD environment variables

## 📝 Example Production Configuration

### Backend `.env`

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smokava
JWT_SECRET=your-very-strong-secret-key-here
FRONTEND_URL=https://mydomain.com
ADMIN_PANEL_URL=https://admin.mydomain.com
OPERATOR_PANEL_URL=https://operator.mydomain.com
ALLOWED_ORIGINS=https://mydomain.com,https://admin.mydomain.com,https://operator.mydomain.com
KAVENEGAR_API_KEY=your-kavenegar-key
KAVENEGAR_TEMPLATE=smokava-otp
IPG_BASE_URL=https://payment.example.com
IPG_CALLBACK_URL=https://mydomain.com/packages/payment-callback
```

### Frontend `.env.production`

```env
NEXT_PUBLIC_API_URL=https://api.mydomain.com/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ.example
```

### Admin Panel `.env.production`

```env
VITE_API_URL=https://api.mydomain.com/api
```

## 🔍 Verifying Environment Variables

Run the verification script:

```bash
npm run verify
```

This checks:
- No hardcoded localhost URLs
- No hardcoded IP addresses
- Environment variables are used correctly
- `.env.example` files exist

