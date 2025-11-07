# Quick Render Setup

## Step-by-Step Instructions

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Render deployment"
git push
```

### 2. Deploy on Render

**Option A: Automatic (Easiest)**
1. Go to https://dashboard.render.com/
2. Click "New" → "Blueprint"
3. Connect your GitHub repo
4. Render will detect `render.yaml` and create both services automatically

**Option B: Manual**
Follow the detailed steps in `DEPLOYMENT.md`

### 3. Configure Environment Variables

After both services are created, you need to set these:

**Backend Service Environment Variables:**
```
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

**Frontend Service Environment Variables:**
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### 4. Get Your URLs

After deployment completes:
- Backend: `https://cad-gis-converter-backend.onrender.com`
- Frontend: `https://cad-gis-converter-frontend.onrender.com` (or custom domain)

### 5. Update Environment Variables

1. Copy your backend URL
2. Go to frontend service → Environment
3. Set `REACT_APP_API_URL` to your backend URL
4. Save and redeploy

5. Copy your frontend URL
6. Go to backend service → Environment
7. Set `ALLOWED_ORIGINS` to your frontend URL
8. Save and redeploy

### 6. Test

Visit your frontend URL and try uploading a DXF file!

## Common Issues

**"CORS error"**
- Make sure `ALLOWED_ORIGINS` in backend matches your frontend URL exactly
- Include the protocol (https://)

**"Network Error" or "Failed to fetch"**
- Check that `REACT_APP_API_URL` in frontend is set correctly
- Verify backend service is running (check Render dashboard)

**Backend shows "CAD to GIS Converter API" message**
- This is normal! The backend is working
- The frontend should be at a different URL

## Free Tier Notes

- Backend will sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Frontend (static site) is always available
- Upgrade to paid tier ($7/month) to keep backend always on
