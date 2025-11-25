# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm run install:all
```

This will install dependencies for:
- Root project
- Backend
- Frontend

## Step 2: Set Up Environment Variables

### Backend (`backend/.env`)
Create `backend/.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smokava
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
Create `frontend/.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**Note**: Get a free Mapbox token from https://account.mapbox.com/access-tokens/

## Step 3: Start MongoDB

Make sure MongoDB is running on your system. You can:
- Install MongoDB locally
- Use MongoDB Atlas (cloud) and update MONGODB_URI

## Step 4: Seed the Database

```bash
npm run seed
```

This will create:
- 3 packages (10, 30, 50 pack)
- 4 sample restaurants in Tehran

## Step 5: Run the Application

```bash
npm run dev
```

This will start:
- Backend server: http://localhost:5000
- Frontend server: http://localhost:3000

Open http://localhost:3000 in your browser.

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your MONGODB_URI in `backend/.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Map Not Loading
- Make sure you have a valid Mapbox token in `frontend/.env.local`
- Check browser console for errors

### Port Already in Use
- Change PORT in `backend/.env`
- Frontend uses port 3000 by default (change in `frontend/package.json`)

### TypeScript Errors
- Run `npm install` in both `frontend` and `backend` directories
- Some type errors may resolve after installing dependencies
