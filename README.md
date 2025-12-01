# Smokava (اسموکاوا)

A full-stack shisha package sharing app with social features.

## Features

- **Authentication**: Phone number login with JWT
- **Package Management**: Buy bulk shisha packages (10, 30, 50) and redeem at partner restaurants
- **Wallet**: Track remaining shishas and consumption history
- **Restaurant Directory**: List and map view of partner restaurants
- **Social Feed**: Share smoking activity (like Strava for shisha)
- **Profile**: User profile with stats
- **Admin Panel**: Full admin dashboard for managing users, packages, restaurants, and moderation
- **Role System**: User/Operator/Admin roles with proper access control
- **PWA Support**: Add-to-home screen functionality
- **Time-Based Packages**: Package activation with time windows (Iran timezone)

## Tech Stack

- **Frontend**: Next.js 14 + React + TailwindCSS (RTL enabled)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **State Management**: Zustand
- **Maps**: Mapbox
- **UI**: Farsi (Persian) with RTL layout
- **Deployment**: Docker + Docker Compose

## ⚠️ CRITICAL: Database Safety

**NEVER run these commands in production:**
- `docker compose down -v` - **DELETES ALL DATABASE DATA**
- `docker-compose down -v` - **DELETES ALL DATABASE DATA**
- `docker volume rm` on database volumes - **DELETES ALL DATA**

**ALWAYS:**
- Use `scripts/deploy-safe.sh` for deployments
- Backup before any deployment: `scripts/db-backup.sh`
- Use `docker compose up -d --no-deps` (preserves volumes)

See `DEPLOY_SAFE.md` for complete safety guidelines.

## Server Deployment

### Prerequisites

- Server with Docker and Docker Compose installed
- Domain names configured (or use server IP)
- MongoDB (can use MongoDB Atlas or local MongoDB in Docker)

### Quick Deploy

1. **Clone the repository on your server:**
```bash
cd /opt
git clone https://github.com/Baileysgin/Smokava.git
cd Smokava
```

2. **Set up environment variables:**
```bash
# Create .env file in project root
cp env.example .env
# Edit .env with your production values
```

Required environment variables (see `DOCS/ENV.md` for full list):
```bash
# Backend
MONGODB_URI=mongodb://mongodb:27017/smokava  # or MongoDB Atlas URI
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://smokava.com
ADMIN_PANEL_URL=https://admin.smokava.com
API_BASE_URL=https://api.smokava.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.smokava.com/api

# Admin Panel
VITE_API_URL=https://api.smokava.com/api
```

3. **Deploy using Docker Compose:**
```bash
# Start all services
docker-compose up -d

# Or use the deployment script
bash scripts/deploy.sh
```

4. **Create admin user:**
```bash
docker-compose exec backend node scripts/createAdmin.js admin yourpassword
```

5. **Set up hourly backups:**
```bash
# Add to crontab
0 * * * * /opt/smokava/scripts/db-backup.sh >> /var/log/smokava-backup.log 2>&1
```

### Services

After deployment, services will be available at:
- **Frontend**: `https://smokava.com` (or your configured domain)
- **Admin Panel**: `https://admin.smokava.com` (or your configured domain)
- **Backend API**: `https://api.smokava.com/api` (or your configured domain)

## Project Structure

```
smokava/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Utility scripts
│   └── server.js        # Express server
├── frontend/
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── store/           # Zustand stores
│   └── lib/             # Utilities
├── admin-panel/
│   ├── src/             # React admin panel
│   └── public/          # Static assets
├── scripts/              # Deployment scripts
├── .github/workflows/   # CI/CD workflows
└── docker-compose.yml    # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user

### Packages
- `GET /api/packages` - Get all packages
- `POST /api/packages/purchase` - Purchase a package
- `GET /api/packages/my-packages` - Get user's packages
- `POST /api/packages/generate-consumption-otp` - Generate OTP for consumption
- `POST /api/packages/verify-consumption-otp` - Verify and consume shisha
- `GET /api/packages/wallet/:userId/packages/:id/remaining-time` - Get package remaining time

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID

### Feed
- `GET /api/feed` - Get all posts
- `POST /api/feed` - Create a post
- `POST /api/feed/:id/like` - Like/Unlike a post
- `POST /api/feed/:id/comment` - Add comment

### Users
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user stats
- `GET /api/users/:id/public` - Get public profile
- `POST /api/users/:id/invite` - Generate invite link
- `POST /api/users/follow/:userId` - Follow/Unfollow user

### Admin (requires admin token)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - List users
- `GET /api/admin/posts` - List posts for moderation
- `POST /api/admin/users/:id/roles` - Assign roles
- See `DOCS/ADMIN.md` for full admin API documentation

## Deployment

See `DOCS/DEPLOY.md` for detailed deployment instructions including:
- Safe deployment procedures
- Database backup and restore
- CI/CD integration
- Troubleshooting

## Documentation

- **Deployment Guide**: `DOCS/DEPLOY.md`
- **Environment Variables**: `DOCS/ENV.md`
- **Admin Panel Guide**: `DOCS/ADMIN.md`
- **Git Setup**: `DOCS/GIT_SETUP.md`

## Security

- All production URLs must use HTTPS
- JWT_SECRET must be strong and unique
- MongoDB should be secured (use MongoDB Atlas or secure local instance)
- Regular backups are automated (hourly)
- Admin credentials should be changed after first login

## License

ISC
