# 🚀 Admin Panel Chunk Splitting Fix - Deployment Guide

## Problem Fixed
- Fixed "Cannot read properties of undefined (reading 'version')" error
- Fixed blank white page issue
- React Router now properly bundled with React to ensure correct load order

## Files Changed
- `admin-panel/vite.config.ts` - Fixed chunk splitting configuration
- `admin-panel/src/main.tsx` - Added error handling

## Deployment Options

### Option 1: Git-Based Deployment (Recommended if server has git access)

1. **Commit and push changes locally:**
   ```bash
   cd /Users/negar/Desktop/Smokava
   git add admin-panel/vite.config.ts admin-panel/src/main.tsx
   git commit -m "Fix admin panel chunk splitting and React load order"
   git push origin main
   ```

2. **On the server, pull and rebuild:**
   ```bash
   ssh root@91.107.241.245
   cd /opt/smokava
   git pull origin main
   cd admin-panel
   cd ..
   docker compose build --no-cache admin-panel
   docker compose up -d admin-panel
   ```

3. **Verify deployment:**
   ```bash
   docker compose ps admin-panel
   docker compose logs --tail=50 admin-panel
   ```

### Option 2: Manual File Copy via SCP

1. **Copy files to server:**
   ```bash
   cd /Users/negar/Desktop/Smokava

   # Copy vite.config.ts
   scp admin-panel/vite.config.ts root@91.107.241.245:/opt/smokava/admin-panel/

   # Copy main.tsx
   scp admin-panel/src/main.tsx root@91.107.241.245:/opt/smokava/admin-panel/src/
   ```

2. **SSH into server and rebuild:**
   ```bash
   ssh root@91.107.241.245
   cd /opt/smokava
   docker compose build --no-cache admin-panel
   docker compose up -d admin-panel
   ```

### Option 3: Direct Server Edit

1. **SSH into server:**
   ```bash
   ssh root@91.107.241.245
   cd /opt/smokava/admin-panel
   ```

2. **Edit vite.config.ts:**
   ```bash
   nano vite.config.ts
   ```

   Update the `manualChunks` function to:
   ```typescript
   manualChunks: (id) => {
     // Vendor chunks - order matters for dependency resolution
     if (id.includes('node_modules')) {
       // All React-related packages must be in react-vendor to ensure React loads first
       if (
         id.includes('react') ||
         id.includes('react-router') ||
         id.includes('react-dom') ||
         id.includes('scheduler')
       ) {
         return 'react-vendor';
       }
       // Antd can be separate but depends on React (will load after react-vendor)
       if (id.includes('antd')) {
         return 'antd';
       }
       // Charts (depends on React, will load after react-vendor)
       if (id.includes('recharts')) {
         return 'charts';
       }
       // Utils (no React dependency)
       if (id.includes('axios') || id.includes('zustand') || id.includes('dayjs')) {
         return 'utils';
       }
       // Other node_modules (must not depend on React)
       return 'vendor';
     }
   },
   ```

3. **Edit src/main.tsx:**
   ```bash
   nano src/main.tsx
   ```

   Update the render section to include error handling:
   ```typescript
   try {
     createRoot(rootElement).render(
       <StrictMode>
         <ErrorBoundary>
           <App />
         </ErrorBoundary>
       </StrictMode>,
     )
   } catch (error) {
     console.error('Failed to render application:', error);
     rootElement.innerHTML = `
       <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
         <h1>خطا در بارگذاری برنامه</h1>
         <p>متأسفانه مشکلی در بارگذاری برنامه پیش آمده است. لطفا صفحه را رفرش کنید.</p>
         <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
           رفرش صفحه
         </button>
       </div>
     `;
   }
   ```

4. **Rebuild container:**
   ```bash
   cd /opt/smokava
   docker compose build --no-cache admin-panel
   docker compose up -d admin-panel
   ```

## Verification Steps

After deployment, verify the fix:

1. **Check container status:**
   ```bash
   docker compose ps admin-panel
   ```
   Should show: `Up` and `healthy`

2. **Check container logs:**
   ```bash
   docker compose logs --tail=50 admin-panel
   ```
   Should show no errors

3. **Test the admin panel:**
   - Visit: http://admin.smokava.com
   - Or: http://91.107.241.245:5173
   - Open browser DevTools (F12)
   - Check Console tab - should have NO errors
   - Page should load properly (not blank)

4. **Clear browser cache:**
   - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache manually

## Expected Result

✅ Admin panel loads successfully
✅ No blank white page
✅ No JavaScript errors in console
✅ Login page displays correctly
✅ React Router works properly

## Troubleshooting

### If container fails to start:
```bash
docker compose logs admin-panel
# Check for build errors
docker compose build admin-panel
```

### If page still shows blank:
1. Clear browser cache completely
2. Try in incognito/private window
3. Check browser console for errors
4. Verify container logs for runtime errors

### If you need to rollback:
```bash
cd /opt/smokava
git checkout HEAD~1 admin-panel/vite.config.ts admin-panel/src/main.tsx
docker compose build --no-cache admin-panel
docker compose up -d admin-panel
```

## Summary

The fix ensures that:
- React and React Router are bundled together in `react-vendor` chunk
- React loads before any code that depends on it
- Proper error handling is in place
- Browser cache can be cleared for fresh assets

After deployment, the admin panel should work correctly without the "Cannot read properties of undefined (reading 'version')" error.
