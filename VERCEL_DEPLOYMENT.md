# Deploying Smokava to Vercel

## Quick Summary

- ✅ **Frontend (Next.js)**: Deploy directly to Vercel
- ✅ **Admin Panel (Vite)**: Deploy as static site to Vercel
- ⚠️ **Backend**: Deploy to Railway/Render (not Vercel)

---

## Step 1: Deploy Backend First (Railway or Render)

Your backend needs a persistent server. Vercel is for serverless functions, not long-running Express servers.

### Option A: Railway (Recommended - Easy)
1. Go to [railway.app](https://railway.app)
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub"
4. Select your `backend` folder
5. Add environment variables:
   - `MONGODB_URI` (your MongoDB connection string)
   - `PORT` (Railway sets this automatically)
   - `JWT_SECRET` (if you have one)
   - Any other env vars from your `.env` file
6. Railway will auto-deploy and give you a URL like: `https://your-app.railway.app`

### Option B: Render
1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repo
4. Set root directory to `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables (same as Railway)

**Note:** After deployment, you'll get a backend URL like `https://your-backend.railway.app`

---

## Step 2: Deploy Frontend (Next.js) to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. **Important:** Set the root directory to `frontend`
5. Vercel will auto-detect Next.js
6. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api`
7. Click "Deploy"

**That's it!** Vercel will build and deploy your Next.js app.

---

## Step 3: Deploy Admin Panel to Vercel

1. In Vercel, click "Add New Project" again
2. Import the same GitHub repository
3. **Important:** Set root directory to `admin-panel`
4. Vercel will detect it as a static site
5. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.railway.app/api`
6. Click "Deploy"

---

## Environment Variables Checklist

### Backend (Railway/Render):
- `MONGODB_URI` - Your MongoDB connection string
- `PORT` - Usually auto-set by platform
- `JWT_SECRET` - Your JWT secret key
- Any other secrets from your `.env`

### Frontend (Vercel):
- `NEXT_PUBLIC_API_URL` - Your backend URL + `/api`

### Admin Panel (Vercel):
- `VITE_API_URL` - Your backend URL + `/api`

---

## Important Notes

1. **CORS**: The backend has been updated to support production URLs via environment variable. In Railway/Render, add:
   - `ALLOWED_ORIGINS` = `https://your-frontend.vercel.app,https://your-admin.vercel.app`
   - (Separate multiple URLs with commas)

2. **MongoDB**: Use MongoDB Atlas (cloud database) - not localhost

3. **API URLs**: Make sure all environment variables point to your deployed backend

---

## Quick Commands (Alternative - CLI)

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Deploy admin panel
cd ../admin-panel
vercel
```

---

## Troubleshooting

- **Build fails?** Check that all dependencies are in `package.json`
- **API errors?** Verify environment variables are set correctly
- **CORS errors?** Update backend CORS settings with your Vercel URLs
