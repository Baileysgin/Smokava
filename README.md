# Smokava (اسموکاوا)

A full-stack shisha package sharing app with social features.

## Features

- **Authentication**: Phone number login with JWT
- **Package Management**: Buy bulk shisha packages (10, 30, 50) and redeem at partner restaurants
- **Wallet**: Track remaining shishas and consumption history
- **Restaurant Directory**: List and map view of partner restaurants
- **Social Feed**: Share smoking activity (like Strava for shisha)
- **Profile**: User profile with stats

## Tech Stack

- **Frontend**: Next.js 14 + React + TailwindCSS (RTL enabled)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **State Management**: Zustand
- **Maps**: Mapbox
- **UI**: Farsi (Persian) with RTL layout

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas connection string

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:

Backend (create `backend/.env`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

Frontend (create `frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

3. Seed the database:
```bash
npm run seed
```

4. Run the development server:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend server on http://localhost:3000

## Project Structure

```
smokava/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Seed script
│   └── server.js        # Express server
├── frontend/
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── store/           # Zustand stores
│   └── lib/             # Utilities
└── package.json         # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login/Register with phone number
- `GET /api/auth/me` - Get current user

### Packages
- `GET /api/packages` - Get all packages
- `POST /api/packages/purchase` - Purchase a package
- `GET /api/packages/my-packages` - Get user's packages
- `POST /api/packages/redeem` - Redeem shisha (consume)

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

## Usage

1. Open http://localhost:3000
2. Enter your phone number to login/register
3. Browse packages and purchase one
4. View your packages in "پکیج‌های من"
5. Find restaurants in "رستوران‌های همکار"
6. Share your activity in "فید اسموکاوا"
7. View your profile and stats

## Notes

- All UI is in Farsi (Persian) with RTL layout
- Dark theme with gold highlights
- Uses Vazirmatn font for Persian text
- Mapbox token is required for map functionality (get free token from mapbox.com)

## License

ISC
